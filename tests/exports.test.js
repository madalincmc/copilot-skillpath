const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

const SP = loadCore();
const { buildPromptPack, promptPackFilename, fence, serializeDataFile, parseDataFile, summarizeData, dataFilename } = SP.exports;

// Fixture templates standing in for the real content (Content milestone).
SP.templates.register({
  id: 'step.first-test',
  version: 1,
  category: 'step',
  title: 'Guide me through this step',
  description: 'Use this when you are ready to write your first test.',
  domains: ['automation-testing'],
  requiredVariables: ['framework'],
  optionalVariables: [],
  inputs: [],
  body: 'Using my {{framework}} setup from this Notebook, guide me through: {{step.title}}.',
});
SP.templates.register({
  id: 'helper.stuck',
  version: 3,
  category: 'helper',
  title: "I'm stuck",
  domains: ['*'],
  inputs: [{ id: 'error', label: 'Error', placeholder: '[PASTE THE ERROR HERE]' }],
  body: 'I am stuck on {{step.title}}:\n{{input:error}}',
});

const profile = SP.config.applyPreset('qa-manual-to-automation-windows');

test('Prompt Pack includes profile, step prompts with headings, and saved prompts', () => {
  const md = buildPromptPack({
    profile,
    date: '2026-10-01',
    savedPrompts: [{ id: 'a', title: 'My custom prompt', text: 'Use ```code``` here', savedAt: '2026-09-30T10:00:00.000Z' }],
  });

  assert.match(md, /^# Copilot SkillPath — Prompt Pack\n/);
  assert.match(md, /Exported on 2026-10-01\./);
  assert.match(md, /- \*\*Automation framework:\*\* Playwright/);
  assert.match(md, /- \*\*Available time:\*\* 1 hour per day/);
  assert.doesNotMatch(md, /\*\*Per:\*\*/);

  assert.match(md, /### Step 4 — Write my first test\n/);
  assert.match(md, /#### Guide me through this step \(Step 4\)\n\n_When to use:_ Use this when/);
  assert.match(md, /Using my Playwright setup from this Notebook, guide me through: Write my first test\./);
  assert.match(md, /#### I'm stuck \(Step 7\)/);
  assert.match(md, /\[PASTE THE ERROR HERE\]/);
  // Templates that are not registered are skipped: step 2 only has the helper.
  assert.match(md, /#### I'm stuck \(Step 2\)/);
  assert.doesNotMatch(md, /Guide me through this step \(Step 2\)/);

  assert.match(md, /## My saved prompts\n\n### My custom prompt\n\n_Saved on 2026-09-30\._\n\n````text\nUse ```code``` here\n````/);
  assert.doesNotMatch(md, /\n{3,}/);
  assert.ok(md.endsWith('\n'));
});

test('Prompt Pack without a profile still lists saved prompts', () => {
  const md = buildPromptPack({ profile: null, date: '2026-10-01', savedPrompts: [{ id: 'a', title: 'T', text: 'P', savedAt: '2026-10-01T00:00:00Z' }] });
  assert.doesNotMatch(md, /My learning profile/);
  assert.match(md, /### T/);
});

test('Prompt Pack output is deterministic', () => {
  const options = { profile, date: '2026-10-01', savedPrompts: [] };
  assert.equal(buildPromptPack(options), buildPromptPack(options));
});

test('fence is longer than any backtick run in the text', () => {
  assert.equal(fence('plain'), '```text\nplain\n```');
  assert.equal(fence('a ```` b'), '`````text\na ```` b\n`````');
});

test('file names include the date', () => {
  assert.equal(promptPackFilename('2026-10-01'), 'copilot-skillpath-prompt-pack-2026-10-01.md');
  assert.equal(dataFilename('2026-10-01'), 'copilot-skillpath-data-2026-10-01.json');
});

test('data file round-trips through serialize and parse', () => {
  const store = SP.storage.createStore({ backend: null, now: () => '2026-10-01T00:00:00.000Z', makeId: () => 'x' });
  store.saveProfile(profile);
  store.setStepDone('environment', true);
  store.addPrompt({ title: 'T', text: 'P' });
  const text = serializeDataFile(store.exportState(), '2026-10-01T12:00:00.000Z');
  const parsed = JSON.parse(text);
  assert.equal(parsed.app, 'copilot-skillpath');
  assert.equal(parsed.exportedAt, '2026-10-01T12:00:00.000Z');
  assert.deepEqual(parseDataFile(text), store.exportState());
});

test('parseDataFile rejects files that are not ours', () => {
  const { StorageDataError } = SP.storage;
  assert.throws(() => parseDataFile('not json'), (e) => e instanceof StorageDataError && /not valid JSON/.test(e.message));
  assert.throws(() => parseDataFile('{"app":"other","schemaVersion":1}'), /not exported from Copilot SkillPath/);
  assert.throws(() => parseDataFile('{"hello":1}'), StorageDataError);
  assert.throws(() => parseDataFile('{"schemaVersion":99}'), /newer version/);
});

test('summarizeData describes the contents', () => {
  const state = SP.storage.migrate({ schemaVersion: 1, profile: { domain: 'x' }, progress: { completedSteps: ['a'] }, prompts: [] });
  assert.equal(summarizeData(state), 'a learning profile, 1 completed step, 0 saved prompts');
});

test('describeProfile uses form labels, custom "Other" text, and derived rows', () => {
  const rows = SP.config.describeProfile(Object.assign({}, profile, { framework: 'other', frameworkOther: 'TestCafe', language: 'other', languageOther: 'Ruby' }));
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.domain.value, 'Automation Testing');
  assert.equal(byId.framework.value, 'TestCafe');
  assert.equal(byId.language.value, 'Ruby');
  assert.equal(byId.frameworkOther, undefined);
  assert.equal(byId.goal.value, 'Transition from manual to automation');
  assert.deepEqual(byId.timeAmount, { id: 'timeAmount', label: 'Available time', value: '1 hour per day' });
  assert.equal(byId.timeUnit, undefined);
});

test('store.updatePrompt changes text and version and refreshes savedAt', () => {
  let t = 0;
  const store = SP.storage.createStore({ backend: null, now: () => 'time-' + ++t, makeId: () => 'id' });
  store.addPrompt({ title: 'T', text: 'old', templateId: 'x', templateVersion: 1 });
  const updated = store.updatePrompt('id', { text: 'new', templateVersion: 2, id: 'hacked' });
  assert.deepEqual(updated, { id: 'id', title: 'T', text: 'new', stepId: null, templateId: 'x', templateVersion: 2, savedAt: 'time-2' });
  assert.equal(store.updatePrompt('missing', { text: 'x' }), null);
  assert.throws(() => store.updatePrompt('id', { text: ' ' }), TypeError);
});
