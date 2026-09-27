const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

const SP = loadCore();
const { serializeDataFile, parseDataFile, summarizeData, dataFilename } = SP.exports;

const profile = SP.config.applyPreset('starter-playwright-javascript');

test('data file name includes the date', () => {
  assert.equal(dataFilename('2026-10-01'), 'copilot-skillpath-data-2026-10-01.json');
});

test('data file round-trips through serialize and parse', () => {
  const store = SP.storage.createStore({ backend: null });
  store.saveProfile(profile);
  store.setStepDone('environment', true);
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
  const state = SP.storage.migrate({ schemaVersion: 1, profile: { domain: 'x' }, progress: { completedSteps: ['a'] } });
  assert.equal(summarizeData(state), 'a learning profile, 1 completed step');
});

