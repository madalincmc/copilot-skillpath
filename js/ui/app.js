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

  const STORAGE_NOTICES = {
    'unavailable': 'Your browser is blocking local storage, so your profile and progress will be lost when you close this page. Export your data (My Profile → Your data) before closing.',
    'write-failed': 'Saving failed (your browser storage may be full). Changes from now on are kept only until you close this page. Export your data (My Profile → Your data) before closing.',
    'newer-version': 'Your saved data was created by a newer version of Copilot SkillPath and was left untouched. Changes in this version are kept only until you close this page.',
    'recovered': 'Your saved data could not be read, so the app started fresh. A backup of the old data was kept in your browser.',
  };

  const routes = [
    { id: 'path', label: 'Starter Path' },
    { id: 'library', label: 'Prompt Library' },
    { id: 'profile', label: 'My Profile' },
    // Not in the menu; highlights its parent instead.
    { id: 'setup', label: 'Notebook setup', hidden: true, navParent: 'path' },
  ];
  const DEFAULT_ROUTE = 'path';

  function routeFromHash() {
    const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1];
    return routes.some((r) => r.id === id) ? id : DEFAULT_ROUTE;
  }

  function renderNav(nav, routeId) {
    const current = routes.find((r) => r.id === routeId);
    const active = current.navParent || current.id;
    clear(nav);
    nav.appendChild(h('ul', null, routes.filter((r) => !r.hidden).map((route) => h('li', null,
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
      main.appendChild(SP.views[route](app));
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
