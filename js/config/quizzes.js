/*
 * Quiz options for the Quizzes section. Topic labels may use {{variables}} from the profile, so
 * "Locators in {{framework}}" becomes "Locators in Playwright". No technology names here.
 *
 * Each option: { value, label, promptLabel? }. promptLabel is the wording used in the prompt.
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  config.quiz = {
    topics: [
      { value: 'framework', label: '{{framework}} with {{language}}', promptLabel: '{{framework}} with {{language}}: core concepts, project setup, and writing tests' },
      { value: 'language', label: '{{language}} for test automation', promptLabel: 'the {{language}} knowledge needed to write automated tests' },
      { value: 'locators', label: 'Locators in {{framework}}', promptLabel: 'locators and selectors in {{framework}}' },
      { value: 'assertions', label: 'Assertions and waiting in {{framework}}', promptLabel: 'assertions, waiting, and avoiding flaky tests in {{framework}}' },
      { value: 'page-objects', label: 'Page Object Model', promptLabel: 'the Page Object Model with {{framework}} and {{language}}' },
      { value: 'running', label: 'Running and debugging tests', promptLabel: 'running, filtering, reporting, and debugging tests with {{framework}}' },
      { value: 'git', label: 'Git and {{vcsHost}}', promptLabel: 'Git and {{vcsHost}} basics for a test automation project' },
      { value: 'ci', label: 'Continuous integration', promptLabel: 'running {{framework}} tests in continuous integration on {{vcsHost}}' },
      { value: 'fundamentals', label: 'Software testing fundamentals', promptLabel: 'software testing fundamentals: test levels, test types, test design, and defects' },
    ],
    counts: [
      { value: '5', label: '5 questions', promptLabel: '5' },
      { value: '10', label: '10 questions', promptLabel: '10' },
      { value: '15', label: '15 questions', promptLabel: '15' },
    ],
    formats: [
      { value: 'multiple-choice', label: 'Multiple choice', promptLabel: 'multiple choice with 4 options (A-D)' },
      { value: 'true-false', label: 'True or false', promptLabel: 'true or false' },
      { value: 'open', label: 'Open answer', promptLabel: 'open answers that I write myself' },
      { value: 'mixed', label: 'Mixed', promptLabel: 'a mix of multiple choice, true or false, and open answers' },
    ],
    levels: [
      { value: 'my-level', label: 'At my level', promptLabel: 'at my level' },
      { value: 'easier', label: 'Easier', promptLabel: 'a bit easier than my level' },
      { value: 'harder', label: 'Harder (interview style)', promptLabel: 'a bit harder than my level, like a technical interview' },
    ],
    defaults: { topic: 'framework', count: '5', format: 'multiple-choice', level: 'my-level' },
  };

  function pick(options, value) {
    return options.find((o) => o.value === value) || options[0];
  }

  /**
   * Adds the quiz variables (quizTopic, quizCount, quizFormat, quizLevel) to a prompt context.
   * selection: { topic, count, format, level }; missing or unknown values fall back to the defaults.
   */
  config.buildQuizContext = function (context, selection) {
    const q = config.quiz;
    const s = Object.assign({}, q.defaults, selection);
    const entry = (option) => {
      const label = SP.engine.renderText(option.promptLabel || option.label, context);
      return { value: option.value, label };
    };
    return Object.assign({}, context, {
      quizTopic: entry(pick(q.topics, s.topic)),
      quizCount: entry(pick(q.counts, s.count)),
      quizFormat: entry(pick(q.formats, s.format)),
      quizLevel: entry(pick(q.levels, s.level)),
    });
  };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
