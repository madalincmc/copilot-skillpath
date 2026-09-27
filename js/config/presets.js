/*
 * Presets pre-fill a learning profile in one click. Every value can still be changed in the form.
 * Values must be valid option values for the domain's fields (checked by validate-config.js).
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  config.presets = [
    {
      id: 'qa-manual-to-automation-windows',
      label: 'Manual tester starting automation',
      description: 'Playwright + TypeScript on Windows with VS Code. New to Git.',
      domain: 'automation-testing',
      values: {
        framework: 'playwright',
        language: 'typescript',
        experienceLevel: 'beginner',
        testingExperience: 'manual',
        gitExperience: 'none',
        os: 'windows',
        ide: 'vscode',
        vcsHost: 'github',
        practiceTarget: 'demo-site',
        goal: 'manual-to-automation',
        timeAmount: '1',
        timeUnit: 'hours-day',
        duration: '2-months',
        learningStyle: 'hands-on-first',
      },
    },
    {
      id: 'qa-selenium-java-intermediate',
      label: 'Automation engineer, Selenium + Java',
      description: 'Intermediate, Windows with IntelliJ. Wants to become project-ready.',
      domain: 'automation-testing',
      values: {
        framework: 'selenium',
        language: 'java',
        experienceLevel: 'intermediate',
        testingExperience: 'both',
        gitExperience: 'basic',
        os: 'windows',
        ide: 'intellij',
        vcsHost: 'github',
        practiceTarget: 'demo-site',
        goal: 'project-ready',
        timeAmount: '5',
        timeUnit: 'hours-week',
        duration: '1-month',
        learningStyle: 'balanced',
      },
    },
    {
      id: 'qa-cypress-js-macos',
      label: 'Beginner, Cypress + JavaScript',
      description: 'macOS with VS Code. Learn the basics, hands-on.',
      domain: 'automation-testing',
      values: {
        framework: 'cypress',
        language: 'javascript',
        experienceLevel: 'beginner',
        testingExperience: 'manual',
        gitExperience: 'basic',
        os: 'macos',
        ide: 'vscode',
        vcsHost: 'github',
        practiceTarget: 'demo-site',
        goal: 'basics',
        timeAmount: '30',
        timeUnit: 'minutes-day',
        duration: '1-month',
        learningStyle: 'hands-on-first',
      },
    },
  ];
})((globalThis.SkillPath = globalThis.SkillPath || {}));
