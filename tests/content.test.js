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
  const profileOnly = ['goal', 'availableTime', 'targetDuration', 'learningStyle', 'experienceLevel', 'testingExperience', 'practiceTargetDescription', 'practiceTargetName'];
  for (const template of SP.templates.list().filter((t) => t.category !== 'setup')) {
    const used = [].concat(template.requiredVariables || [], template.optionalVariables || []);
    for (const name of profileOnly) assert.ok(!used.includes(name), template.id + ' repeats "' + name + '"');
  }
});

test('Notebook instructions adapt to the profile', () => {
  const instructions = SP.templates.get('setup.notebook-instructions');
  const beginner = SP.engine.generate(instructions, { context: config.buildPromptContext(P.playwright) }).text;
  assert.match(beginner, /Stack: Playwright with JavaScript, on Windows, in VS Code\./);
  assert.match(beginner, /Assume I have not used Playwright before\./);
  assert.match(beginner, /Explain each Git command the first time/);
  assert.match(beginner, /Relate automation to manual testing/);

  const intermediate = SP.engine.generate(instructions, { context: config.buildPromptContext(P.seleniumIntermediate) }).text;
  assert.doesNotMatch(intermediate, /Assume I have not used/);
  assert.doesNotMatch(intermediate, /Explain each Git command/);
  assert.doesNotMatch(intermediate, /\n\n\n/);
});

test('the initialize prompt lists the Starter Path steps from the config', () => {
  const text = SP.engine.generate(SP.templates.get('setup.initialize-workspace'), {}).text;
  for (const step of path.steps.filter((s) => s.number > 0)) assert.ok(text.includes(step.number + '. ' + step.title), step.title);
  assert.match(text, /11\. Run tests in CI \(optional\)/);
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

test('no prompt suggests IDE extensions; the only mention says not to, in the instructions', () => {
  for (const t of SP.templates.list()) {
    const text = [t.body, t.interaction, t.output].join('\n');
    for (const line of text.split('\n').filter((l) => /extension|plugin/i.test(l))) {
      assert.equal(t.id, 'setup.notebook-instructions', t.id + ': ' + line);
      assert.match(line, /Don't suggest IDE extensions or plugins for now/);
    }
  }
});

test('the instructions hold the whole step flow, in order', () => {
  const flow = SP.templates.get('setup.notebook-instructions').interaction;
  const order = [
    /1\. Teach one concept/,
    /2\. Give me one exercise\. Wait for my output, then review it\./,
    /3\. Ask one check question\. Wait for my answer/,
    /4\. Write "Checkpoint: Step N - <what is done>"/,
    /5\. When the step's "Done when" is met, ask 3 end-of-step questions, one at a time\./,
    /6\. Tell me to mark the step done in the Copilot SkillPath app and paste the next prompt\. Don't start the next step\./,
    /If I skip a part, say it stays open/,
  ];
  let from = 0;
  for (const re of order) {
    const m = flow.slice(from).match(re);
    assert.ok(m, String(re));
    from += m.index + m[0].length;
  }
  assert.match(flow, /One request per message: never two questions, or a question and a task\./);
  assert.match(SP.templates.get('setup.notebook-instructions').body, /If a file appears more than once, use only the newest copy\./);
  assert.match(SP.templates.get('setup.initialize-workspace').output, /paste the Step 1 prompt from there\. Don't start Step 1 yourself\./);
});

test('step prompts name the step and its "Done when", and leave the rules to the instructions', () => {
  for (const step of path.steps.filter((s) => s.mainTemplateId)) {
    const text = SP.engine.generate(SP.templates.get(step.mainTemplateId), { context: config.buildPromptContext(P.playwright), step }).text;
    assert.ok(text.startsWith('Step ' + step.number + ': ' + step.title + '. '), step.id);
    assert.ok(text.includes('Done when: ' + step.definitionOfDone + '\n'), step.id);
    assert.ok(text.endsWith('Work through it with the step flow from my Notebook instructions.'), step.id);
    assert.doesNotMatch(text, /questions|Checkpoint|mark the step done/i, step.id);
  }
});

test('the resume helper continues from the last checkpoint', () => {
  assert.ok(config.defaultHelperTemplateIds.includes('helper.resume'));
  const resume = SP.engine.generate(SP.templates.get('helper.resume'), { step: path.steps.find((s) => s.id === 'first-test') }).text;
  assert.match(resume, /continue "Write my first test"\. Find the last "Checkpoint:"/);
  assert.match(resume, /Don't restart the step/);
});
