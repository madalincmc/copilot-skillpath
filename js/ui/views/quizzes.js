/*
 * Quizzes: the user picks a topic, number of questions, format, and difficulty, and gets a prompt
 * that makes Copilot run the quiz: one question at a time, Correct/Incorrect with an explanation,
 * and a score at the end. The selection is remembered for the session.
 */
(function (SP) {
  'use strict';

  const { h, clear } = SP.dom;
  const { pageHeader, promptCard } = SP.ui;
  const config = SP.config;

  let selection = null;
  let pendingTopic = null;

  /** Opens the Quizzes section with a topic preselected (used by "Quiz me on this" in Theory). */
  function openQuiz(topicId) {
    pendingTopic = topicId;
    location.hash = '#/quiz';
  }

  function quizView(app) {
    const profile = app.store.getProfile();
    const header = pageHeader('Quizzes',
      'Check what you know with a quiz in Copilot: one question at a time, with "Correct" or "Incorrect" and an explanation after every answer.');

    if (!profile) {
      return h('section', null, header, h('div', { class: 'callout' },
        h('p', null, 'Create your learning profile first, so the quiz is about your stack.'),
        h('a', { class: 'button', href: '#/profile' }, 'Create my learning profile')));
    }

    selection = selection || Object.assign({}, config.quiz.defaults);
    if (pendingTopic) {
      selection.topic = pendingTopic;
      pendingTopic = null;
    }

    const context = config.buildPromptContext(profile);
    const cardArea = h('div', { class: 'quiz-card' });

    function renderCard() {
      clear(cardArea);
      cardArea.appendChild(promptCard({
        template: SP.templates.get('quiz.run'),
        context: config.buildQuizContext(context, selection),
        domainId: profile.domain,
        headingLevel: 2,
      }));
    }

    function select(key, label, options) {
      const id = 'quiz-' + key;
      const control = h('select', {
        id,
        class: 'input',
        onChange: (e) => {
          selection[key] = e.target.value;
          renderCard();
        },
      }, options.map((o) => h('option', { value: o.value, selected: o.value === selection[key] }, SP.engine.renderText(o.label, context))));
      return h('div', { class: 'form-field' }, h('label', { for: id }, label), control);
    }

    renderCard();

    return h('section', null,
      header,
      h('div', { class: 'panel' },
        h('h2', null, 'Build your quiz'),
        h('div', { class: 'form-grid' },
          select('topic', 'Topic', config.quiz.topics),
          select('count', 'Questions', config.quiz.counts),
          select('format', 'Format', config.quiz.formats),
          select('level', 'Difficulty', config.quiz.levels))),
      cardArea,
      h('div', { class: 'panel quiz-notes' },
        h('h2', null, 'How the quiz works'),
        h('ol', null,
          h('li', null, 'Paste the prompt into your Copilot Notebook chat.'),
          h('li', null, 'Copilot asks one question and waits. Type your answer.'),
          h('li', null, 'It tells you "Correct" or "Incorrect", explains why in both cases, and names the documentation topic.'),
          h('li', null, 'At the end you get your score and the topics to review.')),
        h('p', { class: 'hint' }, 'Questions follow the official documentation of your tools and standard testing terminology (such as the ISTQB glossary), as Copilot knows them. A Notebook doesn\'t browse the web, so check anything surprising in the official documentation.')));
  }

  SP.views = Object.assign(SP.views || {}, { quiz: quizView });
  SP.ui.openQuiz = openQuiz;
})((globalThis.SkillPath = globalThis.SkillPath || {}));
