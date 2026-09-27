/*
 * Local persistence for the learner profile, Starter Path progress, checklist ticks, and saved prompts.
 *
 * Everything lives under one localStorage key as a versioned JSON document. If localStorage is
 * unavailable or a write fails, the store keeps working in memory and getStatus() reports why,
 * so the UI can tell the user their data will not be kept.
 *
 * Status reasons:
 *   null               Persistent, nothing to report.
 *   'recovered'        Stored data was unreadable; it was backed up and the app started fresh.
 *   'unavailable'      localStorage is blocked or missing (in-memory only).
 *   'write-failed'     A save failed, e.g. storage is full (in-memory from then on).
 *   'newer-version'    Data was written by a newer version of the app; left untouched (in-memory only).
 */
(function (SP) {
  'use strict';

  const STORAGE_KEY = 'copilot-skillpath';
  const SCHEMA_VERSION = 1;

  // Upgrades from version N to N + 1: { [N]: (state) => state }.
  const migrations = {};

  class StorageDataError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'StorageDataError';
      this.code = code;
    }
  }

  function defaultState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      profile: null,
      progress: { completedSteps: [] },
      checklist: {},
      prompts: [],
    };
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
  }

  function isValidPrompt(p) {
    return (
      isPlainObject(p) &&
      typeof p.id === 'string' && p.id !== '' &&
      typeof p.title === 'string' &&
      typeof p.text === 'string' &&
      typeof p.savedAt === 'string' &&
      (p.stepId == null || typeof p.stepId === 'string') &&
      (p.templateId == null || typeof p.templateId === 'string') &&
      (p.templateVersion == null || Number.isInteger(p.templateVersion))
    );
  }

  /** Fills in missing parts and drops malformed entries. */
  function normalize(s) {
    const checklist = {};
    if (isPlainObject(s.checklist)) {
      for (const [key, value] of Object.entries(s.checklist)) {
        if (typeof value === 'boolean') checklist[key] = value;
      }
    }
    const steps = s.progress && Array.isArray(s.progress.completedSteps) ? s.progress.completedSteps : [];
    return {
      schemaVersion: SCHEMA_VERSION,
      profile: isPlainObject(s.profile) ? s.profile : null,
      progress: { completedSteps: Array.from(new Set(steps.filter((id) => typeof id === 'string'))) },
      checklist,
      prompts: Array.isArray(s.prompts) ? s.prompts.filter(isValidPrompt) : [],
    };
  }

  /** Validates, upgrades, and normalizes stored or imported data. Throws StorageDataError. */
  function migrate(data) {
    if (!isPlainObject(data) || !Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) {
      throw new StorageDataError('Not a Copilot SkillPath data file.', 'invalid');
    }
    if (data.schemaVersion > SCHEMA_VERSION) {
      throw new StorageDataError('This data was created by a newer version of Copilot SkillPath.', 'newer-version');
    }
    let state = clone(data);
    while (state.schemaVersion < SCHEMA_VERSION) {
      const upgrade = migrations[state.schemaVersion];
      if (!upgrade) throw new StorageDataError('No upgrade from version ' + state.schemaVersion + '.', 'invalid');
      state = upgrade(state);
    }
    return normalize(state);
  }

  function probe(backend) {
    try {
      if (!backend) return null;
      const key = STORAGE_KEY + ':probe';
      backend.setItem(key, '1');
      backend.removeItem(key);
      return backend;
    } catch (e) {
      return null;
    }
  }

  function defaultBackend() {
    try {
      return globalThis.localStorage || null;
    } catch (e) {
      // Accessing localStorage itself throws when site data is blocked.
      return null;
    }
  }

  let idCounter = 0;
  function defaultMakeId() {
    idCounter += 1;
    return 'p-' + Date.now().toString(36) + '-' + idCounter.toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /**
   * options:
   *   backend  Storage-like object (getItem/setItem/removeItem). Defaults to localStorage.
   *   now      () => ISO timestamp string.
   *   makeId   () => unique id for saved prompts.
   */
  function createStore(options) {
    const opts = options || {};
    const now = opts.now || (() => new Date().toISOString());
    const makeId = opts.makeId || defaultMakeId;
    const listeners = new Set();

    let backend = probe('backend' in opts ? opts.backend : defaultBackend());
    let reason = backend ? null : 'unavailable';
    let state = defaultState();

    function goInMemory(why) {
      backend = null;
      reason = why;
    }

    if (backend) {
      let raw = null;
      try {
        raw = backend.getItem(STORAGE_KEY);
      } catch (e) {
        goInMemory('unavailable');
      }
      if (raw != null) {
        try {
          state = migrate(JSON.parse(raw));
        } catch (e) {
          if (e.code === 'newer-version') {
            goInMemory('newer-version');
          } else {
            try {
              backend.setItem(STORAGE_KEY + ':backup', raw);
            } catch (ignored) {
              // Best effort only.
            }
            reason = 'recovered';
          }
        }
      }
    }

    function persist() {
      if (!backend) return;
      try {
        backend.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        goInMemory('write-failed');
      }
    }

    function commit() {
      persist();
      const snapshot = clone(state);
      listeners.forEach((fn) => fn(snapshot));
    }

    const store = {
      getStatus() {
        return { persistent: backend != null, reason };
      },

      subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },

      getState() {
        return clone(state);
      },

      getProfile() {
        return clone(state.profile);
      },

      saveProfile(profile) {
        if (!isPlainObject(profile)) throw new TypeError('Profile must be an object.');
        state.profile = clone(profile);
        commit();
      },

      getCompletedSteps() {
        return state.progress.completedSteps.slice();
      },

      isStepDone(stepId) {
        return state.progress.completedSteps.includes(stepId);
      },

      setStepDone(stepId, done) {
        const steps = state.progress.completedSteps.filter((id) => id !== stepId);
        if (done) steps.push(stepId);
        state.progress.completedSteps = steps;
        commit();
      },

      getChecklist() {
        return clone(state.checklist);
      },

      setChecklistItem(itemId, checked) {
        state.checklist[itemId] = Boolean(checked);
        commit();
      },

      listPrompts() {
        return clone(state.prompts);
      },

      /** prompt: { title, text, stepId?, templateId?, templateVersion? }. Returns the saved prompt. */
      addPrompt(prompt) {
        const saved = {
          id: makeId(),
          title: prompt && prompt.title,
          text: prompt && prompt.text,
          stepId: (prompt && prompt.stepId) || null,
          templateId: (prompt && prompt.templateId) || null,
          templateVersion: prompt && prompt.templateVersion != null ? prompt.templateVersion : null,
          savedAt: now(),
        };
        if (!isValidPrompt(saved) || !saved.title.trim() || !saved.text.trim()) {
          throw new TypeError('A saved prompt needs a title and text.');
        }
        state.prompts.push(saved);
        commit();
        return clone(saved);
      },

      removePrompt(id) {
        const before = state.prompts.length;
        state.prompts = state.prompts.filter((p) => p.id !== id);
        const removed = state.prompts.length !== before;
        if (removed) commit();
        return removed;
      },

      /** Full data snapshot, for JSON export. */
      exportState() {
        return clone(state);
      },

      /** Replaces all data (JSON import). Throws StorageDataError for invalid data. */
      replaceState(data) {
        state = migrate(data);
        commit();
      },

      reset() {
        state = defaultState();
        commit();
      },
    };

    return store;
  }

  SP.storage = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    StorageDataError,
    createStore,
    migrate,
  };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
