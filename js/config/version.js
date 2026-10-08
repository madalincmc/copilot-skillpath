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
    number: '0.3b',
    date: '2026-10-08',
    changes: [
      'Rewritten from scratch: the Notebook instructions, the step prompts, and the reference files. Each rule now lives in one place, so Copilot no longer gets mixed or repeated instructions.',
      'A clear step flow: one concept, one exercise with a review of your output, one check question, then a checkpoint. The 3 end-of-step questions come only when the step\'s "Done when" is met.',
      'If you skip part of a step, Copilot keeps the step open instead of finishing it.',
      'Each step prompt starts with the step number and title and includes its "Done when", so Copilot knows exactly where you are.',
      'For each exercise, Copilot names the page of the practice site to use.',
      'Reference files show the app version and when they were created, and Copilot uses only the newest copy. When you update a Notebook, the app asks you to remove the old SkillPath files first.',
      'To get these changes, set up a new Notebook, or update yours: remove the old SkillPath files from References, add the new ones, and replace the instructions.',
    ],
  };

  /** "v0.3b" */
  config.versionLabel = function () {
    return 'v' + config.version.number;
  };

  /** Whether the current version is a beta ("0.1b"). */
  config.isBetaVersion = function () {
    return /b$/.test(config.version.number);
  };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
