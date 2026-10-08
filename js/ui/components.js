/*
 * Small shared UI pieces used by several views.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;

  function pageHeader(title, intro, actions) {
    return h('header', { class: 'page-header' },
      h('div', { class: 'page-header-text' }, h('h1', null, title), intro ? h('p', { class: 'lead' }, intro) : null),
      actions ? h('div', { class: 'page-header-actions' }, actions) : null);
  }

  function emptyState(...children) {
    return h('div', { class: 'empty-state' }, children);
  }

  /** Shows a short message in a live region, then clears it. */
  function flash(el, message) {
    el.textContent = message;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.textContent = '';
    }, 3000);
  }

  /**
   * Warns when the profile changed after the Notebook was set up, so Copilot still uses the old
   * details. Returns null when the Notebook is up to date (or was never set up).
   *   'details'  Update the instructions and reference files in the same Notebook; progress is kept.
   *   'stack'    A new framework or language needs a new Notebook and a fresh Starter Path.
   */
  function notebookBanner(app) {
    const store = app.store;
    const change = SP.config.compareNotebookProfile(store.getNotebookProfile(), store.getProfile());
    if (!change) return null;

    if (change === 'details') {
      return h('div', { class: 'notebook-banner', role: 'status' },
        h('p', null, h('strong', null, 'Your Notebook is out of date.'),
          ' You changed your profile after setting up your Notebook, so Copilot still uses your old details.'),
        h('p', null, 'Go through the setup again, but skip creating a Notebook. In the one you have, remove the old SkillPath files from References, add the new ones, and replace the instructions. Your progress is kept, so you continue from the step you are on.'),
        h('a', { class: 'button', href: '#/setup' }, 'Update my Notebook'));
    }

    const restart = h('button', { type: 'button', class: 'button' }, 'Start again with a new Notebook');
    let timer = null;
    restart.addEventListener('click', () => {
      if (!restart.classList.contains('is-confirming')) {
        restart.classList.add('is-confirming', 'button-danger');
        restart.textContent = 'Click again to clear your progress';
        timer = setTimeout(() => {
          restart.classList.remove('is-confirming', 'button-danger');
          restart.textContent = 'Start again with a new Notebook';
        }, 5000);
        return;
      }
      clearTimeout(timer);
      store.clearProgress();
      location.hash = '#/setup';
    });
    return h('div', { class: 'notebook-banner', role: 'status' },
      h('p', null, h('strong', null, 'Your Notebook is set up for a different stack.'),
        ' You changed your framework or language, so Copilot still teaches your old stack.'),
      h('p', null, 'Set up a new Notebook and start the Starter Path again. Starting again clears your step progress; your profile stays.'),
      h('div', { class: 'form-actions' },
        restart,
        h('a', { class: 'button button-secondary', href: '#/setup' }, 'Keep my progress and update my Notebook')));
  }

  SP.ui = Object.assign(SP.ui || {}, { pageHeader, emptyState, flash, notebookBanner });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
