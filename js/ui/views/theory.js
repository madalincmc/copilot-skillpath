/*
 * Theory: short chapters to read in the app, each with a "Go deeper in Copilot" prompt for the
 * learner's stack and a shortcut to a quiz on the same topic.
 */
(function (SP) {
  'use strict';

  const { h } = SP.dom;
  const { pageHeader, promptCard } = SP.ui;
  const config = SP.config;
  const DEFAULT_DOMAIN = 'automation-testing';

  function scrollToChapter(id) {
    const section = document.getElementById('theory-' + id);
    section.scrollIntoView({ block: 'start', behavior: 'smooth' });
    section.querySelector('h2').focus({ preventScroll: true });
  }

  function chapterActions(chapter, context, domainId) {
    if (!context) {
      return h('p', { class: 'hint' }, h('a', { href: '#/profile' }, 'Create your learning profile'), ' to get a Copilot prompt and a quiz for your stack.');
    }
    const theoryTopic = SP.engine.renderText(chapter.deeperTopic, context);
    return h('div', { class: 'theory-actions' },
      h('details', { class: 'theory-deeper' },
        h('summary', null, 'Go deeper in Copilot'),
        promptCard({
          template: SP.templates.get('theory.deeper'),
          context: Object.assign({}, context, { theoryTopic: { value: chapter.id, label: theoryTopic } }),
          domainId,
          headingLevel: 3,
        })),
      h('button', { type: 'button', class: 'button button-secondary', onClick: () => SP.ui.openQuiz(chapter.quizTopicId) }, 'Quiz me on this'));
  }

  function theoryView(app) {
    const profile = app.store.getProfile();
    const domainId = (profile && profile.domain) || DEFAULT_DOMAIN;
    const theory = SP.content.getTheory(domainId);
    const context = profile ? config.buildPromptContext(profile) : null;

    return h('section', null,
      pageHeader(theory.title, theory.intro),
      h('nav', { class: 'chip-nav', 'aria-label': 'Chapters' },
        h('ol', null, theory.chapters.map((chapter, i) => h('li', null, h('a', {
          href: '#theory-' + chapter.id,
          onClick: (e) => {
            e.preventDefault();
            scrollToChapter(chapter.id);
          },
        }, (i + 1) + '. ' + chapter.title))))),
      theory.chapters.map((chapter, i) => h('section', { class: 'theory-chapter', id: 'theory-' + chapter.id },
        h('h2', { tabindex: '-1' }, (i + 1) + '. ' + chapter.title),
        chapter.summary.map((paragraph) => h('p', null, paragraph)),
        h('h3', null, 'Key points'),
        h('ul', null, chapter.points.map((point) => h('li', null, point))),
        chapterActions(chapter, context, domainId))));
  }

  SP.views = Object.assign(SP.views || {}, { theory: theoryView });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
