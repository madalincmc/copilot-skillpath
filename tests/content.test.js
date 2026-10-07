// Guards the prompt content: every referenced template exists, generates for every preset without
// missing data, stays short, and contains no technology-specific wording (PRD §4.3, §4.5).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore, testProfiles } = require('./helpers/load');

const SP = loadCore();
const P = testProfiles(SP);
const config = SP.config;
const path = config.getStarterPath('automation-testing');
const profiles = Object.entries(P);

function stepFor(template) {
  return path.steps.find((s) => s.mainTemplateId === template.id || (s.setupTemplateIds || []).includes(template.id)) || path.steps[4];
}

/** Adds the variables that the Theory and Quizzes views add for their templates. */
function contextFor(template, context) {
  if (template.category === 'quiz') return config.buildQuizContext(context, {});
  if (template.category === 'theory') {
    const chapter = SP.content.getTheory('automation-testing').chapters[0];
    const label = SP.engine.renderText(chapter.deeperTopic, context);
    return Object.assign({}, context, { theoryTopic: { value: chapter.id, label } });
  }
  return context;
}

test('every template referenced by the config is registered', () => {
  assert.deepEqual(config.validateConfig({ checkTemplates: true }), []);
});

test('every template generates for every test profile with nothing missing', () => {
  for (const [name, profile] of profiles) {
    const context = config.buildPromptContext(profile);
    for (const template of SP.templates.list({ domain: 'automation-testing' })) {
      const result = SP.engine.generate(template, { context: contextFor(template, context), step: stepFor(template) });
      assert.deepEqual(result.missing, [], name + ' / ' + template.id);
      assert.doesNotMatch(result.text, /\[MISSING|undefined|null|\{\{|\}\}/, name + ' / ' + template.id);
    }
  }
});

test('step, helper, and library prompts stay short; setup prompts carry the context', () => {
  // Step prompts end with the shared step rules (one step at a time, 3 questions, back to the app),
  // so they get more room than helpers. Setup prompts are copied once.
  const limits = { setup: 1900, step: 600, helper: 350, library: 350, theory: 350, quiz: 700 };
  for (const [, profile] of profiles) {
    const context = config.buildPromptContext(profile);
    for (const template of SP.templates.list()) {
      const { charCount } = SP.engine.generate(template, { context: contextFor(template, context), step: stepFor(template) });
      assert.ok(charCount <= limits[template.category], template.id + ' is ' + charCount + ' characters (limit ' + limits[template.category] + ')');
    }
  }
});

test('templates and wizard text contain no technology-specific names', () => {
  const fields = config.getFields('automation-testing');
  const names = ['framework', 'language', 'ide']
    .flatMap((id) => fields.find((f) => f.id === id).options)
    .filter((o) => o.value !== 'other')
    .map((o) => o.label);
  const sources = [];
  for (const t of SP.templates.list()) sources.push([t.id, [t.title, t.description, t.body, t.interaction, t.output].join('\n')]);
  for (const w of config.wizards) {
    for (const screen of w.screens) sources.push([w.id + '.' + screen.id, [screen.title, screen.note].concat(screen.text).join('\n')]);
  }

  for (const [id, text] of sources) {
    for (const name of names) assert.ok(!text.includes(name), id + ' mentions "' + name + '"');
  }
});

test('step prompts do not repeat the whole profile', () => {
  const profileOnly = ['goal', 'availableTime', 'targetDuration', 'learningStyle', 'experienceLevel', 'testingExperience', 'practiceTargetDescription'];
  for (const template of SP.templates.list().filter((t) => t.category !== 'setup')) {
    const used = [].concat(template.requiredVariables || [], template.optionalVariables || []);
    for (const name of profileOnly) assert.ok(!used.includes(name), template.id + ' repeats "' + name + '"');
  }
});

test('Notebook instructions adapt to the profile', () => {
  const instructions = SP.templates.get('setup.notebook-instructions');
  const beginner = SP.engine.generate(instructions, { context: config.buildPromptContext(P.playwright) }).text;
  assert.match(beginner, /Stack: Playwright with JavaScript, on Windows, using VS Code\./);
  assert.match(beginner, /Assume I have not used Playwright before\./);
  assert.match(beginner, /I'm new to Git/);
  assert.match(beginner, /Relate automation ideas to manual testing/);

  const intermediate = SP.engine.generate(instructions, { context: config.buildPromptContext(P.seleniumIntermediate) }).text;
  assert.doesNotMatch(intermediate, /Assume I have not used/);
  assert.doesNotMatch(intermediate, /new to Git/);
  assert.doesNotMatch(intermediate, /\n\n\n/);
});

test('the initialize prompt lists the Starter Path steps from the config', () => {
  const text = SP.engine.generate(SP.templates.get('setup.initialize-workspace'), {}).text;
  for (const step of path.steps.filter((s) => s.number > 0)) assert.ok(text.includes(step.number + '. ' + step.title), step.title);
  assert.match(text, /11\. Run tests in CI \(optional\)/);
});

test('Git basics are added to the GitHub step only for Git beginners', () => {
  const t = SP.templates.get('step.push-github');
  const step = path.steps.find((s) => s.id === 'push-github');
  const gen = (profile) => SP.engine.generate(t, { context: config.buildPromptContext(profile), step }).text;
  assert.match(gen(P.playwright), /new to Git/);
  assert.doesNotMatch(gen(P.seleniumIntermediate), /new to Git/);
});

test('every Library template belongs to a known group', () => {
  const groups = new Set(config.libraryGroups.map((g) => g.id));
  const library = SP.templates.list({ category: 'library' });
  assert.ok(library.length >= 8);
  for (const t of library) assert.ok(groups.has(t.group), t.id);
});

test('wizard text renders with the profile', () => {
  const context = config.buildPromptContext(P.cypressMac);
  const create = config.getWizard('notebook-setup').screens[1];
  assert.match(SP.engine.renderText(create.text[1], context), /"Learning Cypress"/);
});

test('no prompt suggests IDE extensions; the only mentions say not to', () => {
  for (const t of SP.templates.list()) {
    const text = [t.body, t.interaction, t.output].join('\n');
    for (const line of text.split('\n').filter((l) => /extension|plugin/i.test(l))) {
      assert.match(line, /Don't suggest IDE extensions/, t.id + ': ' + line);
    }
  }
  assert.match(SP.templates.get('step.environment').body, /Don't suggest IDE extensions for now/);
});

test('every step asks end-of-step questions and waits for each answer', () => {
  for (const t of SP.templates.list({ category: 'step' })) {
    assert.match(t.interaction, /ask me 3 short questions, one at a time, waiting for each answer/, t.id);
  }
  const instructions = SP.templates.get('setup.notebook-instructions').interaction;
  assert.match(instructions, /When we finish a step, ask me 3 short questions/);
  assert.match(instructions, /Don't suggest IDE extensions or plugins/);
});

test('after each step, Copilot sends the user back to the app instead of starting the next step', () => {
  for (const t of SP.templates.list({ category: 'step' })) {
    assert.match(t.interaction, /mark the step done in Copilot SkillPath and paste the next prompt. Don't start the next step yourself/, t.id);
  }
  assert.match(SP.templates.get('setup.notebook-instructions').interaction, /mark the step done in the Copilot SkillPath app .* Don't start the next step yourself/);
  assert.match(SP.templates.get('setup.initialize-workspace').output, /paste the Step 1 prompt from there/);
});

test('Copilot asks for one thing per message and marks checkpoints that the resume helper uses', () => {
  const instructions = SP.templates.get('setup.notebook-instructions').interaction;
  assert.match(instructions, /one exercise; wait for my output and review it; then one check question/);
  assert.match(instructions, /Ask me for one thing per message, never two at once/);
  assert.match(instructions, /"Checkpoint: Step N - <what is done>"/);
  for (const t of SP.templates.list({ category: 'step' })) assert.match(t.interaction, /One request per message/, t.id);

  assert.ok(config.defaultHelperTemplateIds.includes('helper.resume'));
  const resume = SP.engine.generate(SP.templates.get('helper.resume'), { step: path.steps.find((s) => s.id === 'first-test') }).text;
  assert.match(resume, /continue "Write my first test"\. Find the last "Checkpoint:"/);
  assert.match(resume, /Don't restart the step/);
});
