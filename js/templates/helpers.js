/*
 * Helper prompts shown on every Starter Path step. One generic template each; the current step's
 * title and definition of done are injected automatically, so no per-step copies are needed.
 */
(function (SP) {
  'use strict';

  const register = SP.templates.register;

  register({
    id: 'helper.resume',
    version: 1,
    category: 'helper',
    title: 'Continue where I left off',
    description: 'Use this when you come back to the Notebook after a break.',
    domains: ['*'],
    inputs: [],
    body: 'I\'m back to continue "{{step.title}}". Find the last "Checkpoint:" for this step in our conversation and continue from the next part.',
    interaction: 'Start with a 2-line recap of where we are. If there is no checkpoint, ask me what I finished last. Don\'t restart the step.',
  });

  register({
    id: 'helper.stuck',
    version: 1,
    category: 'helper',
    title: 'I\'m stuck',
    description: 'Use this when something fails or doesn\'t behave as expected.',
    domains: ['*'],
    inputs: [{ id: 'problem', label: 'What you did and what happened', placeholder: '[DESCRIBE WHAT YOU DID AND PASTE THE ERROR OR OUTPUT HERE]', multiline: true }],
    body: 'I\'m stuck on "{{step.title}}". What I did and what happened:\n{{input:problem}}',
    interaction: 'Help me debug it: ask diagnostic questions first, then narrow down the likely causes. Give me hints before the fix.',
  });

  register({
    id: 'helper.explain',
    version: 1,
    category: 'helper',
    title: 'Explain this',
    description: 'Use this when a concept in this step isn\'t clear.',
    domains: ['*'],
    inputs: [{ id: 'concept', label: 'Concept to explain', placeholder: '[CONCEPT]' }],
    body: 'Explain {{input:concept}} in the context of "{{step.title}}", at my level, with a short practical example from my setup.',
    interaction: 'Then ask me one question to check I understood.',
  });

  register({
    id: 'helper.review',
    version: 1,
    category: 'helper',
    title: 'Review my work',
    description: 'Use this when you think the step is done and want feedback.',
    domains: ['*'],
    inputs: [{ id: 'work', label: 'Your code or setup', placeholder: '[PASTE YOUR CODE OR DESCRIBE YOUR SETUP HERE]', multiline: true }],
    body: 'Review my work for "{{step.title}}":\n{{input:work}}',
    interaction: 'Check it against this step\'s goal and best practices for my setup. List what to improve and why, most important first. Don\'t rewrite it for me; let me fix it.',
  });

  register({
    id: 'helper.quiz',
    version: 1,
    category: 'helper',
    title: 'Check my understanding',
    description: 'Use this before marking the step as done.',
    domains: ['*'],
    inputs: [],
    body: 'Quiz me on "{{step.title}}": 4 short questions, from easy to harder.',
    interaction: 'Ask one question at a time, wait for my answer, and give feedback before the next. End by telling me what to review.',
  });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
