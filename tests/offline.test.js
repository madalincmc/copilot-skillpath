// Guards the local-first constraints: every script is loaded by index.html as a classic script,
// and nothing references the network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, CORE_SCRIPTS } = require('./helpers/load');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function listFiles(dir, ext) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = dir + '/' + entry.name;
    if (entry.isDirectory()) return listFiles(rel, ext);
    return entry.name.endsWith(ext) ? [rel] : [];
  });
}

test('index.html loads every script in js/, in the same order the tests use', () => {
  const loaded = Array.from(html.matchAll(/<script src="([^"]+)"><\/script>/g), (m) => m[1]);
  assert.deepEqual(loaded.slice().sort(), listFiles('js', '.js').sort());
  assert.deepEqual(loaded.filter((s) => CORE_SCRIPTS.includes(s)), CORE_SCRIPTS);
});

test('no ES modules, fetch, or network URLs in the app', () => {
  assert.doesNotMatch(html, /type="module"/);
  for (const file of ['index.html', ...listFiles('js', '.js'), ...listFiles('css', '.css')]) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(source, /\bfetch\(|XMLHttpRequest|\bimport\s*\(|^\s*import\s/m, file);
    // Example URLs shown to users as placeholder text are allowed.
    const urls = (source.match(/https?:\/\/[^\s"'<>)]+/g) || []).filter((u) => !/example\.com/.test(u));
    assert.deepEqual(urls, [], file);
  }
});
