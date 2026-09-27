// Loads the app's classic browser scripts into Node. Each script attaches to globalThis.SkillPath.
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

// Same order as index.html, minus the DOM-dependent UI scripts.
const CORE_SCRIPTS = [
  'js/config/domains.js',
  'js/config/presets.js',
  'js/config/starter-path.js',
  'js/engine/prompt-engine.js',
  'js/config/helpers.js',
  'js/templates/registry.js',
  'js/templates/setup.js',
  'js/templates/steps.js',
  'js/templates/helpers.js',
  'js/templates/library.js',
  'js/storage/storage.js',
  'js/export/prompt-pack.js',
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

module.exports = { ROOT, CORE_SCRIPTS, loadCore };
