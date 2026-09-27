/*
 * Prompt template engine. Pure functions only (no DOM, no storage), so it is deterministic and unit-testable.
 *
 * Template schema:
 *   id                 Unique template id.
 *   version            Positive integer. Bump whenever the prompt text changes.
 *   category           e.g. 'setup' | 'step' | 'helper' | 'library'.
 *   title              Shown above the prompt.
 *   description        "When to use" text.
 *   domains            Domain ids the template supports, or ['*'].
 *   requiredVariables  Variables that must be present in the context.
 *   optionalVariables  Variables that may be absent; a line using an absent one is dropped.
 *   inputs             Prompt-level inputs: [{ id, label, placeholder, multiline? }].
 *                      An empty input renders as its placeholder, e.g. "[PASTE THE ERROR HERE]".
 *   body               Main prompt text.
 *   interaction        Optional: how Copilot should interact (e.g. one step at a time).
 *   output             Optional: what Copilot should produce.
 *
 * Template syntax (in body, interaction, output):
 *   {{name}}                     Variable: the label of a context entry.
 *   {{input:id}}                 Prompt-level input.
 *   {{#if name}}...{{/if}}       Truthy check. Also {{#if !name}}.
 *   {{#if name == "value"}}      Compares the raw value (not the label). Also !=.
 *   {{#if name in ["a", "b"]}}   Raw value is one of the list.
 *   {{else}}                     Optional else branch. Blocks can be nested.
 *
 * Built-in variables available to every template when a step is passed:
 *   step.title, step.summary, step.number, step.definitionOfDone
 *
 * Context shape: { [name]: { value: string, label: string } }.
 */
(function (SP) {
  'use strict';

  // Marks an absent optional variable; any line containing it is removed after rendering.
  const DROP_LINE = '\u0000';
  const NAME = '[A-Za-z][\\w.]*';
  const NAME_RE = new RegExp('^' + NAME + '$');
  const INPUT_ID_RE = /^[A-Za-z][\w-]*$/;
  const SECTIONS = ['body', 'interaction', 'output'];
  const STEP_KEYS = ['title', 'summary', 'number', 'definitionOfDone'];

  class TemplateError extends Error {
    constructor(message) {
      super(message);
      this.name = 'TemplateError';
    }
  }

  function parseCondition(expr) {
    let m;
    if ((m = new RegExp('^(!?)\\s*(' + NAME + ')$').exec(expr))) {
      return { op: m[1] ? 'falsy' : 'truthy', name: m[2] };
    }
    if ((m = new RegExp('^(' + NAME + ')\\s*(==|!=)\\s*"([^"]*)"$').exec(expr))) {
      return { op: m[2] === '==' ? 'eq' : 'neq', name: m[1], value: m[3] };
    }
    if ((m = new RegExp('^(' + NAME + ')\\s+in\\s+\\[(.*)\\]$').exec(expr))) {
      const values = Array.from(m[2].matchAll(/"([^"]*)"/g), (x) => x[1]);
      if (values.length === 0) throw new TemplateError('Empty list in condition: ' + expr);
      return { op: 'in', name: m[1], values };
    }
    throw new TemplateError('Invalid condition: ' + expr);
  }

  function parse(source) {
    const tagRe = /\{\{\s*([^{}]*?)\s*\}\}/g;
    const root = [];
    const stack = [{ node: null, children: root }];
    const top = () => stack[stack.length - 1];
    let last = 0;
    let m;

    while ((m = tagRe.exec(source))) {
      const tag = m[1];
      let textEnd = m.index;
      let next = tagRe.lastIndex;

      // A block tag alone on its line is removed together with that line, so it adds no blank lines.
      if (/^(#if |else$|\/if$)/.test(tag)) {
        const lineStart = source.lastIndexOf('\n', m.index - 1) + 1;
        const newline = source.indexOf('\n', next);
        const lineEnd = newline === -1 ? source.length : newline;
        if (lineStart >= last && !source.slice(lineStart, m.index).trim() && !source.slice(next, lineEnd).trim()) {
          textEnd = lineStart;
          next = newline === -1 ? source.length : newline + 1;
        }
      }

      if (textEnd > last) top().children.push({ type: 'text', value: source.slice(last, textEnd) });
      last = next;
      tagRe.lastIndex = next;

      if (tag.startsWith('#if ')) {
        const node = { type: 'if', cond: parseCondition(tag.slice(4).trim()), then: [], else: null };
        top().children.push(node);
        stack.push({ node, children: node.then });
      } else if (tag === 'else') {
        const frame = top();
        if (!frame.node) throw new TemplateError('{{else}} outside of {{#if}}');
        if (frame.node.else) throw new TemplateError('Duplicate {{else}}');
        frame.node.else = [];
        frame.children = frame.node.else;
      } else if (tag === '/if') {
        if (stack.length === 1) throw new TemplateError('{{/if}} without matching {{#if}}');
        stack.pop();
      } else if (tag.startsWith('input:')) {
        const id = tag.slice(6).trim();
        if (!INPUT_ID_RE.test(id)) throw new TemplateError('Invalid input id: ' + id);
        top().children.push({ type: 'input', id });
      } else if (NAME_RE.test(tag)) {
        top().children.push({ type: 'var', name: tag });
      } else {
        throw new TemplateError('Unknown tag: {{' + tag + '}}');
      }
    }
    if (last < source.length) top().children.push({ type: 'text', value: source.slice(last) });
    if (stack.length > 1) throw new TemplateError('Unclosed {{#if}}');
    return root;
  }

  function collectRefs(nodes, refs) {
    refs = refs || { vars: new Set(), inputs: new Set() };
    for (const node of nodes) {
      if (node.type === 'var') refs.vars.add(node.name);
      else if (node.type === 'input') refs.inputs.add(node.id);
      else if (node.type === 'if') {
        refs.vars.add(node.cond.name);
        collectRefs(node.then, refs);
        if (node.else) collectRefs(node.else, refs);
      }
    }
    return refs;
  }

  function rawValue(context, name) {
    const entry = context[name];
    return entry && entry.value != null ? String(entry.value) : '';
  }

  function evalCondition(cond, context) {
    const value = rawValue(context, cond.name);
    switch (cond.op) {
      case 'truthy': return value.trim() !== '';
      case 'falsy': return value.trim() === '';
      case 'eq': return value === cond.value;
      case 'neq': return value !== cond.value;
      case 'in': return cond.values.includes(value);
    }
    return false;
  }

  function renderNodes(nodes, env) {
    let out = '';
    for (const node of nodes) {
      if (node.type === 'text') {
        out += node.value;
      } else if (node.type === 'var') {
        const entry = env.context[node.name];
        const label = entry && entry.label != null ? String(entry.label).trim() : '';
        if (label) out += label;
        else if (env.required.has(node.name)) out += '[MISSING: ' + node.name + ']';
        else out += DROP_LINE;
      } else if (node.type === 'input') {
        const raw = env.inputs[node.id];
        // Keep the user's indentation (code), but drop surrounding blank lines and trailing spaces.
        const value = raw == null ? '' : String(raw).replace(/^\s*\n/, '').replace(/\s+$/, '');
        if (value.trim()) out += value;
        else {
          const def = env.inputDefs[node.id];
          out += def && def.placeholder ? def.placeholder : '[' + node.id.toUpperCase() + ']';
        }
      } else if (node.type === 'if') {
        const branch = evalCondition(node.cond, env.context) ? node.then : node.else;
        if (branch) out += renderNodes(branch, env);
      }
    }
    return out;
  }

  function cleanup(text) {
    return text
      .split('\n')
      .filter((line) => !line.includes(DROP_LINE))
      .map((line) => line.replace(/[ \t]+$/, ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function withStep(context, step) {
    const ctx = Object.assign({}, context);
    if (step) {
      for (const key of STEP_KEYS) {
        if (step[key] != null && String(step[key]) !== '') {
          ctx['step.' + key] = { value: String(step[key]), label: String(step[key]) };
        }
      }
    }
    return ctx;
  }

  /** Returns a list of problems with a template definition; empty when valid. */
  function validateTemplate(template) {
    const errors = [];
    if (!template || typeof template !== 'object') return ['Template must be an object'];
    const where = template.id ? 'Template "' + template.id + '": ' : 'Template: ';

    if (typeof template.id !== 'string' || !template.id) errors.push(where + 'id is required');
    if (!Number.isInteger(template.version) || template.version < 1) errors.push(where + 'version must be a positive integer');
    if (typeof template.title !== 'string' || !template.title) errors.push(where + 'title is required');
    if (typeof template.body !== 'string' || !template.body.trim()) errors.push(where + 'body is required');
    for (const key of ['domains', 'requiredVariables', 'optionalVariables', 'inputs']) {
      if (template[key] != null && !Array.isArray(template[key])) errors.push(where + key + ' must be an array');
    }

    const declaredVars = new Set([].concat(template.requiredVariables || [], template.optionalVariables || []));
    const declaredInputs = new Set();
    for (const input of template.inputs || []) {
      if (!input || !INPUT_ID_RE.test(input.id || '')) errors.push(where + 'invalid input id');
      else if (declaredInputs.has(input.id)) errors.push(where + 'duplicate input "' + input.id + '"');
      else declaredInputs.add(input.id);
      if (input && !input.placeholder) errors.push(where + 'input "' + (input.id || '?') + '" needs a placeholder');
    }

    for (const section of SECTIONS) {
      const source = template[section];
      if (source == null) continue;
      if (typeof source !== 'string') {
        errors.push(where + section + ' must be a string');
        continue;
      }
      let refs;
      try {
        refs = collectRefs(parse(source));
      } catch (e) {
        errors.push(where + section + ': ' + e.message);
        continue;
      }
      for (const name of refs.vars) {
        if (!declaredVars.has(name) && !name.startsWith('step.')) {
          errors.push(where + section + ' uses undeclared variable "' + name + '"');
        }
        if (name.startsWith('step.') && !STEP_KEYS.includes(name.slice(5))) {
          errors.push(where + section + ' uses unknown step variable "' + name + '"');
        }
      }
      for (const id of refs.inputs) {
        if (!declaredInputs.has(id)) errors.push(where + section + ' uses undeclared input "' + id + '"');
      }
    }
    return errors;
  }

  /**
   * Generates a copy-ready prompt.
   * options: { context, inputs, step }
   * Returns { templateId, templateVersion, title, text, charCount, missing }.
   * `missing` lists required variables absent from the context; the UI should block copying when non-empty.
   */
  function generate(template, options) {
    const errors = validateTemplate(template);
    if (errors.length) throw new TemplateError(errors.join('\n'));

    const opts = options || {};
    const context = withStep(opts.context || {}, opts.step);
    const required = new Set(template.requiredVariables || []);
    const inputDefs = {};
    for (const input of template.inputs || []) inputDefs[input.id] = input;
    const env = { context, inputs: opts.inputs || {}, inputDefs, required };

    const missing = Array.from(required).filter((name) => {
      const entry = context[name];
      return !entry || entry.label == null || String(entry.label).trim() === '';
    });

    const text = SECTIONS
      .filter((section) => typeof template[section] === 'string')
      .map((section) => cleanup(renderNodes(parse(template[section]), env)))
      .filter(Boolean)
      .join('\n\n');

    return {
      templateId: template.id,
      templateVersion: template.version,
      title: template.title,
      text,
      charCount: Array.from(text).length,
      missing,
    };
  }

  /** Renders a short template string (e.g. a checklist item) against a context. Absent variables drop the line. */
  function renderText(source, context) {
    const env = { context: context || {}, inputs: {}, inputDefs: {}, required: new Set() };
    return cleanup(renderNodes(parse(source), env));
  }

  /**
   * Resolves a (sanitized) profile into a prompt context using field definitions.
   * fields:  field definitions (see config/domains.js)
   * derived: [{ id, compute(ctx) -> string }]
   */
  function buildContext(profile, fields, derived) {
    const ctx = {};
    const values = profile || {};
    for (const field of fields || []) {
      const raw = values[field.id];
      if (raw == null || String(raw).trim() === '') continue;
      const value = String(raw).trim();
      let label = value;
      if (Array.isArray(field.options)) {
        const option = field.options.find((o) => o.value === value);
        if (!option) continue;
        label = option.promptLabel || option.label;
        if (option.labelFromField) {
          const custom = values[option.labelFromField];
          if (custom != null && String(custom).trim()) label = String(custom).trim();
        }
      }
      ctx[field.id] = { value, label };
    }
    for (const d of derived || []) {
      const label = d.compute(ctx);
      if (label) ctx[d.id] = { value: label, label };
    }
    return ctx;
  }

  SP.engine = {
    TemplateError,
    parse,
    validateTemplate,
    generate,
    renderText,
    buildContext,
  };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
