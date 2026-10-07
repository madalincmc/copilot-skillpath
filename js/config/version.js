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
    number: '0.1b',
    date: '2026-10-07',
    changes: [
      'New step 2, "Learn the language essentials": the language basics and terminal skills you need before creating a project. Later steps moved up by one; your progress is kept.',
      'Copilot now teaches in more depth: one concept at a time, with an example, common mistakes, exercises, and a question to check your understanding.',
      'The QA Automation Playground is the default practice site, and Copilot uses only this site. Your reference files list every page and what to practise on it.',
      'A banner tells you when your profile no longer matches your Notebook, and what to do: update the Notebook, or start again with a new one after changing your framework or language.',
      'The app version is shown in the header, with this page of what is new.',
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
