const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

const SP = loadCore();
const { createStore, STORAGE_KEY, SCHEMA_VERSION, StorageDataError } = SP.storage;

class MemoryBackend {
  constructor(initial) {
    this.data = new Map(Object.entries(initial || {}));
    this.failWrites = false;
  }
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    if (this.failWrites && !key.endsWith(':probe')) throw new Error('QuotaExceededError');
    this.data.set(key, String(value));
  }
  removeItem(key) {
    this.data.delete(key);
  }
}

const blockedBackend = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
  removeItem() { throw new Error('SecurityError'); },
};


test('data survives a reload', () => {
  const backend = new MemoryBackend();
  const a = createStore({ backend });
  a.saveProfile({ domain: 'automation-testing', framework: 'playwright' });
  a.setStepDone('environment', true);

  const b = createStore({ backend });
  assert.deepEqual(b.getStatus(), { persistent: true, reason: null });
  assert.equal(b.getProfile().framework, 'playwright');
  assert.deepEqual(b.getCompletedSteps(), ['environment']);
});

test('falls back to memory when storage is blocked', () => {
  const store = createStore({ backend: blockedBackend });
  assert.deepEqual(store.getStatus(), { persistent: false, reason: 'unavailable' });
  store.saveProfile({ domain: 'automation-testing' });
  assert.equal(store.getProfile().domain, 'automation-testing');
});

test('falls back to memory when there is no storage at all', () => {
  assert.equal(createStore({ backend: null }).getStatus().reason, 'unavailable');
});

test('switches to memory and reports it when a write fails', () => {
  const backend = new MemoryBackend();
  const store = createStore({ backend });
  const statuses = [];
  store.subscribe(() => statuses.push(store.getStatus()));
  backend.failWrites = true;
  store.setStepDone('environment', true);
  assert.deepEqual(statuses.at(-1), { persistent: false, reason: 'write-failed' });
  assert.ok(store.isStepDone('environment'));
});

test('unreadable data is backed up and the app starts fresh', () => {
  const backend = new MemoryBackend({ [STORAGE_KEY]: '{not json' });
  const store = createStore({ backend });
  assert.deepEqual(store.getStatus(), { persistent: true, reason: 'recovered' });
  assert.equal(store.getProfile(), null);
  assert.equal(backend.getItem(STORAGE_KEY + ':backup'), '{not json');
});

test('data from a newer version is left untouched', () => {
  const raw = JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, profile: { a: 1 } });
  const backend = new MemoryBackend({ [STORAGE_KEY]: raw });
  const store = createStore({ backend });
  assert.deepEqual(store.getStatus(), { persistent: false, reason: 'newer-version' });
  store.saveProfile({ domain: 'automation-testing' });
  assert.equal(backend.getItem(STORAGE_KEY), raw);
});

test('stored data is normalized: malformed entries and old keys dropped, missing parts filled', () => {
  // Saved prompts and checklist ticks come from earlier versions of the app.
  const raw = JSON.stringify({
    schemaVersion: 1,
    progress: { completedSteps: ['a', 'a', 3] },
    checklist: { ok: true },
    prompts: [{ id: 'x', title: 'T', text: 'P', savedAt: 's' }],
  });
  const store = createStore({ backend: new MemoryBackend({ [STORAGE_KEY]: raw }) });
  assert.deepEqual(store.getState(), { schemaVersion: 1, profile: null, progress: { completedSteps: ['a'] } });
});

test('step progress toggles without duplicates', () => {
  const store = createStore({ backend: new MemoryBackend() });
  store.setStepDone('a', true);
  store.setStepDone('a', true);
  store.setStepDone('b', true);
  store.setStepDone('a', false);
  assert.deepEqual(store.getCompletedSteps(), ['b']);
});

test('returned data is a copy and cannot mutate the store', () => {
  const store = createStore({ backend: new MemoryBackend() });
  store.saveProfile({ domain: 'automation-testing' });
  store.getProfile().domain = 'changed';
  store.getState().progress.completedSteps.push('x');
  assert.equal(store.getProfile().domain, 'automation-testing');
  assert.deepEqual(store.getCompletedSteps(), []);
});

test('export and replace round-trip; invalid data is rejected', () => {
  const a = createStore({ backend: new MemoryBackend() });
  a.saveProfile({ domain: 'automation-testing', os: 'macos' });
  a.setStepDone('environment', true);
  const exported = a.exportState();

  const b = createStore({ backend: new MemoryBackend() });
  b.replaceState(JSON.parse(JSON.stringify(exported)));
  assert.deepEqual(b.getState(), exported);

  assert.throws(() => b.replaceState({ hello: 'world' }), StorageDataError);
  assert.throws(() => b.replaceState(null), StorageDataError);
  assert.throws(() => b.replaceState({ schemaVersion: 99 }), (e) => e.code === 'newer-version');
  assert.deepEqual(b.getState(), exported);
});

test('reset clears everything and notifies subscribers', () => {
  const store = createStore({ backend: new MemoryBackend() });
  store.setStepDone('a', true);
  let calls = 0;
  const unsubscribe = store.subscribe(() => calls++);
  store.reset();
  unsubscribe();
  store.setStepDone('b', true);
  assert.equal(calls, 1);
  assert.deepEqual(store.getState().progress.completedSteps, ['b']);
});
