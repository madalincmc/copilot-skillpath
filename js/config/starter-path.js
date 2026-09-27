/*
 * Starter Paths: ordered practical steps per domain.
 *
 * Step schema:
 *   id                 Stable id (used for progress and saved prompts; never rename).
 *   number             Display order, sequential from 0.
 *   title, summary     What the step is and what the user will achieve.
 *   definitionOfDone   How the user knows the step is finished.
 *   mainTemplateId     Template for "Guide me through this step" (steps 1+).
 *   setupTemplateIds   Step 0 only: Notebook instructions and initialize-workspace templates.
 *   checklistId        Step 0 only: recommended reference checklist.
 *   guideId            Optional how-to guide shown at the top of the step (config.guides).
 *   helperTemplateIds  Optional override of config.defaultHelperTemplateIds.
 *   optional           Shown as optional; not required to finish the path.
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  config.defaultHelperTemplateIds = ['helper.stuck', 'helper.explain', 'helper.review', 'helper.quiz'];

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
          definitionOfDone: 'Notebook created, instructions set, references added, and the workspace initialized with a learning plan.',
          setupTemplateIds: ['setup.notebook-instructions', 'setup.initialize-workspace'],
          checklistId: 'references',
          guideId: 'notebook-setup',
          helperTemplateIds: ['helper.stuck'],
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
          id: 'create-project',
          number: 2,
          title: 'Create the project',
          summary: 'Initialize a new test automation project and install the framework dependencies.',
          definitionOfDone: 'The project is created and the framework\'s sample or empty test run completes.',
          mainTemplateId: 'step.create-project',
        },
        {
          id: 'project-structure',
          number: 3,
          title: 'Understand the project structure',
          summary: 'Learn what each file and folder in the new project is for.',
          definitionOfDone: 'You can explain what each file and folder does and where new tests should go.',
          mainTemplateId: 'step.project-structure',
        },
        {
          id: 'first-test',
          number: 4,
          title: 'Write my first test',
          summary: 'Write a simple automated test against your practice target.',
          definitionOfDone: 'One test you wrote yourself runs and passes.',
          mainTemplateId: 'step.first-test',
        },
        {
          id: 'selectors',
          number: 5,
          title: 'Write my first selectors',
          summary: 'Find elements reliably and learn which selectors are stable and which are fragile.',
          definitionOfDone: 'You can choose a stable selector for an element and explain why.',
          mainTemplateId: 'step.selectors',
        },
        {
          id: 'assertions-waits',
          number: 6,
          title: 'Assertions and waits',
          summary: 'Verify real outcomes and handle timing without hard-coded sleeps.',
          definitionOfDone: 'Your test checks real results and has no fixed sleeps.',
          mainTemplateId: 'step.assertions-waits',
        },
        {
          id: 'page-object',
          number: 7,
          title: 'Create my first Page Object',
          summary: 'Refactor your test to use the Page Object Model.',
          definitionOfDone: 'Your test uses a Page Object, and the selectors live in the Page Object, not in the test.',
          mainTemplateId: 'step.page-object',
        },
        {
          id: 'run-locally',
          number: 8,
          title: 'Run tests locally',
          summary: 'Run tests headed and headless, debug a failing test, and read the report.',
          definitionOfDone: 'You can run one test or all tests, debug a failure, and open the test report.',
          mainTemplateId: 'step.run-locally',
        },
        {
          id: 'push-github',
          number: 9,
          title: 'Push to GitHub',
          summary: 'Put your project under version control and push it to a GitHub repository.',
          definitionOfDone: 'A .gitignore is set up, the repository exists on GitHub, and your first commit is pushed.',
          mainTemplateId: 'step.push-github',
        },
        {
          id: 'ci',
          number: 10,
          title: 'Run tests in CI',
          summary: 'Run your tests automatically on every push with GitHub Actions.',
          definitionOfDone: 'A GitHub Actions workflow runs your tests on push, and you can read its results.',
          mainTemplateId: 'step.ci',
          optional: true,
        },
      ],
    },
  ];

  // Notebook references can be files (.docx, .pptx, .xlsx, .pdf, .loop, .page, .txt, .rtf), OneNote pages,
  // or links to organization content (OneDrive/SharePoint). Public web pages cannot be added, so official
  // documentation is not a reference item; the Notebook instructions ask Copilot to follow it instead.
  // Items are phrased with {{variables}} and rendered by the prompt engine at display time.
  config.checklists = [
    {
      id: 'references',
      title: 'Recommended references for your Notebook',
      items: [
        { id: 'prompt-pack-txt', text: 'Your Prompt Pack from this app, exported as .txt (use the Export Prompt Pack button)' },
        { id: 'notes-page', text: 'A notes document or OneNote page for this journey, where you keep your own notes and solutions' },
        { id: 'team-guidelines', text: 'Your team\'s testing guidelines or automation project docs from OneDrive or SharePoint, if you have them' },
        { id: 'learning-plan', text: 'Your learning plan, once Copilot creates it: save it as a page or document and add it back as a reference' },
      ],
    },
  ];

  // Short how-to guides shown inside a step. Text may use {{variables}}.
  config.guides = [
    {
      id: 'notebook-setup',
      title: 'How to set up your Copilot Notebook',
      steps: [
        'Open the Microsoft 365 Copilot app (m365.cloud.microsoft) and select Notebooks in the left navigation. If you don\'t see it, open the app launcher and select Notebooks.',
        'Select All notebooks, then New notebook. Name it after this journey, for example "Learning {{framework}}", and select Create.',
        'In the notebook, select More options (…) in the upper-right corner, then Instructions. Paste the Notebook instructions prompt below and save.',
        'Select Add references and add the items from the checklist below. You can upload files, pick them from OneDrive, or search for SharePoint content. Public web pages can\'t be added, but Copilot can still follow the official documentation.',
        'In the notebook chat, paste the Initialize prompt below. Copilot reviews your context and creates your learning plan.',
        'Use this same notebook for every step from now on, so Copilot remembers your setup and progress.',
      ],
    },
  ];
})((globalThis.SkillPath = globalThis.SkillPath || {}));
