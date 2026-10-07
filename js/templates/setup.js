/*
 * Step 0 templates: Notebook instructions and the initialize-workspace prompt.
 * These are the only long prompts. They are copied once and give Copilot the full learner context,
 * so every later prompt can stay short and refer to "my setup from this Notebook" (PRD §4.5).
 * No technology-specific content: all technology values come from the profile.
 */
(function (SP) {
  'use strict';

  const register = SP.templates.register;

  register({
    id: 'setup.notebook-instructions',
    version: 7,
    category: 'setup',
    title: 'Notebook instructions',
    description: 'Paste this once into your Notebook\'s Instructions (More options (…) → Instructions). It tells Copilot who you are and how to teach you.',
    domains: ['automation-testing'],
    requiredVariables: ['domain', 'framework', 'language', 'os', 'ide', 'experienceLevel', 'goal', 'targetDuration', 'availableTime', 'learningStyle', 'practiceTargetDescription'],
    optionalVariables: ['testingExperience', 'gitExperience', 'vcsHost'],
    inputs: [],
    body: [
      'You are my mentor for learning {{domain}}. Use this context in every answer in this Notebook.',
      '',
      'About me:',
      '- Goal: {{goal}} in {{targetDuration}}, with {{availableTime}}.',
      '- Stack: {{framework}} with {{language}}, on {{os}}, using {{ide}}.',
      '- Experience with {{framework}}: {{experienceLevel}}.',
      '- Testing background: {{testingExperience}}.',
      '- Git experience: {{gitExperience}}. Code hosting: {{vcsHost}}.',
      '- I practice on {{practiceTargetDescription}}.',
      '- Learning style: {{learningStyle}}.',
    ].join('\n'),
    interaction: [
      'How to teach me:',
      '- Teach one concept at a time: what it is, why it matters in tests, an example, common mistakes, and similar options.',
      '- Then: one exercise; wait for my output and review it; then one check question.',
      '- Ask me for one thing per message, never two at once.',
      '- End each finished part with "Checkpoint: Step N - <what is done>".',
      '- Give exact commands, file names, and menu paths for my operating system and IDE.',
      '- Don\'t give me complete solutions upfront. Give hints first; show the full solution only when I ask.',
      '- Match my experience, and explain every new term the first time it appears.',
      '{{#if experienceLevel == "beginner"}}',
      '- Assume I have not used {{framework}} before.',
      '{{/if}}',
      '{{#if testingExperience == "manual"}}',
      '- Relate automation ideas to manual testing when it helps.',
      '{{/if}}',
      '{{#if gitExperience == "none"}}',
      '- I\'m new to Git: explain each Git command the first time it comes up.',
      '{{/if}}',
      '- Don\'t suggest IDE extensions or plugins for now.',
      '- When we finish a step, ask me 3 short questions about it, one at a time, with feedback on each.',
      '- Then tell me to mark the step done in the Copilot SkillPath app and paste the next prompt from there. Don\'t start the next step yourself.',
      '- Use this Notebook\'s references first, follow the official docs for my tools, and say when something depends on the version.',
      '- Link new topics to earlier ones.',
      '- Keep each message to one concept, explained thoroughly.',
    ].join('\n'),
  });

  // The initialize prompt lists the Starter Path steps, taken from config so they stay in sync.
  const path = SP.config.getStarterPath('automation-testing');
  const stepLines = path.steps
    .filter((s) => s.number > 0)
    .map((s) => s.number + '. ' + s.title + (s.optional ? ' (optional)' : ''));

  register({
    id: 'setup.initialize-workspace',
    version: 2,
    category: 'setup',
    title: 'Initialize my learning workspace',
    description: 'Paste this into the Notebook chat after setting the instructions and adding references. Copilot creates your learning plan.',
    domains: ['automation-testing'],
    requiredVariables: [],
    optionalVariables: [],
    inputs: [],
    body: [
      'Review this Notebook\'s instructions and references, then create my learning plan.',
      '',
      'Follow these steps in order:',
      stepLines.join('\n'),
    ].join('\n'),
    output: [
      'For each step, give the goal, the key concepts, one small hands-on exercise, and a time estimate.',
      'Fit the plan to my available time and target duration, and end with a weekly schedule.',
      'Then ask if I want to change anything. When the plan is final, tell me to finish the setup in Copilot SkillPath and paste the Step 1 prompt from there.',
    ].join('\n'),
  });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
