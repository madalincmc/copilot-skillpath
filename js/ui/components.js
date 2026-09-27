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

  function exportPromptPack(store, format) {
    const date = SP.browser.today();
    const markdown = SP.exports.buildPromptPack({ profile: store.getProfile(), savedPrompts: store.listPrompts(), date });
    const type = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    SP.browser.downloadFile(SP.exports.promptPackFilename(date, format), markdown, type);
  }

  /** .txt is the main export because Copilot Notebooks accept .txt references but not .md. */
  function promptPackButton(app) {
    const download = (format) => () => {
      exportPromptPack(app.store, format);
      app.announce('Prompt Pack downloaded.');
    };
    return h('div', { class: 'export-actions' },
      h('button', { type: 'button', class: 'button button-secondary', onClick: download('txt') }, 'Export Prompt Pack'),
      h('button', { type: 'button', class: 'button-link', onClick: download('md'), title: 'Same content, as Markdown' }, 'or as .md'),
      h('p', { class: 'hint' }, 'The .txt file can be added to your Notebook as a reference.'));
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  SP.ui = Object.assign(SP.ui || {}, { pageHeader, emptyState, flash, exportPromptPack, promptPackButton, formatDate });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
