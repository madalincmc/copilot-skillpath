/*
 * Helpers over the configuration data: lookups, field visibility, option availability,
 * profile sanitizing/validation, prompt context building, and a config integrity check.
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  function matchRule(rule, values) {
    if (!rule) return true;
    if (Array.isArray(rule)) return rule.every((r) => matchRule(r, values));
    const value = values[rule.field] == null ? '' : String(values[rule.field]);
    if ('equals' in rule) return value === rule.equals;
    if ('notEquals' in rule) return value !== rule.notEquals;
    if ('in' in rule) return rule.in.includes(value);
    return false;
  }

  function getDomain(domainId) {
    return config.domains.find((d) => d.id === domainId) || null;
  }

  function listDomains() {
    return config.domains.slice();
  }

  /** Domain fields first, then common fields. Order matters: visibleWhen may only reference earlier fields. */
  function getFields(domainId) {
    const domain = getDomain(domainId);
    if (!domain) return [];
    return domain.fields.concat(config.commonFields);
  }

  function getDerived(domainId) {
    const domain = getDomain(domainId);
    return (domain && domain.derived ? domain.derived : []).concat(config.commonDerived);
  }

  function isFieldVisible(field, values) {
    return matchRule(field.visibleWhen, values);
  }

  function getAvailableOptions(field, values) {
    return (field.options || []).filter((o) => matchRule(o.availableWhen, values));
  }

  function getDefaults(domainId) {
    const values = { domain: domainId };
    for (const field of getFields(domainId)) {
      if (field.default != null) values[field.id] = field.default;
    }
    return values;
  }

  /**
   * Drops values of hidden fields and unavailable options, evaluating fields in order so that
   * a dropped value also hides the fields that depend on it.
   */
  function sanitizeProfile(profile) {
    const input = profile || {};
    const out = { domain: input.domain };
    for (const field of getFields(input.domain)) {
      const raw = input[field.id];
      if (raw == null || raw === '') continue;
      if (!isFieldVisible(field, out)) continue;
      if (field.options && !getAvailableOptions(field, out).some((o) => o.value === raw)) continue;
      out[field.id] = raw;
    }
    return out;
  }

  /** Returns { valid, errors: { [fieldId]: message } } for a profile. */
  function validateProfile(profile) {
    const errors = {};
    const domain = profile && getDomain(profile.domain);
    if (!domain) return { valid: false, errors: { domain: 'Choose a learning domain.' } };
    if (domain.comingSoon) return { valid: false, errors: { domain: 'This domain is coming soon.' } };

    const values = sanitizeProfile(profile);
    for (const field of getFields(domain.id)) {
      if (!isFieldVisible(field, values)) continue;
      const raw = values[field.id];
      const empty = raw == null || String(raw).trim() === '';
      if (empty) {
        if (field.required) errors[field.id] = field.type === 'select' ? 'Choose an option.' : 'This field is required.';
        continue;
      }
      if (field.type === 'number') {
        const n = Number(raw);
        if (!Number.isFinite(n)) errors[field.id] = 'Enter a number.';
        else if (field.min != null && n < field.min) errors[field.id] = 'Must be at least ' + field.min + '.';
        else if (field.max != null && n > field.max) errors[field.id] = 'Must be at most ' + field.max + '.';
      }
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  /** Builds the prompt-engine context for a profile, including the domain and derived variables. */
  function buildPromptContext(profile) {
    const values = sanitizeProfile(profile);
    const ctx = SP.engine.buildContext(values, getFields(values.domain), getDerived(values.domain));
    const domain = getDomain(values.domain);
    if (domain) ctx.domain = { value: domain.id, label: domain.label };
    return ctx;
  }

  /**
   * Human-readable profile rows for summaries: [{ id, label, value }].
   * Uses form labels (not prompt wording). "Other" options show the user's text, and fields that only
   * feed another row (e.g. frameworkOther) are left out.
   */
  function describeProfile(profile) {
    const values = sanitizeProfile(profile);
    const domain = getDomain(values.domain);
    if (!domain) return [];
    const fields = getFields(domain.id);
    const feeders = new Set();
    for (const field of fields) {
      for (const option of field.options || []) if (option.labelFromField) feeders.add(option.labelFromField);
    }
    const ctx = buildPromptContext(values);

    const rows = [{ id: 'domain', label: 'Learning domain', value: domain.label }];
    for (const field of fields) {
      const raw = values[field.id];
      if (raw == null || raw === '' || feeders.has(field.id)) continue;
      const summary = field.summary || {};
      if (summary.hidden) continue;
      let value = String(raw);
      if (summary.derived) {
        if (!ctx[summary.derived]) continue;
        value = ctx[summary.derived].label;
      } else if (field.options) {
        const option = field.options.find((o) => o.value === raw);
        const custom = option.labelFromField ? String(values[option.labelFromField] || '').trim() : '';
        value = custom || option.label;
      }
      rows.push({ id: field.id, label: field.label, value });
    }
    return rows;
  }

  function listPresets(domainId) {
    return config.presets.filter((p) => !domainId || p.domain === domainId);
  }

  /** Returns a new profile: domain defaults overlaid with the preset's values. */
  function applyPreset(presetId) {
    const preset = config.presets.find((p) => p.id === presetId);
    if (!preset) return null;
    return Object.assign(getDefaults(preset.domain), preset.values, { domain: preset.domain });
  }

  function getStarterPath(domainId) {
    const domain = getDomain(domainId);
    if (!domain || !domain.starterPathId) return null;
    return config.starterPaths.find((p) => p.id === domain.starterPathId) || null;
  }

  function getChecklist(checklistId) {
    return config.checklists.find((c) => c.id === checklistId) || null;
  }

  function getGuide(guideId) {
    return (config.guides || []).find((g) => g.id === guideId) || null;
  }

  function getHelperTemplateIds(step) {
    return step.helperTemplateIds || config.defaultHelperTemplateIds;
  }

  /**
   * Checks the configuration for authoring mistakes. Returns a list of error strings.
   * options.checkTemplates: also require every referenced template to be registered.
   */
  function validateConfig(options) {
    const opts = options || {};
    const errors = [];
    const groupIds = new Set(config.fieldGroups.map((g) => g.id));
    const domainIds = new Set();

    for (const domain of config.domains) {
      if (domainIds.has(domain.id)) errors.push('Duplicate domain "' + domain.id + '"');
      domainIds.add(domain.id);
      if (domain.comingSoon) continue;

      const seen = new Set();
      for (const field of getFields(domain.id)) {
        const where = domain.id + '.' + field.id + ': ';
        if (seen.has(field.id)) errors.push(where + 'duplicate field id');
        if (!groupIds.has(field.group)) errors.push(where + 'unknown group "' + field.group + '"');
        if (!['select', 'text', 'number'].includes(field.type)) errors.push(where + 'unknown type "' + field.type + '"');
        for (const rule of [].concat(field.visibleWhen || [])) {
          if (!seen.has(rule.field)) errors.push(where + 'visibleWhen must reference an earlier field, got "' + rule.field + '"');
        }
        if (field.type === 'select') {
          const values = (field.options || []).map((o) => o.value);
          if (!values.length) errors.push(where + 'select needs options');
          if (new Set(values).size !== values.length) errors.push(where + 'duplicate option values');
          if (field.default != null && !values.includes(field.default)) errors.push(where + 'default is not an option');
          for (const option of field.options || []) {
            for (const rule of [].concat(option.availableWhen || [])) {
              if (!seen.has(rule.field)) errors.push(where + 'option "' + option.value + '" availableWhen must reference an earlier field');
            }
            if (option.labelFromField && !getFields(domain.id).some((f) => f.id === option.labelFromField)) {
              errors.push(where + 'option "' + option.value + '" labelFromField references unknown field');
            }
          }
        }
        seen.add(field.id);
      }

      const path = getStarterPath(domain.id);
      if (!path) errors.push(domain.id + ': no Starter Path');
    }

    for (const preset of config.presets) {
      const where = 'preset ' + preset.id + ': ';
      const domain = getDomain(preset.domain);
      if (!domain) {
        errors.push(where + 'unknown domain');
        continue;
      }
      const profile = applyPreset(preset.id);
      const fields = getFields(domain.id);
      for (const key of Object.keys(preset.values)) {
        if (!fields.some((f) => f.id === key)) errors.push(where + 'unknown field "' + key + '"');
      }
      const sanitized = sanitizeProfile(profile);
      for (const key of Object.keys(preset.values)) {
        if (sanitized[key] !== profile[key]) errors.push(where + 'value for "' + key + '" is hidden or unavailable');
      }
      const result = validateProfile(profile);
      for (const [field, message] of Object.entries(result.errors)) errors.push(where + field + ': ' + message);
    }

    const templateIds = new Set();
    for (const path of config.starterPaths) {
      const stepIds = new Set();
      path.steps.forEach((step, index) => {
        const where = 'path ' + path.id + ' step ' + step.id + ': ';
        if (stepIds.has(step.id)) errors.push(where + 'duplicate step id');
        stepIds.add(step.id);
        if (step.number !== index) errors.push(where + 'numbers must be sequential from 0');
        if (!step.title || !step.summary || !step.definitionOfDone) errors.push(where + 'title, summary and definitionOfDone are required');
        if (!step.mainTemplateId && !step.setupTemplateIds) errors.push(where + 'needs mainTemplateId or setupTemplateIds');
        if (step.checklistId && !getChecklist(step.checklistId)) errors.push(where + 'unknown checklist "' + step.checklistId + '"');
        if (step.guideId && !getGuide(step.guideId)) errors.push(where + 'unknown guide "' + step.guideId + '"');
        [step.mainTemplateId].concat(step.setupTemplateIds || [], getHelperTemplateIds(step)).filter(Boolean).forEach((id) => templateIds.add(id));
      });
    }

    for (const checklist of config.checklists) {
      for (const item of checklist.items) {
        try {
          SP.engine.parse(item.text);
        } catch (e) {
          errors.push('checklist ' + checklist.id + '.' + item.id + ': ' + e.message);
        }
      }
    }

    for (const guide of config.guides || []) {
      guide.steps.forEach((text, i) => {
        try {
          SP.engine.parse(text);
        } catch (e) {
          errors.push('guide ' + guide.id + ' step ' + (i + 1) + ': ' + e.message);
        }
      });
    }

    if (opts.checkTemplates) {
      for (const id of templateIds) {
        if (!SP.templates || !SP.templates.get(id)) errors.push('template "' + id + '" is referenced but not registered');
      }
    }
    return errors;
  }

  Object.assign(config, {
    matchRule,
    getDomain,
    listDomains,
    getFields,
    getDerived,
    isFieldVisible,
    getAvailableOptions,
    getDefaults,
    sanitizeProfile,
    validateProfile,
    buildPromptContext,
    describeProfile,
    listPresets,
    applyPreset,
    getStarterPath,
    getChecklist,
    getGuide,
    getHelperTemplateIds,
    validateConfig,
  });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
