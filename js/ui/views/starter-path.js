/*
 * Starter Path: the home screen. Ordered step cards with progress, a highlighted next step,
 * the step's prompts, and Mark as done. Any step can be opened; order is recommended, not enforced.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;
  const { pageHeader, promptCard, promptPackButton } = SP.ui;
  const config = SP.config;
  const DEFAULT_DOMAIN = 'automation-testing';

  const HELPER_TITLES = {
    'helper.stuck': "I'm stuck",
    'helper.explain': 'Explain this',
    'helper.review': 'Review my work',
    'helper.quiz': 'Check my understanding',
  };
  const SETUP_TITLES = {
    'setup.notebook-instructions': 'Notebook instructions',
    'setup.initialize-workspace': 'Initialize my learning workspace',
  };

  // Which steps are expanded. Kept across re-renders for the whole session.
  const openSteps = new Set();
  let openedNextOnce = false;

  function findNextStep(path, done) {
    return path.steps.find((s) => !s.optional && !done.has(s.id)) || path.steps.find((s) => !done.has(s.id)) || null;
  }

  function checklist(step, context, store) {
    const list = config.getChecklist(step.checklistId);
    const ticks = store.getChecklist();
    return h('section', { class: 'checklist' },
      h('h3', null, list.title),
      h('p', { class: 'hint' }, 'Add these to your Notebook as references. Tick them off as you go.'),
      h('ul', null, list.items.map((item) => {
        const text = SP.engine.renderText(item.text, context);
        if (!text) return null;
        const id = 'check-' + step.id + '-' + item.id;
        return h('li', null,
          h('input', {
            type: 'checkbox',
            id,
            checked: ticks[item.id] === true,
            onChange: (e) => store.setChecklistItem(item.id, e.target.checked),
          }),
          h('label', { for: id }, text));
      })));
  }

  function stepPrompts(step, context, app) {
    const store = app.store;
    const common = { step, context, domainId: context.domain.value, store };
    const card = (id, fallbackTitle, saveTitle, headingLevel) => {
      const template = SP.templates.get(id);
      return promptCard(Object.assign({}, common, {
        template,
        fallbackTitle,
        saveTitle: template ? saveTitle(template) : undefined,
        headingLevel,
      }));
    };
    const blocks = [];

    for (const id of step.setupTemplateIds || []) {
      blocks.push(card(id, SETUP_TITLES[id] || 'Setup prompt', (t) => t.title));
    }
    if (step.checklistId) blocks.push(checklist(step, context, store));
    if (step.mainTemplateId) {
      blocks.push(card(step.mainTemplateId, 'Guide me through this step', () => 'Step ' + step.number + ' · ' + step.title));
    }

    const helperIds = config.getHelperTemplateIds(step);
    if (helperIds.length) {
      blocks.push(h('details', { class: 'helpers' },
        h('summary', null, 'Need help with this step?'),
        h('div', { class: 'helpers-body' },
          helperIds.map((id) => card(id, HELPER_TITLES[id] || 'Helper prompt', (t) => t.title + ' · Step ' + step.number + ' · ' + step.title, 4)))));
    }
    return blocks;
  }

  function stepCard(step, state, app) {
    const { done, next, context } = state;
    const isDone = done.has(step.id);
    const isNext = next && next.id === step.id;

    const details = h('details', { id: 'step-' + step.id, class: 'step' + (isDone ? ' is-done' : '') + (isNext ? ' is-next' : ''), open: openSteps.has(step.id) },
      h('summary', null,
        h('span', { class: 'step-number', 'aria-hidden': 'true' }, isDone ? '✓' : String(step.number)),
        h('span', { class: 'step-heading' },
          h('span', { class: 'step-title' }, 'Step ' + step.number + ': ' + step.title),
          isDone ? h('span', { class: 'tag tag-done' }, 'Done') : null,
          isNext ? h('span', { class: 'tag tag-next' }, 'Next') : null,
          step.optional ? h('span', { class: 'tag' }, 'Optional') : null)),
      h('div', { class: 'step-body' },
        h('p', null, step.summary),
        h('p', { class: 'done-when' }, h('strong', null, 'Done when: '), step.definitionOfDone),
        context
          ? stepPrompts(step, context, app)
          : h('div', { class: 'callout' },
            h('p', null, 'Create your learning profile to get prompts personalized for this step.'),
            h('a', { class: 'button', href: '#/profile' }, 'Create my learning profile')),
        h('div', { class: 'step-actions' },
          h('button', {
            type: 'button',
            class: isDone ? 'button button-secondary' : 'button button-success',
            onClick: () => toggleDone(step, !isDone, app),
          }, isDone ? 'Mark as not done' : 'Mark as done'))));

    details.addEventListener('toggle', () => {
      if (details.open) openSteps.add(step.id);
      else openSteps.delete(step.id);
    });
    return details;
  }

  function toggleDone(step, done, app) {
    const store = app.store;
    store.setStepDone(step.id, done);
    const path = config.getStarterPath((store.getProfile() || {}).domain || DEFAULT_DOMAIN);
    const next = findNextStep(path, new Set(store.getCompletedSteps()));

    let focusId = step.id;
    if (done) {
      openSteps.delete(step.id);
      if (next) {
        openSteps.add(next.id);
        focusId = next.id;
      }
    }
    app.rerender();
    app.announce(done ? 'Step ' + step.number + ' marked as done.' + (next ? ' Next: ' + next.title + '.' : ' You finished the Starter Path.') : 'Step ' + step.number + ' marked as not done.');

    const el = document.getElementById('step-' + focusId);
    if (el) {
      el.querySelector('summary').focus();
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  function starterPathView(app) {
    const store = app.store;
    const profile = store.getProfile();
    const path = config.getStarterPath((profile && profile.domain) || DEFAULT_DOMAIN);
    const done = new Set(store.getCompletedSteps());
    const next = findNextStep(path, done);
    const context = profile ? config.buildPromptContext(profile) : null;

    if (!openedNextOnce && next) {
      openSteps.add(next.id);
      openedNextOnce = true;
    }

    const required = path.steps.filter((s) => !s.optional);
    const doneCount = required.filter((s) => done.has(s.id)).length;

    const nextBanner = next
      ? h('div', { class: 'next-step' },
        h('p', null, h('span', { class: 'next-label' }, 'Next step'), h('strong', null, 'Step ' + next.number + ': ' + next.title)),
        h('button', {
          type: 'button',
          class: 'button',
          onClick: () => {
            const el = document.getElementById('step-' + next.id);
            el.open = true;
            el.querySelector('summary').focus();
            el.scrollIntoView({ block: 'start', behavior: 'smooth' });
          },
        }, 'Go to step'))
      : h('div', { class: 'next-step is-complete' },
        h('p', null, h('strong', null, 'You finished the Starter Path.'), ' Keep going with the Prompt Library, in the same Notebook.'),
        h('a', { class: 'button', href: '#/library' }, 'Open the Prompt Library'));

    return h('section', null,
      pageHeader(path.title,
        'Set up your Copilot Notebook, then follow the steps. Each step gives you a prompt to paste into the same Notebook.',
        profile ? promptPackButton(app) : null),
      profile ? null : h('div', { class: 'callout' },
        h('p', null, 'Start by creating your learning profile, so every prompt matches your setup.'),
        h('a', { class: 'button', href: '#/profile' }, 'Create my learning profile')),
      h('div', { class: 'progress' },
        h('div', { class: 'progress-text' }, h('span', null, doneCount + ' of ' + required.length + ' steps done'), path.steps.some((s) => s.optional) ? h('span', { class: 'hint' }, 'Optional steps are not counted.') : null),
        h('progress', { max: String(required.length), value: String(doneCount), 'aria-label': 'Starter Path progress' })),
      profile ? nextBanner : null,
      h('ol', { class: 'step-list' }, path.steps.map((step) => h('li', null, stepCard(step, { done, next, context }, app)))));
  }

  SP.views = Object.assign(SP.views || {}, { path: starterPathView });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
