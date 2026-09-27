/*
 * Theory: short reading chapters per domain, shown in the Theory section and used to build the
 * "essentials" Notebook reference file. Pure data, no DOM.
 *
 * Framework-independent on purpose (PRD §4.3): each chapter explains the idea, and its
 * "Go deeper" prompt asks Copilot to explain it for the learner's stack.
 *
 * Chapter schema:
 *   id           Stable id.
 *   title        Chapter title.
 *   summary      One or two short paragraphs.
 *   points       Key points (one sentence each).
 *   deeperTopic  Topic for the "Go deeper in Copilot" prompt; may use {{variables}}.
 *   quizTopicId  Quiz topic (config.quizTopics) for "Quiz me on this".
 */
(function (SP) {
  'use strict';

  const theory = {
    'automation-testing': {
      title: 'Automation testing theory',
      intro: 'Short chapters on the ideas behind each Starter Path step. They apply to any framework and language; use "Go deeper in Copilot" to see how each one works in your stack.',
      chapters: [
        {
          id: 'fundamentals',
          title: 'What test automation is',
          summary: [
            'An automated test is code that drives the application the way a user or another system would, and checks that the result matches what is expected. It repeats the same checks the same way every time, which makes it good at catching regressions.',
            'Automation complements manual testing; it does not replace it. Exploratory testing, usability, and judging whether something "looks right" still need a person.',
          ],
          points: [
            'Automate checks that are repetitive, stable, and valuable, such as smoke tests and regression tests of key user flows.',
            'Tests exist at several levels: component (unit), integration, system, and acceptance. UI automation usually works at the system level, end to end.',
            'UI tests are slower and more fragile than unit or API tests, so keep the UI suite focused on the most important user journeys.',
            'Every test needs a clear expected result. A test that cannot fail does not protect anything.',
            'A test case describes what to check; an automated test is one way to execute it. Good test design comes before code.',
          ],
          deeperTopic: 'what test automation is good for, and where UI tests with {{framework}} fit among the test levels',
          quizTopicId: 'fundamentals',
        },
        {
          id: 'project',
          title: 'Your project and environment',
          summary: [
            'A test automation project is a normal software project: it has a runtime, dependencies, configuration, and a folder structure. Understanding these parts makes errors much easier to read.',
          ],
          points: [
            'The runtime runs your code; a package manager or build tool downloads the libraries your project depends on.',
            'Dependencies are declared in a project file and pinned in a lock file, so everyone installs the same versions.',
            'Installed dependencies and generated output (reports, screenshots) are not committed; they are recreated from the project file.',
            'A configuration file holds settings such as the base URL, browsers, timeouts, and reporters, instead of repeating them in every test.',
            'Tests usually live in their own folder and follow a naming pattern, so the test runner can find them.',
          ],
          deeperTopic: 'how a {{framework}} project with {{language}} is structured: its project file, dependencies, configuration, and folders',
          quizTopicId: 'framework',
        },
        {
          id: 'anatomy',
          title: 'Anatomy of a test',
          summary: [
            'A test runner finds your tests, runs them, and reports the results. Each test should check one behavior, be readable as a short story of user steps, and be able to run on its own.',
          ],
          points: [
            'Arrange, Act, Assert: prepare the state, perform one action, then check the outcome.',
            'Give each test a name that says what behavior it checks, not how.',
            'Setup and teardown hooks (or fixtures) prepare and clean up what tests need, such as opening a page or creating test data.',
            'Tests must be independent: no shared state and no required order, so any test can run alone.',
            'Use predictable test data that the test creates or controls, instead of whatever happens to be in the system.',
          ],
          deeperTopic: 'the structure of a test in {{framework}}: the test runner, hooks or fixtures, and how to organize a test file',
          quizTopicId: 'framework',
        },
        {
          id: 'locators',
          title: 'Locators',
          summary: [
            'A locator is how a test finds an element on the page. Good locators keep working when the layout or styling changes; bad locators break every time the page is redesigned.',
          ],
          points: [
            'Prefer what a user can perceive: the element\'s role and accessible name, its label, or its visible text.',
            'When that is not enough, use a dedicated test ID that the development team keeps stable.',
            'Avoid locators tied to layout: long element paths, positions or indexes, and generated class names.',
            'A locator should match exactly one element; if it matches several, make it more specific.',
            'Keep locators in one place (for example, a page object) so a UI change is fixed once.',
          ],
          deeperTopic: 'locator strategies in {{framework}}, which ones it recommends, and why',
          quizTopicId: 'locators',
        },
        {
          id: 'assertions',
          title: 'Assertions and waiting',
          summary: [
            'An assertion compares what actually happened with what should have happened. Because pages load and change over time, tests must wait for the right state before acting or checking, and must never rely on fixed pauses.',
          ],
          points: [
            'Assert on outcomes the user would notice: text shown, a page reached, an element enabled or visible.',
            'Fixed sleeps make tests slow and still flaky; wait for a condition instead.',
            'Many frameworks wait automatically before actions or retry assertions until a timeout; know which ones yours does.',
            'A flaky test passes and fails without code changes. Common causes are fixed sleeps, fragile locators, shared data, and order-dependent tests.',
            'When a wait times out, the error usually says what was expected; read it before adding longer timeouts.',
          ],
          deeperTopic: 'assertions and waiting in {{framework}}: what waits automatically, how assertions retry, and how to avoid flaky tests',
          quizTopicId: 'assertions',
        },
        {
          id: 'page-objects',
          title: 'Page Object Model',
          summary: [
            'The Page Object Model puts the locators and actions of a page or component into one class. Tests then read like user steps ("log in", "add to cart"), and when the UI changes, only the page object changes.',
          ],
          points: [
            'A page object exposes actions a user can take, with meaningful method names.',
            'Locators live in the page object, not in the tests.',
            'Many teams keep assertions in the tests, so page objects stay reusable and tests stay explicit about what they check.',
            'Large pages can be split into smaller component objects, such as a header or a search box.',
            'Keep page objects simple; they organize the code, they do not replace good test design.',
          ],
          deeperTopic: 'the Page Object Model with {{framework}} and {{language}}: how to structure a page object and use it in tests',
          quizTopicId: 'page-objects',
        },
        {
          id: 'running',
          title: 'Running and debugging tests',
          summary: [
            'You will run tests many ways: all of them, one file, or one test; with a visible browser or headless; in parallel. When a test fails, the report and the artifacts it saves tell you why.',
          ],
          points: [
            'Headed runs show the browser and help while writing and debugging; headless runs are faster and are what CI uses.',
            'Run a single failing test on its own before changing code.',
            'Reports often include screenshots, videos, logs, or traces for failed tests; read them first.',
            'Parallel runs save time but need independent tests.',
            'Automatic retries can hide flaky tests; if you use them, still investigate tests that needed a retry.',
          ],
          deeperTopic: 'running and debugging tests with {{framework}}: filtering tests, headed and headless runs, reports, and debugging tools',
          quizTopicId: 'running',
        },
        {
          id: 'git',
          title: 'Version control with Git',
          summary: [
            'Git records the history of your project. A hosting service such as GitHub keeps a shared copy, so you can back up your work, collaborate, and run tests automatically.',
          ],
          points: [
            'A repository holds the project and its history; a commit is a saved, described change.',
            'Pushing sends your commits to the remote repository; pulling brings in others\' changes.',
            'Branches let you work on a change without affecting the main line.',
            'A .gitignore file lists what must not be committed, such as installed dependencies, reports, and local settings.',
            'Never commit passwords, tokens, or other secrets; if one is committed, treat it as exposed and change it.',
          ],
          deeperTopic: 'Git basics for a test automation project on {{vcsHost}}: commits, branches, .gitignore, and pushing',
          quizTopicId: 'git',
        },
        {
          id: 'ci',
          title: 'Continuous integration',
          summary: [
            'Continuous integration (CI) runs your tests automatically, for example on every push or pull request, on a clean machine. It catches problems early and proves that the tests do not depend on your computer.',
          ],
          points: [
            'A CI workflow is a file in the repository that says when to run and which steps to run.',
            'Typical steps: get the code, set up the runtime, install dependencies, run the tests headless, and keep the report.',
            'Save reports and screenshots as build artifacts so failures can be investigated.',
            'Keep secrets in the CI service\'s secret settings, never in the workflow file.',
            'A red build should be fixed first; a suite that is often red stops being trusted.',
          ],
          deeperTopic: 'running {{framework}} tests in continuous integration on {{vcsHost}}: the workflow file, steps, and artifacts',
          quizTopicId: 'ci',
        },
        {
          id: 'practices',
          title: 'Good practices and common pitfalls',
          summary: [
            'Most problems in UI automation come from a small set of habits. These are worth checking in every test you write or review.',
          ],
          points: [
            'Good: stable, user-facing locators; waiting for conditions; one behavior per test; independent tests; locators in page objects.',
            'Good: read the failure, report, or trace before changing code; commit small, working changes with clear messages.',
            'Pitfall: fixed sleeps that make tests slow and still flaky.',
            'Pitfall: tests that never assert anything, or assert only that no error occurred.',
            'Pitfall: tests that depend on data or state left by other tests.',
            'Pitfall: committing generated folders, reports, or credentials.',
          ],
          deeperTopic: 'good practices and common mistakes when writing UI tests with {{framework}}',
          quizTopicId: 'fundamentals',
        },
      ],
    },
  };

  function getTheory(domainId) {
    return theory[domainId] || null;
  }

  SP.content = Object.assign(SP.content || {}, { getTheory });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
