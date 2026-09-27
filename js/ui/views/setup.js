/*
 * Notebook setup wizard (#/setup): Step 0 of the Starter Path as a short linear flow with one action
 * per screen. Finishing it marks Step 0 as done and opens the next step on the Starter Path.
 * Screens come from config.wizards; the current screen is remembered for the session.
 */
(function (SP) {
  'use strict';

  const { h, clear } = SP.dom;
  const { pageHeader, promptCard } = SP.ui;
  const config = SP.config;

  let screenIndex = 0;

  function setupView(app) {
    const store = app.store;
    const profile = store.getProfile();

    if (!profile) {
      return h('section', null,
        pageHeader('Set up your Copilot Notebook', 'First tell the app what you want to learn, so the Notebook instructions match your setup.'),
        h('div', { class: 'callout' },
          h('p', null, 'Create your learning profile first. It takes under a minute with a preset.'),
          h('a', { class: 'button', href: '#/profile' }, 'Create my learning profile')));
    }

    const path = config.getStarterPath(profile.domain);
    const step = path.steps.find((s) => s.wizardId);
    const wizard = config.getWizard(step.wizardId);
    const context = config.buildPromptContext(profile);
    const root = h('section', { class: 'wizard' });
    if (screenIndex >= wizard.screens.length) screenIndex = 0;

    function go(index) {
      screenIndex = index;
      render();
      window.scrollTo(0, 0);
      root.querySelector('.wizard-screen h2').focus({ preventScroll: true });
    }

    function finish() {
      store.setStepDone(step.id, true);
      screenIndex = 0;
      const next = SP.ui.starterPath.findNextStep(path, new Set(store.getCompletedSteps()));
      if (next) SP.ui.starterPath.openStep(next.id, true);
      app.announce('Notebook setup finished.' + (next ? ' Next: ' + next.title + '.' : ''));
      location.hash = '#/path';
    }

    function render() {
      clear(root);
      const count = wizard.screens.length;
      const screen = wizard.screens[screenIndex];
      const isLast = screenIndex === count - 1;
      const template = screen.templateId ? SP.templates.get(screen.templateId) : null;

      root.append(
        pageHeader(wizard.title, wizard.intro),
        h('ol', { class: 'wizard-progress', 'aria-label': 'Setup progress' }, wizard.screens.map((s, i) => h('li', {
          class: i < screenIndex ? 'is-done' : i === screenIndex ? 'is-current' : null,
          'aria-current': i === screenIndex ? 'step' : null,
        },
        h('span', { class: 'wizard-progress-number', 'aria-hidden': 'true' }, i < screenIndex ? '✓' : String(i + 1)),
        h('span', null, s.title)))),
        h('div', { class: 'wizard-screen' },
          h('h2', { tabindex: '-1' }, 'Step ' + (screenIndex + 1) + ' of ' + count + ': ' + screen.title),
          screen.text.map((text) => h('p', null, SP.engine.renderText(text, context))),
          screen.link ? h('p', null, h('a', {
            class: 'button button-secondary',
            href: screen.link.href,
            target: '_blank',
            rel: 'noopener noreferrer',
          }, screen.link.label + ' ↗')) : null,
          template ? promptCard({
            template,
            step,
            context,
            domainId: profile.domain,
            store,
            saveTitle: template.title,
            hideDescription: true,
          }) : null,
          screen.note ? h('p', { class: 'hint' }, SP.engine.renderText(screen.note, context)) : null,
          h('div', { class: 'wizard-actions' },
            screenIndex > 0
              ? h('button', { type: 'button', class: 'button button-secondary', onClick: () => go(screenIndex - 1) }, 'Back')
              : h('a', { class: 'button button-secondary', href: '#/path' }, 'Back to the Starter Path'),
            h('button', {
              type: 'button',
              class: isLast ? 'button button-success' : 'button',
              onClick: isLast ? finish : () => go(screenIndex + 1),
            }, screen.doneLabel + (isLast ? '' : ' →')))));
    }

    render();
    return root;
  }

  SP.views = Object.assign(SP.views || {}, { setup: setupView });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
