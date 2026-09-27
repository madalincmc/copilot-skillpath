/*
 * Starter Path main prompts ("Guide me through this step"), steps 1-10.
 * Short by design: the Notebook already holds the full profile (Step 0), so these only name the step's
 * goal and repeat a profile value when it materially changes the answer (PRD §4.5).
 * No technology-specific content: Copilot supplies the commands and code for the user's stack.
 */
(function (SP) {
  'use strict';

  const register = SP.templates.register;

  const GUIDE_ME = 'Guide me through this step';
  const ONE_STEP = 'One step at a time: explain why, and wait for me to confirm or paste the output before continuing.';

  function step(id, version, description, body, variables) {
    register({
      id: 'step.' + id,
      version,
      category: 'step',
      title: GUIDE_ME,
      description,
      domains: ['automation-testing'],
      requiredVariables: (variables && variables.required) || [],
      optionalVariables: (variables && variables.optional) || [],
      inputs: [],
      body,
      interaction: ONE_STEP,
    });
  }

  step('environment', 1,
    'Use this first, before creating any project.',
    'Using my setup from this Notebook, help me prepare my machine on {{os}}: the runtime my stack needs, {{ide}} with the extensions worth having, and Git. Start by asking what I already have installed, and finish by verifying each tool from the terminal.',
    { required: ['os', 'ide'] });

  step('create-project', 1,
    'Use this when your tools are installed and verified.',
    'Using my setup from this Notebook, guide me to create a new {{framework}} project with {{language}} using the officially recommended setup, and install its dependencies. Finish by running the example test, or an empty one, to prove it works.',
    { required: ['framework', 'language'] });

  step('project-structure', 1,
    'Use this right after creating the project.',
    'Walk me through the structure of the project we just created: what each file and folder is for, which ones I will edit, and where new tests should go. Cover it in small parts and ask me to find each part in my IDE.');

  step('first-test', 1,
    'Use this when your project runs and you understand its structure.',
    'Using my setup from this Notebook, guide me to write my first automated test against my practice target. Pick one simple user flow, and let me write the code myself with your hints.');

  step('selectors', 1,
    'Use this after your first test passes.',
    'Teach me how to find elements with {{framework}}: the selector strategies it offers, which ones are stable and which are fragile, and why. Use my practice target for examples, then give me three elements to locate myself and review my choices.',
    { required: ['framework'] });

  step('assertions-waits', 1,
    'Use this when you can locate elements reliably.',
    'Using my first test, teach me assertions and waiting: how to verify real outcomes, how my framework waits for elements, and why fixed sleeps make tests flaky. Then have me improve my test and review it.');

  step('page-object', 1,
    'Use this when your test has good assertions and no fixed sleeps.',
    'Guide me to refactor my test to the Page Object Model. Explain the idea briefly, then help me create my first page object, move the selectors into it, and update the test. Let me write the code, and review it after each part.');

  step('run-locally', 1,
    'Use this to get comfortable running and debugging tests.',
    'Teach me to run my tests locally: all tests, a single test, headed and headless, how to debug a failing test, and how to open the test report. Give me the exact commands for my setup and have me try each one.');

  step('push-github', 1,
    'Use this when your tests run locally and you want them under version control.',
    [
      'Guide me to put my project on {{vcsHost}}: a suitable .gitignore, creating the repository, my first commit, and pushing it. Make sure no secrets or credentials get committed.',
      '{{#if gitExperience == "none"}}',
      'I\'m new to Git, so explain what each command does before I run it.',
      '{{/if}}',
    ].join('\n'),
    { required: ['vcsHost'], optional: ['gitExperience'] });

  step('ci', 1,
    'Optional. Use this when your project is on GitHub and you want tests to run on every push.',
    'Guide me to run my tests automatically on every push with {{#if vcsHost == "github"}}GitHub Actions{{else}}my {{vcsHost}} CI{{/if}}: create the workflow, make it install dependencies and run the tests, and show me where to read the results and the test report.',
    { required: ['vcsHost'] });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
