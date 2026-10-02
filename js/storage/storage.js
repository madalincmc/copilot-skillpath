/*
 * Local persistence for the learner profile, Starter Path progress, and the profile the Copilot
 * Notebook was last set up with (to tell when the Notebook's instructions are out of date).
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
      notebookProfile: null,
      progress: { completedSteps: [] },
    };
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Fills in missing parts and drops malformed entries. Unknown keys are dropped too, including
   * saved prompts and checklist ticks written by earlier versions of the app.
   */
  function normalize(s) {
    const steps = s.progress && Array.isArray(s.progress.completedSteps) ? s.progress.completedSteps : [];
    return {
      schemaVersion: SCHEMA_VERSION,
      profile: isPlainObject(s.profile) ? s.profile : null,
      notebookProfile: isPlainObject(s.notebookProfile) ? s.notebookProfile : null,
      progress: { completedSteps: Array.from(new Set(steps.filter((id) => typeof id === 'string'))) },
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

  /**
   * options:
   *   backend  Storage-like object (getItem/setItem/removeItem). Defaults to localStorage.
   */
  function createStore(options) {
    const opts = options || {};
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

      /** The profile the Copilot Notebook was last set up with, or null if unknown. */
      getNotebookProfile() {
        return clone(state.notebookProfile);
      },

      setNotebookProfile(profile) {
        if (profile != null && !isPlainObject(profile)) throw new TypeError('Notebook profile must be an object or null.');
        state.notebookProfile = clone(profile);
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

      /** Clears Starter Path progress and keeps the profile. */
      clearProgress() {
        state.progress.completedSteps = [];
        commit();
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
