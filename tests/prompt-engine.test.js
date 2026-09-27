const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

const SP = loadCore();
const { generate, validateTemplate, renderText, buildContext, TemplateError } = SP.engine;

const ctx = (values) => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? { value: v, label: v } : v]));

function template(overrides) {
  return Object.assign({ id: 't', version: 1, title: 'T', requiredVariables: [], optionalVariables: [], inputs: [] }, overrides);
}

test('injects variable labels, not raw values', () => {
  const t = template({ body: 'I use {{framework}}.', requiredVariables: ['framework'] });
  const out = generate(t, { context: { framework: { value: 'playwright', label: 'Playwright' } } });
  assert.equal(out.text, 'I use Playwright.');
  assert.deepEqual(out.missing, []);
  assert.equal(out.templateId, 't');
  assert.equal(out.templateVersion, 1);
  assert.equal(out.charCount, 'I use Playwright.'.length);
});

test('conditions compare raw values: ==, !=, in, truthy, falsy, else', () => {
  const t = template({
    optionalVariables: ['git', 'os', 'notes'],
    body: [
      '{{#if git == "none"}}Explain Git basics.{{else}}Skip Git basics.{{/if}}',
      '{{#if git != "none"}}Assume Git knowledge.{{/if}}',
      '{{#if os in ["macos", "linux"]}}Use a Unix shell.{{/if}}',
      '{{#if notes}}Has notes.{{/if}}',
      '{{#if !notes}}No notes.{{/if}}',
    ].join('\n'),
  });
  // Inline blocks that render nothing leave an empty line; standalone block lines don't (next test).
  const a = generate(t, { context: { git: { value: 'none', label: 'None' }, os: { value: 'linux', label: 'Linux' } } });
  assert.equal(a.text, 'Explain Git basics.\n\nUse a Unix shell.\n\nNo notes.');
  const b = generate(t, { context: ctx({ git: 'basic', os: 'windows', notes: 'x' }) });
  assert.equal(b.text, 'Skip Git basics.\nAssume Git knowledge.\n\nHas notes.');
});

test('block tags on their own line leave no blank lines behind', () => {
  const t = template({
    optionalVariables: ['git'],
    body: 'Line A\n{{#if git == "none"}}\nInclude Git basics.\n{{/if}}\nLine B',
  });
  assert.equal(generate(t, { context: ctx({ git: 'none' }) }).text, 'Line A\nInclude Git basics.\nLine B');
  assert.equal(generate(t, { context: ctx({ git: 'basic' }) }).text, 'Line A\nLine B');
});

test('supports nested conditions', () => {
  const t = template({
    optionalVariables: ['a', 'b'],
    body: '{{#if a}}\nA\n{{#if b}}\nB\n{{else}}\nnot B\n{{/if}}\n{{/if}}',
  });
  assert.equal(generate(t, { context: ctx({ a: '1', b: '1' }) }).text, 'A\nB');
  assert.equal(generate(t, { context: ctx({ a: '1' }) }).text, 'A\nnot B');
  assert.equal(generate(t, { context: {} }).text, '');
});

test('empty prompt-level inputs render as placeholders; filled inputs keep indentation', () => {
  const t = template({
    inputs: [{ id: 'error', label: 'Error', placeholder: '[PASTE THE ERROR HERE]' }],
    body: 'Help me with this error:\n{{input:error}}',
  });
  assert.equal(generate(t).text, 'Help me with this error:\n[PASTE THE ERROR HERE]');
  assert.equal(generate(t, { inputs: { error: '   ' } }).text, 'Help me with this error:\n[PASTE THE ERROR HERE]');
  assert.equal(generate(t, { inputs: { error: '\n  at foo()\n  at bar()  \n\n' } }).text, 'Help me with this error:\n  at foo()\n  at bar()');
});

test('a line using an absent optional variable is dropped cleanly', () => {
  const t = template({
    requiredVariables: ['framework'],
    optionalVariables: ['ide'],
    body: 'Framework: {{framework}}\nIDE: {{ide}}\nThanks.',
  });
  assert.equal(generate(t, { context: ctx({ framework: 'Cypress' }) }).text, 'Framework: Cypress\nThanks.');
  assert.equal(generate(t, { context: ctx({ framework: 'Cypress', ide: '  ' }) }).text, 'Framework: Cypress\nThanks.');
});

test('absent required variables are reported and visibly marked', () => {
  const t = template({ requiredVariables: ['framework', 'language'], body: 'Use {{framework}} with {{language}}.' });
  const out = generate(t, { context: ctx({ framework: 'Playwright' }) });
  assert.deepEqual(out.missing, ['language']);
  assert.equal(out.text, 'Use Playwright with [MISSING: language].');
});

test('step variables are built in', () => {
  const t = template({ body: 'Step {{step.number}}: {{step.title}}. Done when: {{step.definitionOfDone}}' });
  const step = { number: 4, title: 'Write my first test', definitionOfDone: 'One test passes.' };
  assert.equal(generate(t, { step }).text, 'Step 4: Write my first test. Done when: One test passes.');
});

test('sections are joined with one blank line and empty sections are skipped', () => {
  const t = template({ optionalVariables: ['x'], body: 'Body.', interaction: '{{x}}', output: 'Output.' });
  assert.equal(generate(t).text, 'Body.\n\nOutput.');
});

test('output is deterministic', () => {
  const t = template({ requiredVariables: ['a'], optionalVariables: ['b'], body: '{{a}}\n{{#if b}}\n{{b}}\n{{/if}}' });
  const options = { context: ctx({ a: 'x', b: 'y' }) };
  assert.deepEqual(generate(t, options), generate(t, options));
});

test('validateTemplate reports authoring mistakes', () => {
  assert.deepEqual(validateTemplate(template({ body: 'ok' })), []);

  const cases = [
    [template({ version: 0, body: 'x' }), /version/],
    [template({ body: '' }), /body is required/],
    [template({ body: 'Use {{framework}}' }), /undeclared variable "framework"/],
    [template({ body: '{{#if framework}}x{{/if}}' }), /undeclared variable "framework"/],
    [template({ body: '{{#if a}}x', optionalVariables: ['a'] }), /Unclosed/],
    [template({ body: 'x{{/if}}' }), /without matching/],
    [template({ body: '{{#if a >= "1"}}x{{/if}}', optionalVariables: ['a'] }), /Invalid condition/],
    [template({ body: '{{input:err}}' }), /undeclared input "err"/],
    [template({ body: '{{input:e}}', inputs: [{ id: 'e', label: 'E' }] }), /needs a placeholder/],
    [template({ body: '{{step.foo}}' }), /unknown step variable/],
    [template({ body: '{{ weird tag! }}' }), /Unknown tag/],
  ];
  for (const [t, pattern] of cases) {
    const errors = validateTemplate(t);
    assert.ok(errors.some((e) => pattern.test(e)), 'expected ' + pattern + ' in ' + JSON.stringify(errors));
  }
});

test('generate throws TemplateError for an invalid template', () => {
  assert.throws(() => generate(template({ body: '{{nope}}' })), TemplateError);
});

test('renderText renders short strings and drops lines with absent variables', () => {
  assert.equal(renderText('Official {{framework}} documentation', ctx({ framework: 'Cypress' })), 'Official Cypress documentation');
  assert.equal(renderText('Official {{framework}} documentation', {}), '');
});

test('buildContext resolves option labels, custom "other" labels, and derived variables', () => {
  const fields = [
    { id: 'framework', type: 'select', options: [{ value: 'playwright', label: 'Playwright' }, { value: 'other', label: 'Other', labelFromField: 'frameworkOther' }] },
    { id: 'frameworkOther', type: 'text' },
    { id: 'goal', type: 'select', options: [{ value: 'basics', label: 'Learn the basics', promptLabel: 'learn the basics' }] },
    { id: 'notes', type: 'text' },
  ];
  const derived = [{ id: 'summary', compute: (c) => (c.goal ? 'goal: ' + c.goal.label : '') }];

  const c1 = buildContext({ framework: 'other', frameworkOther: ' TestCafe ', goal: 'basics', notes: '' }, fields, derived);
  assert.deepEqual(c1.framework, { value: 'other', label: 'TestCafe' });
  assert.deepEqual(c1.goal, { value: 'basics', label: 'learn the basics' });
  assert.equal(c1.notes, undefined);
  assert.equal(c1.summary.label, 'goal: learn the basics');

  const c2 = buildContext({ framework: 'unknown-value' }, fields, derived);
  assert.equal(c2.framework, undefined);
  assert.equal(c2.summary, undefined);
});
