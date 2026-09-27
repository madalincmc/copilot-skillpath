const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

const SP = loadCore();
const config = SP.config;

test('configuration has no authoring errors', () => {
  assert.deepEqual(config.validateConfig(), []);
});

test('validateConfig catches a field that references a later field', () => {
  const domain = config.getDomain('automation-testing');
  const original = domain.fields;
  domain.fields = [{ id: 'early', label: 'E', group: 'technology', type: 'text', visibleWhen: { field: 'framework', equals: 'x' } }].concat(original);
  try {
    assert.ok(config.validateConfig().some((e) => /early.*earlier field/.test(e)));
  } finally {
    domain.fields = original;
  }
});

test('"Other" fields appear only when "Other" is chosen', () => {
  const field = config.getFields('automation-testing').find((f) => f.id === 'frameworkOther');
  assert.equal(config.isFieldVisible(field, { framework: 'playwright' }), false);
  assert.equal(config.isFieldVisible(field, { framework: 'other' }), true);
});

test('language options depend on the framework', () => {
  const language = config.getFields('automation-testing').find((f) => f.id === 'language');
  const values = (framework) => config.getAvailableOptions(language, { framework }).map((o) => o.value);
  assert.deepEqual(values('cypress'), ['javascript', 'typescript']);
  assert.deepEqual(values('playwright'), ['javascript', 'typescript', 'java', 'python', 'csharp']);
  assert.ok(values('other').includes('other'));
});

test('sanitizeProfile drops hidden fields and unavailable options, cascading', () => {
  const profile = {
    domain: 'automation-testing',
    framework: 'cypress',
    frameworkOther: 'left over',
    language: 'other',
    languageOther: 'Ruby',
    os: 'windows',
  };
  assert.deepEqual(config.sanitizeProfile(profile), { domain: 'automation-testing', framework: 'cypress', os: 'windows' });
});

test('validateProfile reports required, visible fields only', () => {
  const profile = config.applyPreset('qa-manual-to-automation-windows');
  assert.deepEqual(config.validateProfile(profile), { valid: true, errors: {} });

  const incomplete = Object.assign({}, profile, { framework: 'other', timeAmount: '0' });
  const result = config.validateProfile(incomplete);
  assert.equal(result.valid, false);
  assert.ok(result.errors.frameworkOther);
  assert.match(result.errors.timeAmount, /at least 1/);

  assert.equal(config.validateProfile({ domain: 'cloud' }).valid, false);
  assert.equal(config.validateProfile({}).valid, false);
});

test('every preset produces a valid profile', () => {
  for (const preset of config.listPresets()) {
    assert.equal(config.validateProfile(config.applyPreset(preset.id)).valid, true, preset.id);
  }
});

test('buildPromptContext resolves labels and derived variables', () => {
  const profile = config.applyPreset('qa-manual-to-automation-windows');
  const ctx = config.buildPromptContext(profile);
  assert.equal(ctx.domain.label, 'Automation Testing');
  assert.equal(ctx.framework.label, 'Playwright');
  assert.equal(ctx.goal.label, 'transition from manual testing to automation');
  assert.equal(ctx.availableTime.label, '1 hour per day');
  assert.equal(ctx.targetDuration.label, '2 months');
  assert.match(ctx.practiceTargetDescription.label, /public demo site/);

  const custom = Object.assign({}, profile, {
    duration: 'custom',
    durationCustom: '6 weeks',
    practiceTarget: 'own-app',
    practiceTargetDetails: 'https://staging.example.com',
    timeAmount: '45',
    timeUnit: 'minutes-day',
  });
  const ctx2 = config.buildPromptContext(custom);
  assert.equal(ctx2.targetDuration.label, '6 weeks');
  assert.equal(ctx2.practiceTargetDescription.label, 'my own application (https://staging.example.com)');
  assert.equal(ctx2.availableTime.label, '45 minutes per day');
});

test('Automation Testing Starter Path has steps 0-10 with step 10 optional', () => {
  const path = config.getStarterPath('automation-testing');
  assert.deepEqual(path.steps.map((s) => s.number), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(path.steps[0].id, 'notebook-setup');
  assert.deepEqual(path.steps.filter((s) => s.optional).map((s) => s.id), ['ci']);
  assert.ok(config.getWizard(path.steps[0].wizardId));
});

test('the Notebook setup wizard renders with the profile', () => {
  const ctx = config.buildPromptContext(config.applyPreset('qa-selenium-java-intermediate'));
  const wizard = config.getWizard('notebook-setup');
  assert.deepEqual(wizard.screens.map((s) => s.id), ['create', 'instructions', 'plan']);
  const create = wizard.screens[0].text.map((t) => SP.engine.renderText(t, ctx));
  assert.match(create[1], /"Learning Selenium WebDriver"/);
  assert.deepEqual(wizard.screens.map((s) => s.templateId).filter(Boolean), ['setup.notebook-instructions', 'setup.initialize-workspace']);
});

test('validateConfig catches an unknown wizard', () => {
  const step = config.getStarterPath('automation-testing').steps[0];
  const original = step.wizardId;
  step.wizardId = 'nope';
  try {
    assert.ok(config.validateConfig().some((e) => /unknown wizard "nope"/.test(e)));
  } finally {
    step.wizardId = original;
  }
});
