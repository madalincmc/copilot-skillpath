/*
 * JSON data file: export and import of the profile and Starter Path progress.
 * Pure: no DOM, no storage writes.
 *
 * An imported file may come from someone else, and its profile text ends up in the prompts the user
 * pastes into Copilot. So the import keeps only known profile fields with plain values, and the UI
 * shows the profile (free text included) before the user confirms.
 */
(function (SP) {
  'use strict';

  const APP_ID = 'copilot-skillpath';
  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  /** state: a store snapshot (store.exportState()). exportedAt: ISO timestamp. */
  function serializeDataFile(state, exportedAt) {
    return JSON.stringify(Object.assign({ app: APP_ID, exportedAt }, state), null, 2) + '\n';
  }

  /**
   * Keeps only the known fields of an imported profile, as strings. Unknown keys (including
   * "__proto__"), objects, arrays, and hidden or unavailable values are dropped. Text is kept
   * as written. Returns null when the domain is unknown or not available yet.
   */
  function cleanImportedProfile(profile) {
    if (!profile || typeof profile !== 'object' || typeof profile.domain !== 'string') return null;
    const domain = SP.config.getDomain(profile.domain);
    if (!domain || domain.comingSoon) return null;

    const values = { domain: domain.id };
    for (const field of SP.config.getFields(domain.id)) {
      if (!hasOwn(profile, field.id)) continue;
      const raw = profile[field.id];
      if (typeof raw === 'string') values[field.id] = raw;
      else if (typeof raw === 'number' && Number.isFinite(raw)) values[field.id] = String(raw);
    }
    return SP.config.sanitizeProfile(values);
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
    const state = SP.storage.migrate(data);
    state.profile = cleanImportedProfile(state.profile);
    return state;
  }

  /** Short description of what a data file contains, shown before the user confirms an import. */
  function summarizeData(state) {
    const parts = [];
    parts.push(state.profile ? 'a learning profile' : 'no learning profile');
    const steps = state.progress.completedSteps.length;
    parts.push(steps + (steps === 1 ? ' completed step' : ' completed steps'));
    return parts.join(', ');
  }

  /**
   * The profile as rows for the import preview: [{ label, value, freeText }].
   * freeText marks values the user typed (text fields, "Other" answers); they are copied into prompts
   * as written, so the preview highlights them.
   */
  function profileRows(profile) {
    if (!profile) return [];
    const domain = SP.config.getDomain(profile.domain);
    const rows = [{ label: 'Learning domain', value: domain.label, freeText: false }];
    for (const field of SP.config.getFields(domain.id)) {
      const raw = profile[field.id];
      if (raw == null || raw === '') continue;
      if (field.options) {
        const option = field.options.find((o) => o.value === raw);
        rows.push({ label: field.label, value: option ? option.label : raw, freeText: false });
      } else {
        rows.push({ label: field.label, value: raw, freeText: field.type === 'text' });
      }
    }
    return rows;
  }

  function dataFilename(date) {
    return 'copilot-skillpath-data-' + date + '.json';
  }

  SP.exports = Object.assign(SP.exports || {}, { serializeDataFile, parseDataFile, cleanImportedProfile, summarizeData, profileRows, dataFilename });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
