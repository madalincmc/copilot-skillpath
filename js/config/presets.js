/*
 * Presets pre-fill a learning profile in one click. Every value can still be changed in the form.
 * Values must be valid option values for the domain's fields (checked by validate-config.js).
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  const STARTER = {
    experienceLevel: 'beginner',
    testingExperience: 'manual',
    gitExperience: 'none',
    os: 'windows',
    vcsHost: 'github',
    practiceTarget: 'demo-site',
    goal: 'manual-to-automation',
    timeAmount: '1',
    timeUnit: 'hours-day',
    duration: '2-months',
    learningStyle: 'hands-on-first',
  };

  config.presets = [
    {
      id: 'starter-playwright-javascript',
      label: 'Starter automation: Playwright + JavaScript',
      description: 'Beginner coming from manual testing. Windows, VS Code, new to Git.',
      domain: 'automation-testing',
      values: Object.assign({ framework: 'playwright', language: 'javascript', ide: 'vscode' }, STARTER),
    },
    {
      id: 'starter-selenium-java',
      label: 'Starter automation: Selenium + Java',
      description: 'Beginner coming from manual testing. Windows, IntelliJ IDEA, new to Git.',
      domain: 'automation-testing',
      values: Object.assign({ framework: 'selenium', language: 'java', ide: 'intellij' }, STARTER),
    },
  ];
})((globalThis.SkillPath = globalThis.SkillPath || {}));
