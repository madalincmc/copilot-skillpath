// Guards the prompt content: every referenced template exists, generates for every preset without
// missing data, stays short, and contains no technology-specific wording (PRD §4.3, §4.5).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

const SP = loadCore();
const config = SP.config;
const path = config.getStarterPath('automation-testing');
const presets = config.listPresets('automation-testing');

function stepFor(template) {
  return path.steps.find((s) => s.mainTemplateId === template.id || (s.setupTemplateIds || []).includes(template.id)) || path.steps[4];
}

test('every template referenced by the config is registered', () => {
  assert.deepEqual(config.validateConfig({ checkTemplates: true }), []);
});

test('every template generates for every preset with nothing missing', () => {
  for (const preset of presets) {
    const context = config.buildPromptContext(config.applyPreset(preset.id));
    for (const template of SP.templates.list({ domain: 'automation-testing' })) {
      const result = SP.engine.generate(template, { context, step: stepFor(template) });
      assert.deepEqual(result.missing, [], preset.id + ' / ' + template.id);
      assert.doesNotMatch(result.text, /\[MISSING|undefined|null|\{\{|\}\}/, preset.id + ' / ' + template.id);
    }
  }
});

test('step, helper, and library prompts stay short; setup prompts carry the context', () => {
  const limits = { setup: 1600, step: 450, helper: 350, library: 350 };
  for (const preset of presets) {
    const context = config.buildPromptContext(config.applyPreset(preset.id));
    for (const template of SP.templates.list()) {
      const { charCount } = SP.engine.generate(template, { context, step: stepFor(template) });
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
  const beginner = SP.engine.generate(instructions, { context: config.buildPromptContext(config.applyPreset('qa-manual-to-automation-windows')) }).text;
  assert.match(beginner, /Stack: Playwright with TypeScript, on Windows, using VS Code\./);
  assert.match(beginner, /Assume I have not used Playwright before\./);
  assert.match(beginner, /I'm new to Git/);
  assert.match(beginner, /Relate automation ideas to manual testing/);

  const intermediate = SP.engine.generate(instructions, { context: config.buildPromptContext(config.applyPreset('qa-selenium-java-intermediate')) }).text;
  assert.doesNotMatch(intermediate, /Assume I have not used/);
  assert.doesNotMatch(intermediate, /new to Git/);
  assert.doesNotMatch(intermediate, /\n\n\n/);
});

test('the initialize prompt lists the Starter Path steps from the config', () => {
  const text = SP.engine.generate(SP.templates.get('setup.initialize-workspace'), {}).text;
  for (const step of path.steps.filter((s) => s.number > 0)) assert.ok(text.includes(step.number + '. ' + step.title), step.title);
  assert.match(text, /10\. Run tests in CI \(optional\)/);
});

test('Git basics are added to the GitHub step only for Git beginners', () => {
  const t = SP.templates.get('step.push-github');
  const step = path.steps.find((s) => s.id === 'push-github');
  const gen = (presetId) => SP.engine.generate(t, { context: config.buildPromptContext(config.applyPreset(presetId)), step }).text;
  assert.match(gen('qa-manual-to-automation-windows'), /new to Git/);
  assert.doesNotMatch(gen('qa-selenium-java-intermediate'), /new to Git/);
});

test('every Library template belongs to a known group', () => {
  const groups = new Set(config.libraryGroups.map((g) => g.id));
  const library = SP.templates.list({ category: 'library' });
  assert.ok(library.length >= 8);
  for (const t of library) assert.ok(groups.has(t.group), t.id);
});

test('wizard text renders with the profile', () => {
  const context = config.buildPromptContext(config.applyPreset('qa-cypress-js-macos'));
  const create = config.getWizard('notebook-setup').screens[0];
  assert.match(SP.engine.renderText(create.text[1], context), /"Learning Cypress"/);
});
