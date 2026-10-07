/*
 * Version (#/version): the current version, its release date, and what changed in it.
 * Reached from the version link in the header; not in the main menu.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;
  const { pageHeader } = SP.ui;

  /** "2026-10-07" -> "7 October 2026", without depending on the browser's locale. */
  function formatDate(iso) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const [year, month, day] = iso.split('-').map(Number);
    return day + ' ' + months[month - 1] + ' ' + year;
  }

  function versionView() {
    const version = SP.config.version;
    const isBeta = /-beta\./.test(version.number);
    return h('section', null,
      pageHeader('Version ' + version.label,
        isBeta ? 'This is a beta version, on the way to the 1.0 release. Your feedback shapes what comes next.' : null),
      h('section', { class: 'panel', 'aria-labelledby': 'version-details' },
        h('h2', { id: 'version-details', class: 'visually-hidden' }, 'Release details'),
        h('dl', { class: 'version-details' },
          h('dt', null, 'Version'), h('dd', null, version.label + ' (' + version.number + ')'),
          h('dt', null, 'Released'), h('dd', null, h('time', { datetime: version.date }, formatDate(version.date))))),
      h('section', { class: 'panel', 'aria-labelledby': 'version-changes' },
        h('h2', { id: 'version-changes' }, 'What\'s new in this version'),
        h('ul', { class: 'version-changes' }, version.changes.map((change) => h('li', null, change)))));
  }

  SP.views = Object.assign(SP.views || {}, { version: versionView });
  SP.ui.formatVersionDate = formatDate;
})((globalThis.SkillPath = globalThis.SkillPath || {}));
