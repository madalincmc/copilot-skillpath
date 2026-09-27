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

  SP.ui = Object.assign(SP.ui || {}, { pageHeader, emptyState, flash });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
