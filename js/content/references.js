/*
 * Reference files for the Copilot Notebook, generated from the learner profile. Pure: no DOM.
 *
 * In a Notebook, Copilot answers only from the references added to it (plus its own knowledge);
 * it doesn't browse the web. These files give it the learner's context, the Starter Path, and the
 * domain's core concepts (the Theory chapters, js/content/theory.js) from the start. They are content, not prompts, so they don't compete with
 * the user's requests. Plain .txt, because Notebooks accept .txt references (not .md).
 * No technology-specific content: stack details come from the profile.
 */
(function (SP) {
  'use strict';

  // Profile rows shown in "My learning profile": [label, context variable].
  const PROFILE_ROWS = [
    ['Learning domain', 'domain'],
    ['Automation framework', 'framework'],
    ['Programming language', 'language'],
    ['Operating system', 'os'],
    ['IDE', 'ide'],
    ['Experience with the framework', 'experienceLevel'],
    ['Testing background', 'testingExperience'],
    ['Git experience', 'gitExperience'],
    ['Code hosting', 'vcsHost'],
    ['What I practice on', 'practiceTargetDescription'],
    ['Goal', 'goal'],
    ['Target duration', 'targetDuration'],
    ['Available time', 'availableTime'],
    ['Learning style', 'learningStyle'],
  ];

  const ESSENTIALS_TITLE = 'Automation testing essentials';

  function heading(title) {
    return title + '\n' + '='.repeat(title.length);
  }

  function profileFile(context, site) {
    const rows = PROFILE_ROWS.filter(([, key]) => context[key]).map(([label, key]) => label + ': ' + context[key].label);
    const lines = [
      heading('My learning profile'),
      '',
      'This file describes me and my learning goal. Use it as context for every answer in this Notebook.',
      '',
      rows.join('\n'),
    ];
    if (site) lines.push('', '', practiceSiteSection(site));
    return lines.join('\n');
  }

  /** What each page of the practice site offers, so exercises can point to the right page. */
  function practiceSiteSection(site) {
    const base = site.url.replace(/[^/]*$/, '');
    return [
      heading('My practice site: ' + site.name),
      '',
      site.url,
      '',
      site.summary,
      'Use only this site for every exercise and example, and never suggest another practice site. For each exercise, name the page to use.',
      '',
      'Pages and what to practise on them:',
      site.pages.map(([page, practice]) => '- ' + base + page + ': ' + practice).join('\n'),
    ].join('\n');
  }

  function planFile(path) {
    const steps = path.steps.map((step) => [
      'Step ' + step.number + ': ' + step.title + (step.optional ? ' (optional)' : ''),
      '  What: ' + step.summary,
      '  Done when: ' + step.definitionOfDone,
    ].join('\n'));
    return [
      heading('My Starter Path'),
      '',
      'I follow these steps in order, all in this Notebook. When I start a step, I will say its number and title.',
      'The step descriptions come from my learning app, so "you" in them means me, the learner.',
      '',
      steps.join('\n\n'),
    ].join('\n');
  }

  /** Built from the Theory chapters, so the app and the Notebook share one source of content. */
  function essentialsFile(theory) {
    const chapters = theory.chapters.map((chapter) => [
      chapter.title,
      '-'.repeat(chapter.title.length),
      chapter.summary.join('\n\n'),
      '',
      chapter.points.map((point) => '- ' + point).join('\n'),
    ].join('\n'));
    return [
      heading(ESSENTIALS_TITLE),
      '',
      'Core ideas and good practices for UI test automation, independent of any framework or language. How each one is done depends on my stack.',
      '',
      chapters.join('\n\n'),
    ].join('\n');
  }

  /**
   * Returns the reference files for a profile: [{ id, filename, title, description, text }].
   * Order matters: it is the order shown to the user.
   */
  function buildReferenceFiles(profile) {
    const values = SP.config.sanitizeProfile(profile);
    const context = SP.config.buildPromptContext(values);
    const path = SP.config.getStarterPath(values.domain);
    const domain = SP.config.getDomain(values.domain);
    const site = values.practiceTarget === 'demo-site' && domain && domain.practiceSite;
    const files = [
      {
        id: 'profile',
        filename: 'SkillPath 1 - My learning profile.txt',
        title: 'My learning profile',
        description: 'Your stack, experience, goal, and available time.',
        text: profileFile(context, site),
      },
    ];
    if (path) {
      files.push({
        id: 'plan',
        filename: 'SkillPath 2 - My Starter Path.txt',
        title: 'My Starter Path',
        description: 'The steps you will follow, with what each one involves and when it is done.',
        text: planFile(path),
      });
    }
    const theory = SP.content.getTheory(values.domain);
    if (theory) {
      files.push({
        id: 'essentials',
        filename: 'SkillPath 3 - ' + ESSENTIALS_TITLE + '.txt',
        title: ESSENTIALS_TITLE,
        description: 'The Theory chapters: core concepts and good practices, independent of your framework.',
        text: essentialsFile(theory),
      });
    }
    return files.map((f) => Object.assign(f, { text: f.text.trimEnd() + '\n' }));
  }

  SP.references = { buildReferenceFiles };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
