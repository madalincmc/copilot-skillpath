/*
 * Builds the Prompt Pack: one Markdown file with the user's personalized Starter Path prompts and
 * saved prompts. Each prompt has its own heading, so Copilot can find it by name when the file is
 * uploaded as a Notebook reference. Pure: no DOM, no storage.
 */
(function (SP) {
  'use strict';

  /** A code fence longer than any backtick run inside the text, so prompts containing code stay intact. */
  function fence(text) {
    const longest = Math.max(0, ...Array.from(text.matchAll(/`+/g), (m) => m[0].length));
    const ticks = '`'.repeat(Math.max(3, longest + 1));
    return ticks + 'text\n' + text + '\n' + ticks;
  }

  function stepLabel(step) {
    return 'Step ' + step.number + ' — ' + step.title;
  }

  /** Templates for a step in display order: setup prompts, main prompt, then helpers. Missing templates are skipped. */
  function stepTemplates(step) {
    const ids = [].concat(step.setupTemplateIds || [], step.mainTemplateId || [], SP.config.getHelperTemplateIds(step));
    return ids.map((id) => SP.templates.get(id)).filter(Boolean);
  }

  /**
   * options: { profile, savedPrompts, date }  (date: 'YYYY-MM-DD', passed in for deterministic output)
   * Returns the Markdown text.
   */
  function buildPromptPack(options) {
    const profile = options.profile;
    const saved = options.savedPrompts || [];
    const lines = [];
    const push = (...xs) => lines.push(...xs);

    push('# Copilot SkillPath — Prompt Pack', '', 'Exported on ' + options.date + '.', '');
    push(
      '## How to use this Prompt Pack',
      '',
      '- Copy a prompt and paste it into your Copilot Notebook.',
      '- Or add the .txt version of this file to your Notebook as a reference and ask Copilot, for example: "Use the *I\'m stuck* prompt for Step 4 from my Prompt Pack."',
      '- Prompts with [PLACEHOLDERS] need you to fill in the part in brackets before sending.',
      ''
    );

    if (profile) {
      push('## My learning profile', '');
      for (const row of SP.config.describeProfile(profile)) push('- **' + row.label + ':** ' + row.value);
      push('');

      const path = SP.config.getStarterPath(profile.domain);
      const context = SP.config.buildPromptContext(profile);
      let wroteHeading = false;
      for (const step of path ? path.steps : []) {
        const templates = stepTemplates(step);
        if (!templates.length) continue;
        if (!wroteHeading) {
          push('## ' + path.title, '');
          wroteHeading = true;
        }
        push('### ' + stepLabel(step) + (step.optional ? ' (optional)' : ''), '', step.summary, '', '**Done when:** ' + step.definitionOfDone, '');
        for (const template of templates) {
          const result = SP.engine.generate(template, { context, step });
          push('#### ' + template.title + ' (Step ' + step.number + ')', '');
          if (template.description) push('_When to use:_ ' + template.description, '');
          push(fence(result.text), '');
        }
      }
    }

    if (saved.length) {
      push('## My saved prompts', '');
      for (const prompt of saved) {
        push('### ' + prompt.title, '', '_Saved on ' + prompt.savedAt.slice(0, 10) + '._', '', fence(prompt.text), '');
      }
    }

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  }

  /** format: 'txt' (can be added as a Notebook reference) or 'md' (for Markdown viewers). Same content. */
  function promptPackFilename(date, format) {
    return 'copilot-skillpath-prompt-pack-' + date + '.' + (format === 'md' ? 'md' : 'txt');
  }

  SP.exports = Object.assign(SP.exports || {}, { buildPromptPack, promptPackFilename, stepTemplates, fence });
})((globalThis.SkillPath = globalThis.SkillPath || {}));
