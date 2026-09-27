/*
 * Reference files for the Copilot Notebook, generated from the learner profile. Pure: no DOM.
 *
 * In a Notebook, Copilot answers only from the references added to it (plus its own knowledge);
 * it doesn't browse the web. These files give it the learner's context, the Starter Path, and the
 * domain's core concepts from the start. They are content, not prompts, so they don't compete with
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

  // Core concepts per domain. Generic on purpose: no framework, language, or tool names.
  const ESSENTIALS = {
    'automation-testing': {
      title: 'Automation testing essentials',
      intro: 'Core concepts and good practices for UI test automation. They apply to any framework and language; how each one is done depends on my stack.',
      sections: [
        {
          title: 'Key concepts',
          items: [
            'Automated test: code that performs the steps of a test case and checks the result, so it can run the same way every time.',
            'Test runner: the tool that finds tests, runs them, and reports which passed and which failed.',
            'Locator (selector): how a test finds an element on the page, for example by role, label, text, or a dedicated test ID.',
            'Assertion: a check that compares the actual result with the expected one. A test without assertions only proves that nothing crashed.',
            'Waiting: pages change over time, so tests must wait for the right state (an element visible, a request finished) instead of pausing for a fixed time.',
            'Flaky test: a test that sometimes passes and sometimes fails without any code change. Usual causes: fixed sleeps, fragile locators, shared test data, or tests that depend on each other.',
            'Test isolation: each test sets up what it needs and can run alone and in any order.',
            'Setup and teardown (hooks, fixtures): code that runs before or after tests to prepare and clean up state, such as opening a page or creating test data.',
            'Test data: the input a test uses. Keep it predictable, and create it for the test instead of relying on whatever is already there.',
            'Page Object Model: a class per page or component that holds its locators and actions, so tests read like user steps and a UI change is fixed in one place.',
            'Arrange, Act, Assert: a test structure. Prepare the state, perform one action, then check the outcome.',
            'Headed and headless: running with a visible browser window, or without one (faster, and what continuous integration usually uses).',
            'Test report: the summary of a run, often with screenshots, logs, or traces for failed tests.',
            'Version control: tracking changes in a repository. A commit saves a change; pushing sends commits to the shared remote; .gitignore lists files that must not be committed.',
            'Continuous integration (CI): a service that runs the tests automatically, for example on every push, and shows the results.',
            'Configuration: settings such as the base URL, browser, or timeouts, kept in one place instead of inside tests. Secrets and passwords never go into the code.',
          ],
        },
        {
          title: 'Good practices',
          items: [
            'Prefer locators that users can see or that exist for testing (role, label, text, test ID) over locators tied to layout or long element paths.',
            'Use the framework\'s waiting and assertions instead of fixed sleeps.',
            'Keep each test focused on one behavior, with a name that says what it checks.',
            'Keep tests independent: no shared state and no required order.',
            'Keep locators in page objects, not scattered across tests.',
            'Run a failing test alone and read the error, report, or trace before changing code.',
            'Commit small, working changes with clear messages.',
          ],
        },
        {
          title: 'Common pitfalls',
          items: [
            'Fixed sleeps that make tests slow and still flaky.',
            'Locators that break when the page layout changes.',
            'Tests that pass because they never assert anything.',
            'Tests that depend on data created by other tests.',
            'Committing generated folders, reports, or credentials.',
          ],
        },
      ],
    },
  };

  function heading(title) {
    return title + '\n' + '='.repeat(title.length);
  }

  function profileFile(context) {
    const rows = PROFILE_ROWS.filter(([, key]) => context[key]).map(([label, key]) => label + ': ' + context[key].label);
    return [
      heading('My learning profile'),
      '',
      'This file describes me and my learning goal. Use it as context for every answer in this Notebook.',
      '',
      rows.join('\n'),
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

  function essentialsFile(essentials) {
    const sections = essentials.sections.map((section) => section.title + '\n' + '-'.repeat(section.title.length) + '\n' + section.items.map((i) => '- ' + i).join('\n'));
    return [heading(essentials.title), '', essentials.intro, '', sections.join('\n\n')].join('\n');
  }

  /**
   * Returns the reference files for a profile: [{ id, filename, title, description, text }].
   * Order matters: it is the order shown to the user.
   */
  function buildReferenceFiles(profile) {
    const values = SP.config.sanitizeProfile(profile);
    const context = SP.config.buildPromptContext(values);
    const path = SP.config.getStarterPath(values.domain);
    const files = [
      {
        id: 'profile',
        filename: 'SkillPath 1 - My learning profile.txt',
        title: 'My learning profile',
        description: 'Your stack, experience, goal, and available time.',
        text: profileFile(context),
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
    const essentials = ESSENTIALS[values.domain];
    if (essentials) {
      files.push({
        id: 'essentials',
        filename: 'SkillPath 3 - ' + essentials.title + '.txt',
        title: essentials.title,
        description: 'Core concepts and good practices, independent of your framework.',
        text: essentialsFile(essentials),
      });
    }
    return files.map((f) => Object.assign(f, { text: f.text.trimEnd() + '\n' }));
  }

  SP.references = { buildReferenceFiles };
})((globalThis.SkillPath = globalThis.SkillPath || {}));
