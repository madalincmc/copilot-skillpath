/*
 * Starter Path main prompts ("Guide me through this step"), steps 1-11.
 * Short by design: the Notebook already holds the full profile (Step 0), so these only name the step's
 * goal and repeat a profile value when it materially changes the answer (PRD §4.5).
 * Every prompt names the step, gives its goal and its "Done when", and points to the step flow in
 * the Notebook instructions instead of restating the teaching rules (js/templates/setup.js).
 * No technology-specific content: Copilot supplies the commands and code for the user's stack.
 */
(function (SP) {
  'use strict';

  const register = SP.templates.register;

  const GUIDE_ME = 'Guide me through this step';
  const STEP_HEADER = 'Step {{step.number}}: {{step.title}}.';
  const STEP_END = 'Done when: {{step.definitionOfDone}}\nWork through it with the step flow from my Notebook instructions.';

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
      body: STEP_HEADER + ' ' + body,
      interaction: STEP_END,
    });
  }

  step('environment', 6,
    'Use this first, before creating any project.',
    'Using my setup from this Notebook, help me prepare my machine on {{os}}: the runtime my stack needs, {{ide}}, and Git. Start by asking what I already have installed, and finish by verifying each tool from the terminal.',
    { required: ['os', 'ide'] });

  step('language-essentials', 4,
    'Use this when your tools are installed, before creating the project.',
    'Teach me the {{language}} I need for {{framework}} tests: variables and the ways to declare them, conditions, loops, functions, collections, modules, and the features its tests rely on most. Add terminal basics for {{os}}. Finish by having me explain a short test line by line.',
    { required: ['language', 'framework', 'os'] });

  step('create-project', 6,
    'Use this when you know the language essentials.',
    'Using my setup from this Notebook, guide me to create a new {{framework}} project with {{language}} using the officially recommended setup, and install its dependencies. Finish by running the example test, or an empty one, to prove it works.',
    { required: ['framework', 'language'] });

  step('project-structure', 6,
    'Use this right after creating the project.',
    'Walk me through the structure of the project we just created: what each file and folder is for, which ones I will edit, and where new tests should go. Cover it in small parts and ask me to find each part in my IDE.');

  step('first-test', 6,
    'Use this when your project runs and you understand its structure.',
    'Using my setup from this Notebook, guide me to write my first automated test against my practice target. Pick one simple user flow, and let me write the code myself with your hints.');

  step('selectors', 6,
    'Use this after your first test passes.',
    'Teach me how to find elements with {{framework}}: the selector strategies it offers, which ones are stable and which are fragile, and why. Use my practice target for examples, then give me three elements to locate myself and review my choices.',
    { required: ['framework'] });

  step('assertions-waits', 6,
    'Use this when you can locate elements reliably.',
    'Using my first test, teach me assertions and waiting: how to verify real outcomes, how my framework waits for elements, and why fixed sleeps make tests flaky. Then have me improve my test and review it.');

  step('page-object', 6,
    'Use this when your test has good assertions and no fixed sleeps.',
    'Guide me to refactor my test to the Page Object Model. Explain the idea, then help me create my first page object, move the selectors into it, and update the test. Let me write the code, and review it after each part.');

  step('run-locally', 6,
    'Use this to get comfortable running and debugging tests.',
    'Teach me to run my tests locally: all tests, a single test, headed and headless, how to debug a failing test, and how to open the test report. Give me the exact commands for my setup and have me try each one.');

  step('push-github', 6,
    'Use this when your tests run locally and you want them under version control.',
    'Guide me to put my project on {{vcsHost}}: a suitable .gitignore, creating the repository, my first commit, and pushing it. Make sure no secrets or credentials get committed.',
    { required: ['vcsHost'] });

  step('ci', 6,
    'Optional. Use this when your project is on GitHub and you want tests to run on every push.',
    'Guide me to run my tests automatically on every push with {{#if vcsHost == "github"}}GitHub Actions{{else}}my {{vcsHost}} CI{{/if}}: create the workflow, make it install dependencies and run the tests, and show me where to read the results and the test report.',
    { required: ['vcsHost'] });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
