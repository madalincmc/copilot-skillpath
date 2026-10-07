/*
 * The app version, shown in the header and on the Version page (#/version).
 *
 *   number   "0.1b", "0.2b", … during the beta ("b" = beta), then "1.0" for the release.
 *            Shown as "v0.1b". package.json holds the same version in npm form ("0.1.0-beta"),
 *            checked by tests.
 *   date     Release date, YYYY-MM-DD.
 *   changes  What changed in this version only. Replace the list on every release.
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  config.version = {
    number: '0.2b',
    date: '2026-10-07',
    changes: [
      'Copilot asks for one thing at a time: first an exercise, then it reviews your output, then one question to check your understanding. No more two requests in the same message.',
      'Copilot ends each finished part of a step with a "Checkpoint:" line.',
      'New "Continue where I left off" prompt on every step, under Need help with this step?: after a break, Copilot finds your last checkpoint and continues from there instead of restarting the step.',
      'To get these changes, replace the instructions in your Notebook: go through the Notebook setup again and copy the new instructions.',
    ],
  };

  /** "v0.1b" */
  config.versionLabel = function () {
    return 'v' + config.version.number;
  };

  /** Whether the current version is a beta ("0.1b"). */
  config.isBetaVersion = function () {
    return /b$/.test(config.version.number);
  };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
