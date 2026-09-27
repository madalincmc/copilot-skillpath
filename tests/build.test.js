// The single-file build must inline every stylesheet and script from index.html, in order,
// and reference nothing outside itself.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./helpers/load');
const { build } = require('../build');

const source = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = Array.from(source.matchAll(/<script src="([^"]+)"><\/script>/g), (m) => m[1]);
const { html, inlined } = build();

test('every stylesheet and script is inlined, in index.html order', () => {
  assert.deepEqual(inlined, ['css/styles.css'].concat(scripts));
  const order = scripts.map((src) => html.indexOf('/* ' + src + ' */'));
  assert.ok(order.every((i) => i > 0), 'all scripts present');
  assert.deepEqual(order, order.slice().sort((a, b) => a - b), 'order preserved');
});

test('the build references no external files', () => {
  assert.doesNotMatch(html, /<script src=|<link rel="stylesheet"/);
  // One <script> block per source file, and no stray closing tags from the inlined code.
  assert.equal((html.match(/<script>/g) || []).length, scripts.length);
  assert.equal((html.match(/<\/script>/g) || []).length, scripts.length);
  assert.match(html, /<\/html>\s*$/);
});
