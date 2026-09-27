/*
 * Prompt Library (reduced set for the first release): general prompts for after the Starter Path.
 * Each template has a `group` used to organize the Library view. All rely on the Notebook context.
 */
(function (SP) {
  'use strict';

  const register = SP.templates.register;

  SP.config.libraryGroups = [
    { id: 'plan', label: 'Plan' },
    { id: 'learn', label: 'Learn' },
    { id: 'practice', label: 'Practice' },
    { id: 'build', label: 'Build' },
    { id: 'validate', label: 'Validate' },
    { id: 'review', label: 'Review' },
  ];

  function library(group, id, template) {
    register(Object.assign({ id: 'library.' + id, version: 1, category: 'library', group, domains: ['*'], inputs: [] }, template));
  }

  library('plan', 'adjust-plan', {
    title: 'Adjust my learning plan',
    description: 'Use this when your available time, target date, or goal changes.',
    inputs: [{ id: 'change', label: 'What changed', placeholder: '[WHAT CHANGED: time available, target date, or goal]' }],
    body: 'My situation changed: {{input:change}}\nAdjust my learning plan in this Notebook to fit.',
    output: 'Show what changes and what stays, then ask me to confirm.',
  });

  library('plan', 'replan', {
    title: 'Re-plan based on my progress',
    description: 'Use this when you are ahead, behind, or some topics were harder than expected.',
    inputs: [{ id: 'progress', label: 'Your progress', placeholder: '[STEPS DONE, MISSED, OR DIFFICULT]', multiline: true }],
    body: 'Here is my progress so far:\n{{input:progress}}',
    output: 'Update my learning plan: keep what is done, give more time to what was hard, and re-order what is left. Then tell me the next thing to do.',
  });

  library('learn', 'teach', {
    title: 'Teach me a concept',
    description: 'Use this to learn a new topic at your level.',
    inputs: [{ id: 'topic', label: 'Topic', placeholder: '[TOPIC]' }],
    body: 'Teach me {{input:topic}} at my level. Start simple with a practical example from my setup, and go deeper only after I answer one question to check my understanding.',
  });

  library('learn', 'compare', {
    title: 'Compare two concepts',
    description: 'Use this when two tools, patterns, or ideas seem similar.',
    inputs: [
      { id: 'first', label: 'First concept', placeholder: '[FIRST CONCEPT]' },
      { id: 'second', label: 'Second concept', placeholder: '[SECOND CONCEPT]' },
    ],
    body: 'Compare {{input:first}} and {{input:second}} for my setup: what each is, when to use which, and a short example of both.',
    output: 'End with a one-line rule of thumb.',
  });

  library('practice', 'exercise', {
    title: 'Give me an exercise',
    description: 'Use this to practice what you just learned.',
    inputs: [{ id: 'topic', label: 'Topic', placeholder: '[TOPIC]' }],
    body: 'Give me a practical exercise on {{input:topic}} that fits where I am in my learning plan, with clear requirements and how I will know I am done.',
    interaction: 'Don\'t show the solution. Review mine when I share it.',
  });

  library('build', 'feature', {
    title: 'Implement a feature',
    description: 'Use this to build something real in your project, with guidance.',
    inputs: [{ id: 'feature', label: 'What you want to build', placeholder: '[DESCRIBE THE FEATURE OR TEST YOU WANT TO ADD]', multiline: true }],
    body: 'Guide me to implement this in my project:\n{{input:feature}}',
    interaction: 'Help me plan it first, then build it one step at a time. Let me write the code, give hints before solutions, and review each part.',
  });

  library('validate', 'interview', {
    title: 'Interview me',
    description: 'Use this to test yourself like in a technical interview.',
    body: 'Interview me like a technical interviewer for a role that uses my stack: 6 questions at my level, mixing concepts and practical scenarios.',
    interaction: 'Ask one question at a time and give feedback after each answer. End with a summary of my strengths and what to improve.',
  });

  library('review', 'gaps', {
    title: 'Identify my knowledge gaps',
    description: 'Use this every week or two to find what needs more practice.',
    body: 'Based on our work in this Notebook, identify my knowledge gaps: topics I struggled with, skipped, or only covered briefly.',
    output: 'Rank them by importance for my goal and suggest how to close each one.',
  });

  library('review', 'progress', {
    title: 'Review my progress',
    description: 'Use this to check whether you are on track.',
    body: 'Review my progress against my learning plan in this Notebook: what I have completed, what is behind, and whether I am on track for my target date.',
    output: 'Suggest my next action.',
  });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
