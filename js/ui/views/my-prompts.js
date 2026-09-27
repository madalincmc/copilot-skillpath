/*
 * My Prompts: saved prompts grouped by Starter Path step, with copy, delete, and regenerate
 * when a newer template version exists.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;
  const { pageHeader, emptyState, flash, formatDate } = SP.ui;
  const config = SP.config;

  function findStep(stepId) {
    for (const path of config.starterPaths) {
      const step = path.steps.find((s) => s.id === stepId);
      if (step) return step;
    }
    return null;
  }

  /** Groups prompts: Starter Path steps in order, then Prompt Library, then anything else. Newest first. */
  function groupPrompts(prompts) {
    const groups = new Map();
    const add = (key, title, order, prompt) => {
      if (!groups.has(key)) groups.set(key, { title, order, prompts: [] });
      groups.get(key).prompts.push(prompt);
    };
    for (const prompt of prompts) {
      const step = prompt.stepId ? findStep(prompt.stepId) : null;
      if (step) add(step.id, 'Step ' + step.number + ': ' + step.title, step.number, prompt);
      else if (!prompt.stepId) add('library', 'Prompt Library', 1000, prompt);
      else add('other', 'Other', 1001, prompt);
    }
    const list = Array.from(groups.values()).sort((a, b) => a.order - b.order);
    for (const group of list) group.prompts.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    return list;
  }

  function savedPromptItem(prompt, app) {
    const store = app.store;
    const status = h('span', { class: 'action-status', role: 'status', 'aria-live': 'polite' });
    const template = prompt.templateId ? SP.templates.get(prompt.templateId) : null;
    const outdated = template && prompt.templateVersion != null && template.version > prompt.templateVersion;

    const deleteButton = h('button', { type: 'button', class: 'button button-secondary' }, 'Delete');
    let confirmTimer = null;
    deleteButton.addEventListener('click', () => {
      if (!deleteButton.classList.contains('is-confirming')) {
        deleteButton.classList.add('is-confirming', 'button-danger');
        deleteButton.textContent = 'Click again to delete';
        confirmTimer = setTimeout(() => {
          deleteButton.classList.remove('is-confirming', 'button-danger');
          deleteButton.textContent = 'Delete';
        }, 4000);
        return;
      }
      clearTimeout(confirmTimer);
      store.removePrompt(prompt.id);
      app.rerender();
      app.announce('Prompt deleted.');
    });

    function regenerate() {
      const profile = store.getProfile();
      if (!profile) {
        flash(status, 'Create your learning profile first.');
        return;
      }
      const result = SP.engine.generate(template, { context: config.buildPromptContext(profile), step: findStep(prompt.stepId) });
      if (result.missing.length) {
        flash(status, 'Your profile is missing details this prompt needs. Update your profile first.');
        return;
      }
      store.updatePrompt(prompt.id, { text: result.text, templateVersion: template.version });
      app.rerender();
      app.announce('Prompt regenerated with the latest version. Fill in any [placeholders] again.');
    }

    return h('li', null, h('article', { class: 'saved-prompt' },
      h('header', { class: 'saved-prompt-header' },
        h('h3', { class: 'prompt-title' }, prompt.title),
        h('p', { class: 'meta' },
          'Saved ' + formatDate(prompt.savedAt),
          prompt.templateVersion != null ? ' · version ' + prompt.templateVersion : null,
          outdated ? h('span', { class: 'tag tag-next' }, 'Newer version available') : null)),
      h('pre', { class: 'prompt-text', tabindex: '0', 'aria-label': 'Saved prompt: ' + prompt.title }, prompt.text),
      h('div', { class: 'prompt-actions' },
        h('button', {
          type: 'button',
          class: 'button',
          onClick: async () => {
            const ok = await SP.browser.copyText(prompt.text);
            flash(status, ok ? 'Copied. Paste it into your Copilot Notebook.' : 'Copy failed. Select the prompt text and copy it manually.');
          },
        }, 'Copy prompt'),
        outdated ? h('button', { type: 'button', class: 'button button-secondary', onClick: regenerate }, 'Regenerate') : null,
        deleteButton,
        status)));
  }

  function myPromptsView(app) {
    const store = app.store;
    const prompts = store.listPrompts();

    const header = pageHeader('My Prompts',
      'Prompts you saved, ready to copy again into your Copilot Notebook.');

    if (!prompts.length) {
      return h('section', null, header, emptyState(
        h('p', null, 'No saved prompts yet. Use "Save to My Prompts" on any prompt in the Starter Path.'),
        h('a', { class: 'button', href: '#/path' }, 'Go to the Starter Path')));
    }

    return h('section', null, header,
      groupPrompts(prompts).map((group) => h('section', { class: 'prompt-group' },
        h('h2', null, group.title),
        h('ol', { class: 'saved-list' }, group.prompts.map((p) => savedPromptItem(p, app))))));
  }

  SP.views = Object.assign(SP.views || {}, { prompts: myPromptsView });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
