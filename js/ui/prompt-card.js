/*
 * Prompt card: shows a generated prompt with its "when to use" text, optional prompt-level inputs,
 * character count, and Copy. Used by the Starter Path, the setup wizard, and the Prompt Library.
 *
 * Typing in an input only updates this card, so the rest of the page (and its state) is untouched.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;
  const { flash } = SP.ui;
  let idCounter = 0;

  function fieldLabel(domainId, name) {
    const field = SP.config.getFields(domainId).find((f) => f.id === name);
    return field ? field.label : name;
  }

  /**
   * options:
   *   template       Template object, or null when it is not written yet.
   *   fallbackTitle  Title to show when the template is missing.
   *   step           Starter Path step (for step variables and saving).
   *   context        Prompt context from SP.config.buildPromptContext.
   *   domainId       For naming missing profile fields.
   *   headingLevel   2-4, default 3.
   *   hideDescription  Hide the "when to use" text when the surrounding page already explains it.
   */
  function promptCard(options) {
    const { template, step, context } = options;
    const Heading = 'h' + (options.headingLevel || 3);

    if (!template) {
      return h('article', { class: 'prompt-card is-missing' },
        h(Heading, { class: 'prompt-title' }, options.fallbackTitle || 'Prompt'),
        h('p', { class: 'prompt-when' }, 'This prompt is still being written. Check back soon.'));
    }

    const uid = 'pc' + ++idCounter;
    const inputs = {};
    const output = h('pre', { class: 'prompt-text', tabindex: '0', 'aria-label': 'Generated prompt: ' + template.title });
    const count = h('span', { class: 'char-count' });
    const status = h('span', { class: 'action-status', role: 'status', 'aria-live': 'polite' });
    const warning = h('div', { class: 'prompt-warning', hidden: true });
    const copyButton = h('button', { type: 'button', class: 'button' }, 'Copy prompt');
    let current = null;

    function update() {
      current = SP.engine.generate(template, { context, step, inputs });
      output.textContent = current.text;
      count.textContent = current.charCount + ' characters';

      const blocked = current.missing.length > 0;
      copyButton.disabled = blocked;
      SP.dom.clear(warning);
      warning.hidden = !blocked;
      if (blocked) {
        const names = current.missing.map((name) => fieldLabel(options.domainId, name));
        warning.append(
          h('p', null, 'This prompt needs more information from your profile: ' + names.join(', ') + '. '),
          h('a', { href: '#/profile' }, 'Update my profile'));
      }
    }

    copyButton.addEventListener('click', async () => {
      const ok = await SP.browser.copyText(current.text);
      flash(status, ok ? 'Copied. Paste it into your Copilot Notebook.' : 'Copy failed. Select the prompt text and copy it manually.');
    });

    let inputsBlock = null;
    if ((template.inputs || []).length) {
      const fields = template.inputs.map((input) => {
        const id = uid + '-' + input.id;
        const attrs = {
          id,
          class: 'input',
          placeholder: input.placeholder,
          onInput: (e) => {
            inputs[input.id] = e.target.value;
            update();
          },
        };
        const control = input.multiline ? h('textarea', Object.assign({ rows: '4', spellcheck: 'false' }, attrs)) : h('input', Object.assign({ type: 'text' }, attrs));
        return h('div', { class: 'form-field' }, h('label', { for: id }, input.label, h('span', { class: 'optional' }, ' (optional)')), control);
      });
      const reset = h('button', {
        type: 'button',
        class: 'button-link',
        onClick: () => {
          for (const control of inputsBlock.querySelectorAll('input, textarea')) control.value = '';
          for (const key of Object.keys(inputs)) delete inputs[key];
          update();
        },
      }, 'Clear inputs');
      inputsBlock = h('div', { class: 'prompt-inputs' },
        h('p', { class: 'hint' }, template.inputs.length === 1
          ? 'Fill this in now, or leave it empty and complete the [placeholder] in Copilot.'
          : 'Fill these in now, or leave them empty and complete the [placeholders] in Copilot.'),
        fields,
        reset);
    }

    update();

    return h('article', { class: 'prompt-card' },
      h(Heading, { class: 'prompt-title' }, template.title),
      template.description && !options.hideDescription ? h('p', { class: 'prompt-when' }, template.description) : null,
      inputsBlock,
      warning,
      output,
      h('div', { class: 'prompt-actions' }, copyButton, count, status));
  }

  SP.ui = Object.assign(SP.ui || {}, { promptCard });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
