const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore, testProfiles } = require('./helpers/load');

const SP = loadCore();
const P = testProfiles(SP);
const config = SP.config;
const profiles = Object.entries(P);

test('three .txt reference files are built for every test profile', () => {
  for (const [name, profile] of profiles) {
    const files = SP.references.buildReferenceFiles(profile);
    assert.deepEqual(files.map((f) => f.id), ['profile', 'plan', 'essentials'], name);
    for (const file of files) {
      assert.match(file.filename, /\.txt$/);
      assert.ok(file.title && file.description, file.id);
      assert.doesNotMatch(file.text, /undefined|null|\[MISSING|\{\{|\}\}/, name + ' / ' + file.id);
      assert.ok(file.text.endsWith('\n') && !file.text.endsWith('\n\n'), file.id);
    }
  }
});

test('the profile file reflects the profile', () => {
  const [profileFile] = SP.references.buildReferenceFiles(P.seleniumIntermediate);
  assert.match(profileFile.text, /^My learning profile\n=+\n/);
  assert.match(profileFile.text, /Automation framework: Selenium WebDriver/);
  assert.match(profileFile.text, /Programming language: Java/);
  assert.match(profileFile.text, /IDE: IntelliJ IDEA/);
  assert.match(profileFile.text, /Available time: 5 hours per week/);
});

test('the profile file uses the custom text for "Other"', () => {
  const profile = Object.assign({}, P.playwright, { framework: 'other', frameworkOther: 'TestCafe', language: 'javascript' });
  const [profileFile] = SP.references.buildReferenceFiles(profile);
  assert.match(profileFile.text, /Automation framework: TestCafe/);
});

test('the plan file lists every Starter Path step with its outcome', () => {
  const files = SP.references.buildReferenceFiles(P.cypressMac);
  const plan = files.find((f) => f.id === 'plan').text;
  for (const step of config.getStarterPath('automation-testing').steps) {
    assert.ok(plan.includes('Step ' + step.number + ': ' + step.title), step.id);
    assert.ok(plan.includes('Done when: ' + step.definitionOfDone), step.id);
  }
  assert.match(plan, /Step 11: Run tests in CI \(optional\)/);
});

test('the essentials file is the same for every stack and names no technology', () => {
  const texts = profiles.map(([, p]) => SP.references.buildReferenceFiles(p).find((f) => f.id === 'essentials').text);
  assert.ok(texts.every((t) => t === texts[0]));
  const names = ['framework', 'language', 'ide']
    .flatMap((id) => config.getFields('automation-testing').find((f) => f.id === id).options)
    .filter((o) => o.value !== 'other')
    .map((o) => o.label);
  for (const name of names) assert.ok(!texts[0].includes(name), 'mentions ' + name);
  for (const chapter of SP.content.getTheory('automation-testing').chapters) {
    assert.ok(texts[0].includes(chapter.title + '\n' + '-'.repeat(chapter.title.length)), chapter.id);
    for (const point of chapter.points) assert.ok(texts[0].includes('- ' + point), chapter.id);
  }
});

test('the profile file lists the practice site pages only when the learner uses the practice site', () => {
  const demo = SP.references.buildReferenceFiles(config.applyPreset('starter-playwright-javascript'))[0].text;
  assert.match(demo, /My practice site: QA Automation Playground/);
  assert.match(demo, /never suggest another practice site/);
  assert.match(demo, /- https:\/\/auto-test-site\.vercel\.app\/dynamic\.html: Delayed elements/);
  for (const [page] of config.getDomain('automation-testing').practiceSite.pages) assert.ok(demo.includes('/' + page + ': '), page);

  const ownApp = Object.assign(config.applyPreset('starter-playwright-javascript'), { practiceTarget: 'own-app', practiceTargetDetails: 'https://staging.example.com' });
  const own = SP.references.buildReferenceFiles(ownApp)[0].text;
  assert.doesNotMatch(own, /practice site|auto-test-site/);
});
