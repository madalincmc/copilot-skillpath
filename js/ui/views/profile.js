/*
 * My Learning Profile: presets, the data-driven profile form, and data export/import.
 *
 * The form keeps a raw draft. What is shown (visible fields, available options) comes from the
 * sanitized draft, so switching a framework back and forth does not lose other answers, and only
 * the sanitized profile is saved.
 */
(function (SP) {
  'use strict';

  const { h, clear } = SP.dom;
  const { pageHeader, flash } = SP.ui;
  const config = SP.config;
  const DEFAULT_DOMAIN = 'automation-testing';

  function profileView(app) {
    const store = app.store;
    const saved = store.getProfile();
    let draft = saved ? Object.assign({}, saved) : config.getDefaults(DEFAULT_DOMAIN);
    let errors = {};
    let submitted = false;

    const formBody = h('div');
    const errorSummary = h('div', { class: 'error-summary', role: 'alert', tabindex: '-1', hidden: true });
    const formStatus = h('span', { class: 'action-status', role: 'status', 'aria-live': 'polite' });

    function revalidate() {
      if (submitted) errors = config.validateProfile(draft).errors;
    }

    function renderField(field, values) {
      const id = 'f-' + field.id;
      const error = errors[field.id];
      const errorId = id + '-error';
      const aria = { 'aria-invalid': error ? 'true' : null, 'aria-describedby': error ? errorId : null };
      let control;

      if (field.type === 'select') {
        const options = config.getAvailableOptions(field, values);
        control = h('select', Object.assign({ id, class: 'input', required: field.required }, aria),
          h('option', { value: '' }, 'Choose…'),
          options.map((o) => h('option', { value: o.value, selected: o.value === values[field.id] }, o.label)));
        control.addEventListener('change', (e) => {
          draft[field.id] = e.target.value;
          revalidate();
          renderForm();
        });
      } else {
        control = h('input', Object.assign({
          id,
          class: 'input',
          type: field.type === 'number' ? 'number' : 'text',
          value: draft[field.id] == null ? '' : String(draft[field.id]),
          min: field.min,
          max: field.max,
          placeholder: field.placeholder,
          required: field.required,
          inputmode: field.type === 'number' ? 'numeric' : null,
        }, aria));
        control.addEventListener('input', (e) => {
          draft[field.id] = e.target.value;
        });
        control.addEventListener('change', () => {
          if (!submitted) return;
          revalidate();
          renderForm();
        });
      }

      return h('div', { class: 'form-field' + (field.type === 'number' ? ' is-short' : '') },
        h('label', { for: id }, field.label, field.required ? null : h('span', { class: 'optional' }, ' (optional)')),
        control,
        error ? h('p', { id: errorId, class: 'field-error' }, error) : null);
    }

    function renderDomainField() {
      const domains = config.listDomains();
      const select = h('select', { id: 'f-domain', class: 'input', required: true },
        domains.map((d) => h('option', { value: d.id, disabled: d.comingSoon, selected: d.id === draft.domain },
          d.label + (d.comingSoon ? ' (coming soon)' : ''))));
      select.addEventListener('change', (e) => {
        draft = config.getDefaults(e.target.value);
        revalidate();
        renderForm();
      });
      return h('div', { class: 'form-field' }, h('label', { for: 'f-domain' }, 'What do you want to learn?'), select);
    }

    /** Rebuilds the form fields, keeping focus on the same field. */
    function renderForm() {
      const focusedId = document.activeElement && document.activeElement.id;
      const values = config.sanitizeProfile(draft);
      const fields = config.getFields(draft.domain);

      clear(formBody);
      formBody.appendChild(renderDomainField());
      for (const group of config.fieldGroups) {
        const visible = fields.filter((f) => f.group === group.id && config.isFieldVisible(f, values));
        if (!visible.length) continue;
        formBody.appendChild(h('fieldset', { class: 'form-group' },
          h('legend', null, group.label),
          h('div', { class: 'form-grid' }, visible.map((f) => renderField(f, values)))));
      }

      if (focusedId) {
        const el = document.getElementById(focusedId);
        if (el && formBody.contains(el)) el.focus();
      }
    }

    function showErrorSummary() {
      clear(errorSummary);
      const ids = Object.keys(errors);
      errorSummary.hidden = ids.length === 0;
      if (!ids.length) return;
      const fields = config.getFields(draft.domain);
      errorSummary.append(
        h('p', null, ids.length === 1 ? 'Please fix 1 field:' : 'Please fix ' + ids.length + ' fields:'),
        h('ul', null, ids.map((id) => {
          const field = fields.find((f) => f.id === id);
          return h('li', null, h('a', {
            href: '#f-' + id,
            onClick: (e) => {
              e.preventDefault();
              const el = document.getElementById('f-' + id);
              if (el) el.focus();
            },
          }, (field ? field.label : id) + ': ' + errors[id]));
        })));
      errorSummary.focus();
    }

    function onSubmit(e) {
      e.preventDefault();
      submitted = true;
      const result = config.validateProfile(draft);
      errors = result.errors;
      renderForm();
      showErrorSummary();
      if (!result.valid) return;

      const isFirstProfile = !store.getProfile();
      store.saveProfile(config.sanitizeProfile(draft));
      if (isFirstProfile) {
        app.announce('Profile saved. Start with Step 0.');
        location.hash = '#/path';
      } else {
        flash(formStatus, 'Profile saved. Your prompts now use these details.');
      }
    }

    function applyPreset(presetId, label) {
      draft = config.applyPreset(presetId);
      errors = {};
      submitted = false;
      renderForm();
      showErrorSummary();
      app.announce('Preset "' + label + '" applied. Review the fields, then save.');
    }

    renderForm();

    const presets = config.listPresets(draft.domain);
    return h('section', null,
      pageHeader('My Learning Profile', 'Tell the app what you want to learn and what your setup is. Your answers personalize every prompt.'),
      presets.length ? h('section', { class: 'panel', 'aria-labelledby': 'presets-title' },
        h('h2', { id: 'presets-title' }, 'Start from a preset'),
        h('p', { class: 'hint' }, 'Pick the one closest to you. You can change any answer below.'),
        h('div', { class: 'preset-grid' }, presets.map((p) => h('button', {
          type: 'button',
          class: 'preset',
          onClick: () => applyPreset(p.id, p.label),
        }, h('strong', null, p.label), h('span', null, p.description))))) : null,
      h('form', { class: 'profile-form', novalidate: true, onSubmit },
        errorSummary,
        formBody,
        h('div', { class: 'form-actions' },
          h('button', { type: 'submit', class: 'button' }, saved ? 'Save changes' : 'Save and start'),
          formStatus)),
      dataSection(app));
  }

  /** Export and import of all local data as a JSON file. */
  function dataSection(app) {
    const store = app.store;
    const status = h('span', { class: 'action-status', role: 'status', 'aria-live': 'polite' });
    const importPanel = h('div', { class: 'import-panel', hidden: true });
    const fileInput = h('input', { type: 'file', accept: '.json,application/json', class: 'visually-hidden', id: 'import-file', tabindex: '-1' });

    function showImportPanel(...children) {
      clear(importPanel);
      importPanel.append(...children);
      importPanel.hidden = false;
    }

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      let data;
      try {
        data = SP.exports.parseDataFile(await SP.browser.readFileAsText(file));
      } catch (e) {
        showImportPanel(h('p', { class: 'field-error', role: 'alert' }, 'Could not import "' + file.name + '": ' + e.message));
        return;
      }
      const confirmButton = h('button', {
        type: 'button',
        class: 'button button-danger',
        onClick: () => {
          store.replaceState(data);
          app.rerender();
          app.announce('Data imported.');
        },
      }, 'Replace my data');
      showImportPanel(
        h('p', null, '"' + file.name + '" contains ' + SP.exports.summarizeData(data) + '.'),
        h('p', null, 'Importing replaces your current profile, progress, and saved prompts on this computer. This cannot be undone.'),
        h('div', { class: 'form-actions' },
          confirmButton,
          h('button', { type: 'button', class: 'button button-secondary', onClick: () => { importPanel.hidden = true; } }, 'Cancel')));
      confirmButton.focus();
    });

    return h('section', { class: 'panel', 'aria-labelledby': 'data-title' },
      h('h2', { id: 'data-title' }, 'Your data'),
      h('p', { class: 'hint' }, 'Everything is stored only in this browser. Export a backup file to move your setup to another computer or restore it later.'),
      h('div', { class: 'form-actions' },
        h('button', {
          type: 'button',
          class: 'button button-secondary',
          onClick: () => {
            const date = SP.browser.today();
            const json = SP.exports.serializeDataFile(store.exportState(), new Date().toISOString());
            SP.browser.downloadFile(SP.exports.dataFilename(date), json, 'application/json');
            flash(status, 'Data file downloaded.');
          },
        }, 'Export data (.json)'),
        h('button', { type: 'button', class: 'button button-secondary', onClick: () => fileInput.click() }, 'Import data (.json)'),
        fileInput,
        status),
      importPanel);
  }

  SP.views = Object.assign(SP.views || {}, { profile: profileView });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
