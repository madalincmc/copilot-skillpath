/*
 * Templates for the Theory and Quizzes sections.
 * Their topic variables (theoryTopic, quizTopic, ...) are added to the context by the views.
 */
(function (SP) {
  'use strict';

  const register = SP.templates.register;

  register({
    id: 'theory.deeper',
    version: 1,
    category: 'theory',
    title: 'Go deeper in Copilot',
    description: 'Paste this into your Notebook to see how this chapter works in your stack.',
    domains: ['*'],
    requiredVariables: ['theoryTopic'],
    optionalVariables: [],
    inputs: [],
    body: 'Teach me {{theoryTopic}}, at my level, with one short example from my setup. Follow the official documentation of my tools and standard testing terminology.',
    interaction: 'Then ask me one question to check my understanding, and wait for my answer.',
  });

  register({
    id: 'quiz.run',
    version: 1,
    category: 'quiz',
    title: 'Your quiz prompt',
    description: 'Paste this into your Notebook chat to start the quiz.',
    domains: ['*'],
    requiredVariables: ['quizTopic', 'quizCount', 'quizFormat', 'quizLevel'],
    optionalVariables: [],
    inputs: [],
    body: 'Quiz me on {{quizTopic}}.\nFormat: {{quizCount}} questions, {{quizFormat}}, {{quizLevel}}.',
    interaction: [
      'Rules:',
      '- Base every question on the official documentation of the tools involved and on standard testing terminology and practice, such as the ISTQB glossary. Skip anything you are not sure is documented.',
      '- Ask one question at a time, numbered, and wait for my answer.',
      '- After each answer, say "Correct" or "Incorrect". In both cases, explain why and name the documentation topic the question comes from.',
      '- Keep score. At the end, give my score and the topics I should review.',
    ].join('\n'),
  });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
