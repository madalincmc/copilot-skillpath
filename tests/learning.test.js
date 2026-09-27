// Theory and Quizzes: content rules and prompt generation.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore, testProfiles } = require('./helpers/load');

const SP = loadCore();
const P = testProfiles(SP);
const config = SP.config;
const theory = SP.content.getTheory('automation-testing');
const quiz = config.quiz;

const techNames = ['framework', 'language', 'ide']
  .flatMap((id) => config.getFields('automation-testing').find((f) => f.id === id).options)
  .filter((o) => o.value !== 'other')
  .map((o) => o.label);

test('theory chapters are complete and name no technology', () => {
  assert.ok(theory.chapters.length >= 8);
  for (const chapter of theory.chapters) {
    const text = [chapter.title, chapter.deeperTopic].concat(chapter.summary, chapter.points).join('\n');
    for (const name of techNames) assert.ok(!text.includes(name), chapter.id + ' mentions ' + name);
    assert.ok(quiz.topics.some((t) => t.value === chapter.quizTopicId), chapter.id);
  }
});

test('every "Go deeper" prompt generates for every test profile', () => {
  const template = SP.templates.get('theory.deeper');
  for (const [name, profile] of Object.entries(P)) {
    const context = config.buildPromptContext(profile);
    for (const chapter of theory.chapters) {
      const theoryTopic = SP.engine.renderText(chapter.deeperTopic, context);
      const result = SP.engine.generate(template, { context: Object.assign({}, context, { theoryTopic: { value: chapter.id, label: theoryTopic } }) });
      assert.deepEqual(result.missing, [], name + ' / ' + chapter.id);
      assert.doesNotMatch(result.text, /\{\{|\}\}|undefined/);
    }
  }
  const locators = theory.chapters.find((c) => c.id === 'locators');
  assert.equal(SP.engine.renderText(locators.deeperTopic, config.buildPromptContext(P.selenium)), 'locator strategies in Selenium WebDriver, which ones it recommends, and why');
});

test('quiz option labels name no technology', () => {
  for (const key of ['topics', 'counts', 'formats', 'levels']) {
    for (const option of quiz[key]) {
      const text = [option.label, option.promptLabel].filter(Boolean).join('\n');
      for (const name of techNames) assert.ok(!text.includes(name), key + '.' + option.value + ' mentions ' + name);
    }
  }
});

test('every quiz combination generates for every test profile', () => {
  const template = SP.templates.get('quiz.run');
  for (const [name, profile] of Object.entries(P)) {
    const context = config.buildPromptContext(profile);
    for (const topic of quiz.topics) {
      for (const format of quiz.formats) {
        for (const level of quiz.levels) {
          const selection = { topic: topic.value, count: '10', format: format.value, level: level.value };
          const result = SP.engine.generate(template, { context: config.buildQuizContext(context, selection) });
          assert.deepEqual(result.missing, [], [name, topic.value, format.value, level.value].join(' / '));
          assert.doesNotMatch(result.text, /\{\{|\}\}|undefined/);
        }
      }
    }
  }
});

test('the quiz prompt follows the requested rules', () => {
  const context = config.buildQuizContext(config.buildPromptContext(P.playwright), { topic: 'locators', count: '10', format: 'true-false', level: 'harder' });
  const text = SP.engine.generate(SP.templates.get('quiz.run'), { context }).text;
  assert.match(text, /^Quiz me on locators and selectors in Playwright\.\nFormat: 10 questions, true or false, a bit harder than my level, like a technical interview\./);
  assert.match(text, /official documentation/);
  assert.match(text, /standard testing terminology and practice, such as the ISTQB glossary/);
  assert.match(text, /one question at a time, numbered, and wait for my answer/);
  assert.match(text, /say "Correct" or "Incorrect"\. In both cases, explain why/);
  assert.match(text, /Keep score/);
});

test('quiz selections fall back to the defaults', () => {
  const context = config.buildQuizContext(config.buildPromptContext(P.selenium), { topic: 'nope' });
  assert.equal(context.quizTopic.value, quiz.defaults.topic);
  assert.equal(context.quizTopic.label, 'Selenium WebDriver with Java: core concepts, project setup, and writing tests');
  assert.equal(context.quizCount.label, '5');
});
