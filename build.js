/*
 * Builds the distributable: one self-contained HTML file with the stylesheet and every script
 * inlined, in the same order as index.html.
 *
 *   node build.js            -> dist/copilot-skillpath.html
 *   node build.js --out DIR  -> DIR/copilot-skillpath.html
 *
 * No dependencies, so it runs anywhere Node does.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const FILENAME = 'copilot-skillpath.html';

/**
 * A `</script` inside a JS string would end the inlined block early. Splitting the tag keeps the
 * code identical to the parser while making it invisible to the HTML tokenizer.
 */
function escapeForInlineScript(code) {
  return code.replace(/<\/(script)/gi, '<\\/$1');
}

function build() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const inlined = [];

  let out = html.replace(/[ \t]*<link rel="stylesheet" href="([^"]+)">/g, (match, href) => {
    inlined.push(href);
    const css = fs.readFileSync(path.join(ROOT, href), 'utf8').trim();
    return '  <style>\n' + css + '\n  </style>';
  });

  out = out.replace(/[ \t]*<script src="([^"]+)"><\/script>/g, (match, src) => {
    inlined.push(src);
    const js = fs.readFileSync(path.join(ROOT, src), 'utf8').trim();
    return '  <script>\n/* ' + src + ' */\n' + escapeForInlineScript(js) + '\n  </script>';
  });

  // The note about load order belongs to the source layout, not to the single-file build.
  out = out.replace(/[ \t]*<!--\n\s*Classic scripts on purpose:[\s\S]*?-->\n/, '');
  out = out.replace('<!doctype html>', '<!doctype html>\n<!-- Copilot SkillPath - single-file build. Open it in a browser; no install needed. -->');

  return { html: out, inlined };
}

function main() {
  const outIndex = process.argv.indexOf('--out');
  const outDir = outIndex === -1 ? path.join(ROOT, 'dist') : path.resolve(process.argv[outIndex + 1]);
  const { html, inlined } = build();

  fs.mkdirSync(outDir, { recursive: true });
  const target = path.join(outDir, FILENAME);
  fs.writeFileSync(target, html);

  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.log('Built ' + path.relative(process.cwd(), target) + ' (' + kb + ' KB, ' + inlined.length + ' files inlined)');
}

if (require.main === module) main();

module.exports = { build, FILENAME };
