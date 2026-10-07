// The version shown in the app: one source (js/config/version.js), kept in step with package.json.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadCore } = require('./helpers/load');

const SP = loadCore();
const version = SP.config.version;
const ROOT = path.join(__dirname, '..');

test('the version matches package.json and is a 1.0 beta or a release', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(version.number, pkg.version);
  assert.match(version.number, /^\d+\.\d+\.\d+(-beta\.\d+)?$/);
});

test('the version has a label, a valid release date, and its changes', () => {
  assert.ok(version.label.trim());
  assert.match(version.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(version.date + 'T00:00:00Z').toISOString().slice(0, 10), version.date);
  assert.ok(version.changes.length > 0);
  for (const change of version.changes) assert.ok(typeof change === 'string' && change.trim(), 'empty change');
});

test('the Version page is a route and its script loads before the app shell', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/config/version.js') < html.indexOf('js/ui/app.js'));
  assert.ok(html.indexOf('js/ui/views/version.js') < html.indexOf('js/ui/app.js'));
  assert.match(html, /id="app-version"/);
  assert.match(fs.readFileSync(path.join(ROOT, 'js/ui/app.js'), 'utf8'), /\{ id: 'version', label: 'Version', hidden: true \}/);
});
