/*
 * JSON data file: export and import of the profile and Starter Path progress.
 * Pure: no DOM, no storage writes.
 */
(function (SP) {
  'use strict';

  const APP_ID = 'copilot-skillpath';

  /** state: a store snapshot (store.exportState()). exportedAt: ISO timestamp. */
  function serializeDataFile(state, exportedAt) {
    return JSON.stringify(Object.assign({ app: APP_ID, exportedAt }, state), null, 2) + '\n';
  }

  /** Parses and validates a data file. Returns normalized state. Throws StorageDataError with a user-facing message. */
  function parseDataFile(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new SP.storage.StorageDataError('This file is not valid JSON.', 'invalid');
    }
    if (data && typeof data === 'object' && 'app' in data && data.app !== APP_ID) {
      throw new SP.storage.StorageDataError('This file was not exported from Copilot SkillPath.', 'invalid');
    }
    return SP.storage.migrate(data);
  }

  /** Short description of what a data file contains, shown before the user confirms an import. */
  function summarizeData(state) {
    const parts = [];
    parts.push(state.profile ? 'a learning profile' : 'no learning profile');
    const steps = state.progress.completedSteps.length;
    parts.push(steps + (steps === 1 ? ' completed step' : ' completed steps'));
    return parts.join(', ');
  }

  function dataFilename(date) {
    return 'copilot-skillpath-data-' + date + '.json';
  }

  SP.exports = Object.assign(SP.exports || {}, { serializeDataFile, parseDataFile, summarizeData, dataFilename });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
