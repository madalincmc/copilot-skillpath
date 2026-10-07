/*
 * The app version, shown in the header and on the Version page (#/version).
 *
 *   number   Semantic version; must match "version" in package.json (checked by tests).
 *            Betas are 1.0.0-beta.N until the 1.0.0 release.
 *   label    How the version reads in the app.
 *   date     Release date, YYYY-MM-DD.
 *   changes  What changed in this version only. Replace the list on every release.
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  config.version = {
    number: '1.0.0-beta.1',
    label: '1.0 Beta 1',
    date: '2026-10-07',
    changes: [
      'New step 2, "Learn the language essentials": the language basics and terminal skills you need before creating a project. Later steps moved up by one; your progress is kept.',
      'Copilot now teaches in more depth: one concept at a time, with an example, common mistakes, exercises, and a question to check your understanding.',
      'The QA Automation Playground is the default practice site, and Copilot uses only this site. Your reference files list every page and what to practise on it.',
      'A banner tells you when your profile no longer matches your Notebook, and what to do: update the Notebook, or start again with a new one after changing your framework or language.',
      'The app version is shown in the header, with this page of what is new.',
    ],
  };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
