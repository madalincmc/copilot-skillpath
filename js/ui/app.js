/*
 * App shell: navigation, hash routing, storage notice, and placeholder views.
 * Feature views (profile form, Starter Path cards, My Prompts, Library) plug into `views`.
 */
(function (SP) {
  'use strict';

  const { h, clear } = SP.dom;

  const STORAGE_NOTICES = {
    'unavailable': 'Your browser is blocking local storage, so your profile, progress, and saved prompts will be lost when you close this page. Export your data before closing.',
    'write-failed': 'Saving failed (your browser storage may be full). Changes from now on are kept only until you close this page. Export your data before closing.',
    'newer-version': 'Your saved data was created by a newer version of Copilot SkillPath and was left untouched. Changes in this version are kept only until you close this page.',
    'recovered': 'Your saved data could not be read, so the app started fresh. A backup of the old data was kept in your browser.',
  };

  const routes = [
    { id: 'path', label: 'Starter Path' },
    { id: 'prompts', label: 'My Prompts' },
    { id: 'library', label: 'Prompt Library' },
    { id: 'profile', label: 'My Profile' },
    { id: 'certifications', label: 'Certifications', badge: 'Soon' },
  ];
  const DEFAULT_ROUTE = 'path';

  function pageHeader(title, intro) {
    return h('header', { class: 'page-header' }, h('h1', null, title), intro ? h('p', { class: 'lead' }, intro) : null);
  }

  function placeholder(text) {
    return h('div', { class: 'empty-state' }, h('p', null, text));
  }

  const views = {
    path(app) {
      const profile = app.store.getProfile();
      const domainId = (profile && profile.domain) || 'automation-testing';
      const path = SP.config.getStarterPath(domainId);
      const done = new Set(app.store.getCompletedSteps());
      const required = path.steps.filter((s) => !s.optional);
      const doneCount = required.filter((s) => done.has(s.id)).length;

      return h('section', null,
        pageHeader(path.title, 'Set up your Copilot Notebook, then follow the steps. Each step gives you a prompt to paste into the same Notebook.'),
        profile ? null : h('div', { class: 'callout' },
          h('p', null, 'Start by creating your learning profile, so every prompt matches your setup.'),
          h('a', { class: 'button', href: '#/profile' }, 'Create my learning profile')),
        h('p', { class: 'progress-label' }, doneCount + ' / ' + required.length + ' steps done'),
        h('ol', { class: 'step-list' },
          path.steps.map((step) => h('li', { class: 'step-item' + (done.has(step.id) ? ' is-done' : '') },
            h('span', { class: 'step-number', 'aria-hidden': 'true' }, done.has(step.id) ? '✓' : String(step.number)),
            h('div', null,
              h('h2', { class: 'step-title' }, step.title, step.optional ? h('span', { class: 'tag' }, 'Optional') : null),
              h('p', { class: 'step-summary' }, step.summary))))));
    },

    prompts() {
      return h('section', null,
        pageHeader('My Prompts', 'Prompts you save from the Starter Path and the Prompt Library appear here, ready to copy again later.'),
        placeholder('No saved prompts yet.'));
    },

    library() {
      return h('section', null,
        pageHeader('Prompt Library', 'More prompts for planning, learning, practice, debugging, and review — for when you have finished the Starter Path.'),
        placeholder('The Prompt Library is on its way.'));
    },

    profile() {
      return h('section', null,
        pageHeader('My Learning Profile', 'Tell the app what you want to learn and what your setup is. Your answers personalize every prompt.'),
        placeholder('The profile form is on its way.'));
    },

    certifications() {
      return h('section', null,
        pageHeader('Certifications', 'Prepare for a certification with a dedicated Notebook, study plan, and practice prompts.'),
        placeholder('Coming soon.'));
    },
  };

  function currentRoute() {
    const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1];
    return routes.some((r) => r.id === id) ? id : DEFAULT_ROUTE;
  }

  function renderNav(nav, active) {
    clear(nav);
    nav.appendChild(h('ul', null, routes.map((route) => h('li', null,
      h('a', { href: '#/' + route.id, 'aria-current': route.id === active ? 'page' : null },
        route.label,
        route.badge ? h('span', { class: 'tag' }, route.badge) : null)))));
  }

  function renderNotice(container, status) {
    clear(container);
    const message = STORAGE_NOTICES[status.reason];
    container.hidden = !message;
    if (message) container.appendChild(h('p', null, message));
  }

  function render(app) {
    const route = currentRoute();
    renderNav(app.nav, route);
    renderNotice(app.notice, app.store.getStatus());
    clear(app.main);
    app.main.appendChild(views[route](app));
    const title = routes.find((r) => r.id === route).label;
    document.title = title + ' · Copilot SkillPath';
  }

  function start() {
    const configErrors = SP.config.validateConfig();
    if (configErrors.length) console.warn('[SkillPath] Configuration problems:\n' + configErrors.join('\n'));

    const app = {
      store: SP.storage.createStore(),
      nav: document.getElementById('nav'),
      main: document.getElementById('main'),
      notice: document.getElementById('storage-notice'),
    };
    SP.app = app;

    window.addEventListener('hashchange', () => {
      render(app);
      app.main.focus();
    });
    app.store.subscribe(() => render(app));
    render(app);
  }

  SP.ui = { views, routes };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})((globalThis.SkillPath = globalThis.SkillPath || {}));
