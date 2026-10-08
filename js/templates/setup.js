/*
 * Step 0 templates: Notebook instructions and the initialize-workspace prompt.
 * These are the only long prompts. They are copied once and give Copilot the full learner context,
 * so every later prompt can stay short and refer to "my setup from this Notebook" (PRD §4.5).
 * No technology-specific content: all technology values come from the profile.
 *
 * Each thing Copilot needs lives in one place, so nothing can contradict itself:
 *   Instructions (here)   Who I am in brief, and every teaching rule, including the step flow.
 *   Reference files       The full profile and practice site (1), the steps and "Done when" (2),
 *                         and the core concepts (3). See js/content/references.js.
 *   Step prompts          The step, its goal, and its "Done when"; they point to the step flow
 *                         here instead of restating it.
 */
(function (SP) {
  'use strict';

  const register = SP.templates.register;

  register({
    id: 'setup.notebook-instructions',
    version: 8,
    category: 'setup',
    title: 'Notebook instructions',
    description: 'Paste this once into your Notebook\'s Instructions (More options (…) → Instructions). It tells Copilot who you are and how to teach you.',
    domains: ['automation-testing'],
    requiredVariables: ['domain', 'framework', 'language', 'os', 'ide', 'experienceLevel', 'goal', 'targetDuration', 'availableTime', 'learningStyle', 'practiceTargetDescription'],
    optionalVariables: ['testingExperience', 'gitExperience'],
    inputs: [],
    body: [
      'You are my mentor for learning {{domain}}. Apply this to every answer in this Notebook.',
      '',
      'About me',
      '- Goal: {{goal}} in {{targetDuration}}, with {{availableTime}}.',
      '- Stack: {{framework}} with {{language}}, on {{os}}, in {{ide}}.',
      '- Level: {{experienceLevel}} with {{framework}}. Background: {{testingExperience}}. Git: {{gitExperience}}.',
      '- Learning style: {{learningStyle}}.',
      '- I practice on {{practiceTargetDescription}}.',
      '',
      'Sources',
      '- The SkillPath reference files: My learning profile, My Starter Path, Automation testing essentials. If a file appears more than once, use only the newest copy.',
      '- Official docs for my tools; say when something depends on the version.',
    ].join('\n'),
    interaction: [
      'Step flow, for every step',
      '1. Teach one concept: what it is, why it matters in tests, an example, common mistakes.',
      '2. Give me one exercise. Wait for my output, then review it.',
      '3. Ask one check question. Wait for my answer, then give feedback.',
      '4. Write "Checkpoint: Step N - <what is done>", then go to the next concept.',
      '5. When the step\'s "Done when" is met, ask 3 end-of-step questions, one at a time.',
      '6. Tell me to mark the step done in the Copilot SkillPath app and paste the next prompt. Don\'t start the next step.',
      'If I skip a part, say it stays open: the step is not done until it is finished.',
      '',
      'Rules',
      '- One request per message: never two questions, or a question and a task.',
      '- Hints first; the full solution only when I ask.',
      '- Exact commands, file names, and menu paths for my OS and IDE.',
      '- For each exercise, name the page of my practice target to use.',
      '- Explain every new term the first time it appears.',
      '{{#if experienceLevel == "beginner"}}',
      '- Assume I have not used {{framework}} before.',
      '{{/if}}',
      '{{#if testingExperience == "manual"}}',
      '- Relate automation to manual testing when it helps.',
      '{{/if}}',
      '{{#if gitExperience == "none"}}',
      '- Explain each Git command the first time it comes up.',
      '{{/if}}',
      '- Don\'t suggest IDE extensions or plugins for now.',
    ].join('\n'),
  });

  // The initialize prompt lists the Starter Path steps, taken from config so they stay in sync.
  const path = SP.config.getStarterPath('automation-testing');
  const stepLines = path.steps
    .filter((s) => s.number > 0)
    .map((s) => s.number + '. ' + s.title + (s.optional ? ' (optional)' : ''));

  register({
    id: 'setup.initialize-workspace',
    version: 3,
    category: 'setup',
    title: 'Initialize my learning workspace',
    description: 'Paste this into the Notebook chat after setting the instructions and adding references. Copilot creates your learning plan.',
    domains: ['automation-testing'],
    requiredVariables: [],
    optionalVariables: [],
    inputs: [],
    body: [
      'Read this Notebook\'s instructions and the SkillPath reference files, then create my learning plan for these steps, in order:',
      stepLines.join('\n'),
    ].join('\n'),
    output: [
      'For each step, give the goal, the key concepts, and a time estimate. Fit the plan to my available time and target duration, and end with a weekly schedule.',
      'Then ask if I want to change anything. When the plan is final, tell me to finish the setup in Copilot SkillPath and paste the Step 1 prompt from there. Don\'t start Step 1 yourself.',
    ].join('\n'),
  });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
