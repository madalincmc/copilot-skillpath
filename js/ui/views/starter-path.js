/*
 * Starter Path: the home screen. Ordered step cards with progress, a highlighted next step,
 * the step's prompts, and Mark as done. Any step can be opened; order is recommended, not enforced.
 * Step 0 is done through the Notebook setup wizard (#/setup) instead of prompts on the card.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;
  const { pageHeader, promptCard } = SP.ui;
  const config = SP.config;
  const DEFAULT_DOMAIN = 'automation-testing';

  const HELPER_TITLES = {
    'helper.resume': 'Continue where I left off',
    'helper.stuck': "I'm stuck",
    'helper.explain': 'Explain this',
    'helper.review': 'Review my work',
    'helper.quiz': 'Check my understanding',
  };
  // Which steps are expanded. Kept across re-renders for the whole session.
  const openSteps = new Set();
  let openedNextOnce = false;
  let pendingFocusId = null;

  /** Opens a step (and optionally focuses it) the next time the Starter Path renders. */
  function openStep(stepId, focus) {
    openSteps.add(stepId);
    openedNextOnce = true;
    if (focus) pendingFocusId = stepId;
  }

  function focusStep(stepId) {
    const el = document.getElementById('step-' + stepId);
    if (!el) return;
    el.open = true;
    el.querySelector('summary').focus();
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function findNextStep(path, done) {
    return path.steps.find((s) => !s.optional && !done.has(s.id)) || path.steps.find((s) => !done.has(s.id)) || null;
  }

  function stepPrompts(step, context, app) {
    const common = { step, context, domainId: context.domain.value };
    const card = (id, fallbackTitle, headingLevel) => promptCard(Object.assign({}, common, { template: SP.templates.get(id), fallbackTitle, headingLevel }));
    const blocks = [];

    if (step.mainTemplateId) {
      blocks.push(card(step.mainTemplateId, 'Guide me through this step'));
    }

    const helperIds = config.getHelperTemplateIds(step);
    if (helperIds.length) {
      blocks.push(h('details', { class: 'helpers' },
        h('summary', null, 'Need help with this step?'),
        h('div', { class: 'helpers-body' },
          helperIds.map((id) => card(id, HELPER_TITLES[id] || 'Helper prompt', 4)))));
    }
    return blocks;
  }

  function wizardBlock(isDone) {
    return h('div', { class: 'callout' },
      h('p', null, isDone
        ? 'Your Notebook is set up. You can go through the setup again at any time, for example to copy the instructions after changing your profile.'
        : 'A short guided setup: create the Notebook, paste your instructions, and let Copilot create your learning plan. About five minutes.'),
      h('a', { class: isDone ? 'button button-secondary' : 'button', href: '#/setup' }, isDone ? 'Go through the setup again' : 'Start Notebook setup'));
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
        !context
          ? h('div', { class: 'callout' },
            h('p', null, 'Create your learning profile to get prompts personalized for this step.'),
            h('a', { class: 'button', href: '#/profile' }, 'Create my learning profile'))
          : step.wizardId ? wizardBlock(isDone) : stepPrompts(step, context, app),
        // The setup wizard marks its step as done when finished, so it only offers undo here.
        step.wizardId && !isDone ? null : h('div', { class: 'step-actions' },
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
    focusStep(focusId);
  }

  /** Shown before a profile exists: the presets as one-click starts, or a custom profile. */
  function startCallout() {
    return h('div', { class: 'callout start-callout' },
      h('p', null, h('strong', null, 'Start here.'), ' Pick your stack; you can review the details before saving.'),
      h('div', { class: 'preset-grid' }, config.listPresets(DEFAULT_DOMAIN).map((preset) => h('button', {
        type: 'button',
        class: 'preset',
        onClick: () => SP.ui.openProfileWithPreset(preset.id),
      }, h('strong', null, preset.label), h('span', null, preset.description)))),
      h('a', { href: '#/profile' }, 'Or set up a custom profile'));
  }

  function starterPathView(app) {
    const store = app.store;
    const profile = store.getProfile();
    const path = config.getStarterPath((profile && profile.domain) || DEFAULT_DOMAIN);
    const done = new Set(store.getCompletedSteps());
    const next = findNextStep(path, done);
    const context = profile ? config.buildPromptContext(profile) : null;

    // Without a profile the steps have no prompts yet, so nothing opens by itself.
    if (!openedNextOnce && next && profile) {
      openSteps.add(next.id);
      openedNextOnce = true;
    }

    if (pendingFocusId) {
      const id = pendingFocusId;
      pendingFocusId = null;
      setTimeout(() => focusStep(id), 0);
    }

    const required = path.steps.filter((s) => !s.optional);
    const doneCount = required.filter((s) => done.has(s.id)).length;

    const nextBanner = next
      ? h('div', { class: 'next-step' },
        h('p', null, h('span', { class: 'next-label' }, 'Next step'), h('strong', null, 'Step ' + next.number + ': ' + next.title)),
        next.wizardId
          ? h('a', { class: 'button', href: '#/setup' }, 'Start Notebook setup')
          : h('button', { type: 'button', class: 'button', onClick: () => focusStep(next.id) }, 'Go to step'))
      : h('div', { class: 'next-step is-complete' },
        h('p', null, h('strong', null, 'You finished the Starter Path.'), ' Keep going with the Prompt Library, in the same Notebook.'),
        h('a', { class: 'button', href: '#/library' }, 'Open the Prompt Library'));

    return h('section', null,
      pageHeader(path.title,
        'Set up your Copilot Notebook, then follow the steps. Each step gives you a prompt to paste into the same Notebook.'),
      profile ? null : startCallout(),
      SP.ui.notebookBanner(app),
      h('div', { class: 'progress' },
        h('div', { class: 'progress-text' }, h('span', null, doneCount + ' of ' + required.length + ' steps done'), path.steps.some((s) => s.optional) ? h('span', { class: 'hint' }, 'Optional steps are not counted.') : null),
        h('progress', { max: String(required.length), value: String(doneCount), 'aria-label': 'Starter Path progress' })),
      profile ? nextBanner : null,
      h('ol', { class: 'step-list' }, path.steps.map((step) => h('li', null, stepCard(step, { done, next, context }, app)))));
  }

  SP.views = Object.assign(SP.views || {}, { path: starterPathView });
  SP.ui.starterPath = { openStep, findNextStep };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
