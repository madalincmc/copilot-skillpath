/*
 * Prompt Library: general prompts grouped by purpose (Plan, Learn, Practice, Build, Validate, Review),
 * for use in the same Notebook after or alongside the Starter Path.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;
  const { pageHeader, promptCard } = SP.ui;
  const config = SP.config;

  function libraryView(app) {
    const profile = app.store.getProfile();
    const header = pageHeader('Prompt Library',
      'More prompts for planning, learning, practice, building, and review. Use them in the same Copilot Notebook as your Starter Path.');

    if (!profile) {
      return h('section', null, header, h('div', { class: 'callout' },
        h('p', null, 'Create your learning profile first, so these prompts match your setup.'),
        h('a', { class: 'button', href: '#/profile' }, 'Create my learning profile')));
    }

    const context = config.buildPromptContext(profile);
    const templates = SP.templates.list({ category: 'library', domain: profile.domain });

    return h('section', null, header,
      h('nav', { class: 'chip-nav', 'aria-label': 'Prompt Library sections' },
        h('ul', null, config.libraryGroups
          .filter((g) => templates.some((t) => t.group === g.id))
          .map((g) => h('li', null, h('a', {
            href: '#library-' + g.id,
            onClick: (e) => {
              e.preventDefault();
              const section = document.getElementById('library-' + g.id);
              section.scrollIntoView({ block: 'start', behavior: 'smooth' });
              section.querySelector('h2').focus();
            },
          }, g.label))))),
      config.libraryGroups.map((group) => {
        const items = templates.filter((t) => t.group === group.id);
        if (!items.length) return null;
        return h('section', { class: 'library-group', id: 'library-' + group.id },
          h('h2', { tabindex: '-1' }, group.label),
          h('div', { class: 'library-cards' }, items.map((template) => promptCard({
            template,
            context,
            domainId: profile.domain,
          }))));
      }));
  }

  SP.views = Object.assign(SP.views || {}, { library: libraryView });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
