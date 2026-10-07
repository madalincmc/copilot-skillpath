/*
 * Starter Paths: ordered practical steps per domain.
 *
 * Step schema:
 *   id                 Stable id (used for progress; never rename).
 *   number             Display order, sequential from 0.
 *   title, summary     What the step is and what the user will achieve.
 *   definitionOfDone   How the user knows the step is finished.
 *   mainTemplateId     Template for "Guide me through this step" (steps 1+).
 *   setupTemplateIds   Step 0 only: Notebook instructions and initialize-workspace templates.
 *   wizardId           Step 0 only: the guided setup (config.wizards) that replaces the step's prompts.
 *   helperTemplateIds  Optional override of config.defaultHelperTemplateIds.
 *   optional           Shown as optional; not required to finish the path.
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  config.defaultHelperTemplateIds = ['helper.resume', 'helper.stuck', 'helper.explain', 'helper.review', 'helper.quiz'];

  config.starterPaths = [
    {
      id: 'automation-testing',
      domain: 'automation-testing',
      title: 'Automation Testing Starter Path',
      steps: [
        {
          id: 'notebook-setup',
          number: 0,
          title: 'Set up my Copilot Notebook',
          summary: 'Create the Copilot Notebook that will hold your whole learning journey, and give Copilot your context once.',
          definitionOfDone: 'Notebook created, instructions set, and Copilot has created your learning plan.',
          setupTemplateIds: ['setup.notebook-instructions', 'setup.initialize-workspace'],
          wizardId: 'notebook-setup',
          helperTemplateIds: [],
        },
        {
          id: 'environment',
          number: 1,
          title: 'Prepare my environment',
          summary: 'Install and verify everything you need on your machine: runtime, IDE, and Git.',
          definitionOfDone: 'The runtime, IDE, and Git are installed, and their versions print in the terminal.',
          mainTemplateId: 'step.environment',
        },
        {
          id: 'language-essentials',
          number: 2,
          title: 'Learn the language essentials',
          summary: 'Learn the minimum of your programming language and the terminal you need to read and write automated tests.',
          definitionOfDone: 'You can write and run a small program with variables, functions, and collections, use the terminal to move between folders and run commands, and explain a simple test line by line.',
          mainTemplateId: 'step.language-essentials',
        },
        {
          id: 'create-project',
          number: 3,
          title: 'Create the project',
          summary: 'Initialize a new test automation project and install the framework dependencies.',
          definitionOfDone: 'The project is created and the framework\'s sample or empty test run completes.',
          mainTemplateId: 'step.create-project',
        },
        {
          id: 'project-structure',
          number: 4,
          title: 'Understand the project structure',
          summary: 'Learn what each file and folder in the new project is for.',
          definitionOfDone: 'You can explain what each file and folder does and where new tests should go.',
          mainTemplateId: 'step.project-structure',
        },
        {
          id: 'first-test',
          number: 5,
          title: 'Write my first test',
          summary: 'Write a simple automated test against your practice target.',
          definitionOfDone: 'One test you wrote yourself runs and passes.',
          mainTemplateId: 'step.first-test',
        },
        {
          id: 'selectors',
          number: 6,
          title: 'Write my first selectors',
          summary: 'Find elements reliably and learn which selectors are stable and which are fragile.',
          definitionOfDone: 'You can choose a stable selector for an element and explain why.',
          mainTemplateId: 'step.selectors',
        },
        {
          id: 'assertions-waits',
          number: 7,
          title: 'Assertions and waits',
          summary: 'Verify real outcomes and handle timing without hard-coded sleeps.',
          definitionOfDone: 'Your test checks real results and has no fixed sleeps.',
          mainTemplateId: 'step.assertions-waits',
        },
        {
          id: 'page-object',
          number: 8,
          title: 'Create my first Page Object',
          summary: 'Refactor your test to use the Page Object Model.',
          definitionOfDone: 'Your test uses a Page Object, and the selectors live in the Page Object, not in the test.',
          mainTemplateId: 'step.page-object',
        },
        {
          id: 'run-locally',
          number: 9,
          title: 'Run tests locally',
          summary: 'Run tests headed and headless, debug a failing test, and read the report.',
          definitionOfDone: 'You can run one test or all tests, debug a failure, and open the test report.',
          mainTemplateId: 'step.run-locally',
        },
        {
          id: 'push-github',
          number: 10,
          title: 'Push to GitHub',
          summary: 'Put your project under version control and push it to a GitHub repository.',
          definitionOfDone: 'A .gitignore is set up, the repository exists on GitHub, and your first commit is pushed.',
          mainTemplateId: 'step.push-github',
        },
        {
          id: 'ci',
          number: 11,
          title: 'Run tests in CI',
          summary: 'Run your tests automatically on every push with GitHub Actions.',
          definitionOfDone: 'A GitHub Actions workflow runs your tests on push, and you can read its results.',
          mainTemplateId: 'step.ci',
          optional: true,
        },
      ],
    },
  ];

  /*
   * Guided setups: short linear wizards with one action per screen.
   * Screen: { id, title, text: [paragraphs with {{variables}}], templateId?, referenceFiles?, link?: { href, label }, note?, doneLabel }
   *   referenceFiles  Show the generated reference files (js/content/references.js) with download buttons.
   * Menu names follow Microsoft's Copilot Notebooks documentation (September 2026).
   */
  config.wizards = [
    {
      id: 'notebook-setup',
      title: 'Set up your Copilot Notebook',
      intro: 'Four short steps. Your Notebook becomes the place where Copilot remembers your setup and guides you through every step.',
      screens: [
        {
          id: 'references',
          title: 'Get your reference files',
          text: [
            'A Notebook answers from the references you give it. These files are made from your profile, so Copilot knows your setup, your plan, and the core concepts from the start.',
            'Download them now. You will add them when you create the Notebook in the next step.',
          ],
          referenceFiles: true,
          doneLabel: 'I downloaded the files',
        },
        {
          id: 'create',
          title: 'Create your Notebook',
          text: [
            'Open the Microsoft 365 Copilot app and select Notebooks in the left navigation. If you don\'t see it, open the app launcher and select Notebooks.',
            'Select All notebooks, then New notebook. Name it "Learning {{framework}}".',
            'Under Add content to References, select Upload and add the files you downloaded. Then select Create.',
          ],
          link: { href: 'https://m365.cloud.microsoft', label: 'Open Microsoft 365 Copilot' },
          doneLabel: 'I created my Notebook',
        },
        {
          id: 'instructions',
          title: 'Tell Copilot who you are',
          text: [
            'In your Notebook, select More options (…) in the upper-right corner, then Instructions.',
            'Copy the instructions below, paste them there, and save. Copilot will use them in every answer in this Notebook.',
          ],
          templateId: 'setup.notebook-instructions',
          doneLabel: 'I saved the instructions',
        },
        {
          id: 'plan',
          title: 'Start your learning plan',
          text: [
            'Copy this prompt and paste it into the Notebook chat. Copilot reviews your instructions and creates your learning plan.',
          ],
          templateId: 'setup.initialize-workspace',
          note: 'Any time later, with Add references, you can also give the Notebook your own notes or your team\'s testing guidelines from OneDrive or SharePoint.',
          doneLabel: 'Finish setup',
        },
      ],
    },
  ];
})((globalThis.SkillPath = globalThis.SkillPath || {}));
