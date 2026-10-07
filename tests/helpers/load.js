// Loads the app's classic browser scripts into Node. Each script attaches to globalThis.SkillPath.
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

// Same order as index.html, minus the DOM-dependent UI scripts.
const CORE_SCRIPTS = [
  'js/config/version.js',
  'js/config/domains.js',
  'js/config/presets.js',
  'js/config/starter-path.js',
  'js/config/quizzes.js',
  'js/engine/prompt-engine.js',
  'js/config/helpers.js',
  'js/templates/registry.js',
  'js/templates/setup.js',
  'js/templates/steps.js',
  'js/templates/helpers.js',
  'js/templates/library.js',
  'js/templates/learning.js',
  'js/content/theory.js',
  'js/content/references.js',
  'js/storage/storage.js',
  'js/export/data-file.js',
];

function loadCore() {
  delete globalThis.SkillPath;
  for (const file of CORE_SCRIPTS) {
    const full = path.join(ROOT, file);
    delete require.cache[require.resolve(full)];
    require(full);
  }
  return globalThis.SkillPath;
}

/** The two presets plus variants, so tests cover more stacks, levels, and settings than the presets do. */
function testProfiles(SP) {
  const playwright = SP.config.applyPreset('starter-playwright-javascript');
  const selenium = SP.config.applyPreset('starter-selenium-java');
  return {
    playwright,
    selenium,
    seleniumIntermediate: Object.assign({}, selenium, {
      experienceLevel: 'intermediate',
      testingExperience: 'both',
      gitExperience: 'basic',
      goal: 'project-ready',
      timeAmount: '5',
      timeUnit: 'hours-week',
      duration: '1-month',
      learningStyle: 'balanced',
    }),
    cypressMac: Object.assign({}, playwright, {
      framework: 'cypress',
      language: 'javascript',
      os: 'macos',
      gitExperience: 'basic',
      goal: 'basics',
      timeAmount: '30',
      timeUnit: 'minutes-day',
      duration: '1-month',
    }),
  };
}

module.exports = { ROOT, CORE_SCRIPTS, loadCore, testProfiles };
