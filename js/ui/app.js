/*
 * App shell: navigation, hash routing, storage notice, screen-reader announcements.
 *
 * Views live in js/ui/views/ and register on SkillPath.views as functions (app) -> Element.
 * The main area is only re-rendered on navigation or when a view calls app.rerender(), so
 * typing in a form or prompt card never loses its state to a background re-render.
 */
(function (SP) {
  'use strict';

  const { h, clear } = SP.dom;
  const { pageHeader, emptyState } = SP.ui;

  const STORAGE_NOTICES = {
    'unavailable': 'Your browser is blocking local storage, so your profile, progress, and saved prompts will be lost when you close this page. Export your data (My Profile → Your data) before closing.',
    'write-failed': 'Saving failed (your browser storage may be full). Changes from now on are kept only until you close this page. Export your data (My Profile → Your data) before closing.',
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

  // Views not built yet. Feature files override these by registering the same id.
  const placeholderViews = {
    library: () => h('section', null,
      pageHeader('Prompt Library', 'More prompts for planning, learning, practice, debugging, and review, for when you have finished the Starter Path.'),
      emptyState(h('p', null, 'The Prompt Library is on its way.'))),
    certifications: () => h('section', null,
      pageHeader('Certifications', 'Prepare for a certification with a dedicated Notebook, study plan, and practice prompts.'),
      emptyState(h('p', null, 'Coming soon.'))),
  };

  function routeFromHash() {
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

  function start() {
    const configErrors = SP.config.validateConfig();
    if (configErrors.length) console.warn('[SkillPath] Configuration problems:\n' + configErrors.join('\n'));

    const nav = document.getElementById('nav');
    const main = document.getElementById('main');
    const notice = document.getElementById('storage-notice');
    const announcer = document.getElementById('announcer');
    let route = routeFromHash();

    const app = {
      store: SP.storage.createStore(),

      rerender() {
        const scrollY = window.scrollY;
        renderView();
        window.scrollTo(0, scrollY);
      },

      /** Announces a message to screen readers (and shows nothing visually). */
      announce(message) {
        announcer.textContent = '';
        // A fresh text node after clearing makes screen readers announce repeated messages too.
        setTimeout(() => {
          announcer.textContent = message;
        }, 50);
      },
    };
    SP.app = app;

    function renderView() {
      renderNav(nav, route);
      renderNotice(notice, app.store.getStatus());
      clear(main);
      const view = (SP.views && SP.views[route]) || placeholderViews[route];
      main.appendChild(view(app));
      document.title = routes.find((r) => r.id === route).label + ' · Copilot SkillPath';
    }

    window.addEventListener('hashchange', () => {
      // In-page anchors such as the skip link (#main) are not routes.
      if (location.hash && !location.hash.startsWith('#/')) return;
      route = routeFromHash();
      renderView();
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
    });
    app.store.subscribe(() => renderNotice(notice, app.store.getStatus()));
    renderView();
  }

  SP.ui = Object.assign(SP.ui || {}, { routes });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})((globalThis.SkillPath = globalThis.SkillPath || {}));
