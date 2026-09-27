/*
 * Learning profile configuration: domains, field groups, fields, and derived prompt variables.
 *
 * Field schema:
 *   id           Unique id across common and domain fields. Also the template variable name.
 *   label        Label shown in the form.
 *   group        One of fieldGroups[].id.
 *   type         'select' | 'text' | 'number'.
 *   required     Required when visible.
 *   default      Initial value (must be an option value for selects).
 *   options      For selects: [{ value, label, promptLabel?, labelFromField?, availableWhen? }]
 *                  promptLabel     Wording used in prompts when it differs from the form label.
 *                  labelFromField  Use another field's text as the prompt label (e.g. "Other" -> free text).
 *                  availableWhen   Rule(s) that must match for the option to be offered.
 *   visibleWhen  Rule(s) that must match for the field to be shown. May only reference earlier fields.
 *   min, max     For numbers.
 *   placeholder  For text inputs.
 *
 * Rule: { field, equals } | { field, notEquals } | { field, in: [...] }. An array of rules means all must match.
 *
 * Derived variables are computed from the prompt context after profile values are resolved:
 *   { id, compute(ctx) -> string }, where ctx[fieldId] = { value, label }.
 */
(function (SP) {
  'use strict';

  const config = (SP.config = SP.config || {});

  config.fieldGroups = [
    { id: 'technology', label: 'Technology' },
    { id: 'experience', label: 'Experience' },
    { id: 'environment', label: 'Environment' },
    { id: 'goal', label: 'Goal' },
    { id: 'schedule', label: 'Time and learning style' },
  ];

  // Fields shared by every domain. They are listed after the domain's own fields.
  config.commonFields = [
    {
      id: 'os',
      label: 'Operating system',
      group: 'environment',
      type: 'select',
      required: true,
      options: [
        { value: 'windows', label: 'Windows' },
        { value: 'macos', label: 'macOS' },
        { value: 'linux', label: 'Linux' },
      ],
    },
    {
      id: 'ide',
      label: 'IDE',
      group: 'environment',
      type: 'select',
      required: true,
      options: [
        { value: 'vscode', label: 'VS Code' },
        { value: 'intellij', label: 'IntelliJ IDEA' },
        { value: 'other', label: 'Other', labelFromField: 'ideOther' },
      ],
    },
    {
      id: 'ideOther',
      label: 'Which IDE?',
      group: 'environment',
      type: 'text',
      required: true,
      placeholder: 'e.g. Visual Studio',
      visibleWhen: { field: 'ide', equals: 'other' },
    },
    {
      id: 'goal',
      label: 'What do you want to achieve?',
      group: 'goal',
      type: 'select',
      required: true,
      options: [
        { value: 'basics', label: 'Learn the basics', promptLabel: 'learn the basics' },
        { value: 'manual-to-automation', label: 'Transition from manual to automation', promptLabel: 'transition from manual testing to automation' },
        { value: 'productive', label: 'Become productive', promptLabel: 'become productive' },
        { value: 'project-ready', label: 'Become project-ready', promptLabel: 'become project-ready' },
        { value: 'real-project', label: 'Build a real project', promptLabel: 'build a real project' },
        { value: 'deepen', label: 'Deepen existing knowledge', promptLabel: 'deepen my existing knowledge' },
      ],
    },
    {
      id: 'timeAmount',
      label: 'Available time',
      group: 'schedule',
      type: 'number',
      required: true,
      default: '1',
      min: 1,
      max: 600,
    },
    {
      id: 'timeUnit',
      label: 'Per',
      group: 'schedule',
      type: 'select',
      required: true,
      default: 'hours-day',
      options: [
        { value: 'minutes-day', label: 'minutes / day', promptLabel: 'minutes per day' },
        { value: 'hours-day', label: 'hours / day', promptLabel: 'hours per day' },
        { value: 'hours-week', label: 'hours / week', promptLabel: 'hours per week' },
      ],
    },
    {
      id: 'duration',
      label: 'Target duration',
      group: 'schedule',
      type: 'select',
      required: true,
      default: '1-month',
      options: [
        { value: '2-weeks', label: '2 weeks' },
        { value: '1-month', label: '1 month' },
        { value: '2-months', label: '2 months' },
        { value: '3-months', label: '3 months' },
        { value: 'custom', label: 'Custom', labelFromField: 'durationCustom' },
      ],
    },
    {
      id: 'durationCustom',
      label: 'Custom duration',
      group: 'schedule',
      type: 'text',
      required: true,
      placeholder: 'e.g. 6 weeks, or until 15 December',
      visibleWhen: { field: 'duration', equals: 'custom' },
    },
    {
      id: 'learningStyle',
      label: 'Learning style',
      group: 'schedule',
      type: 'select',
      required: true,
      default: 'balanced',
      options: [
        { value: 'theory-first', label: 'Theory first', promptLabel: 'theory first, then practice' },
        { value: 'hands-on-first', label: 'Hands-on first', promptLabel: 'hands-on first, theory as needed' },
        { value: 'balanced', label: 'Balanced', promptLabel: 'a balance of theory and practice' },
        { value: 'project-based', label: 'Project-based', promptLabel: 'project-based' },
      ],
    },
  ];

  config.commonDerived = [
    {
      // e.g. "1 hours per day" reads badly, so singularize an amount of 1.
      id: 'availableTime',
      compute(ctx) {
        if (!ctx.timeAmount || !ctx.timeUnit) return '';
        const amount = ctx.timeAmount.label;
        let unit = ctx.timeUnit.label;
        if (amount === '1') unit = unit.replace(/^(minutes|hours)/, (w) => w.slice(0, -1));
        return amount + ' ' + unit;
      },
    },
    {
      id: 'targetDuration',
      compute(ctx) {
        return ctx.duration ? ctx.duration.label : '';
      },
    },
  ];

  const ALL_FRAMEWORKS_BUT = (...excluded) => ({
    field: 'framework',
    in: ['playwright', 'selenium', 'webdriverio', 'cypress', 'other'].filter((f) => !excluded.includes(f)),
  });

  config.domains = [
    {
      id: 'automation-testing',
      label: 'Automation Testing',
      description: 'Automate UI tests: set up a project, write tests and page objects, run them locally, and push to GitHub.',
      starterPathId: 'automation-testing',
      fields: [
        {
          id: 'framework',
          label: 'Automation framework',
          group: 'technology',
          type: 'select',
          required: true,
          options: [
            { value: 'playwright', label: 'Playwright' },
            { value: 'selenium', label: 'Selenium WebDriver' },
            { value: 'webdriverio', label: 'WebdriverIO' },
            { value: 'cypress', label: 'Cypress' },
            { value: 'other', label: 'Other', labelFromField: 'frameworkOther' },
          ],
        },
        {
          id: 'frameworkOther',
          label: 'Which framework?',
          group: 'technology',
          type: 'text',
          required: true,
          placeholder: 'e.g. TestCafe',
          visibleWhen: { field: 'framework', equals: 'other' },
        },
        {
          id: 'language',
          label: 'Programming language',
          group: 'technology',
          type: 'select',
          required: true,
          options: [
            { value: 'javascript', label: 'JavaScript' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'java', label: 'Java', availableWhen: ALL_FRAMEWORKS_BUT('webdriverio', 'cypress') },
            { value: 'python', label: 'Python', availableWhen: ALL_FRAMEWORKS_BUT('webdriverio', 'cypress') },
            { value: 'csharp', label: 'C#', availableWhen: ALL_FRAMEWORKS_BUT('webdriverio', 'cypress') },
            { value: 'other', label: 'Other', labelFromField: 'languageOther', availableWhen: { field: 'framework', equals: 'other' } },
          ],
        },
        {
          id: 'languageOther',
          label: 'Which language?',
          group: 'technology',
          type: 'text',
          required: true,
          visibleWhen: { field: 'language', equals: 'other' },
        },
        {
          id: 'experienceLevel',
          label: 'Experience with this framework',
          group: 'experience',
          type: 'select',
          required: true,
          options: [
            { value: 'beginner', label: 'Beginner', promptLabel: 'beginner' },
            { value: 'basic', label: 'Basic', promptLabel: 'basic' },
            { value: 'intermediate', label: 'Intermediate', promptLabel: 'intermediate' },
            { value: 'advanced', label: 'Advanced', promptLabel: 'advanced' },
          ],
        },
        {
          id: 'testingExperience',
          label: 'Testing background',
          group: 'experience',
          type: 'select',
          required: true,
          options: [
            { value: 'manual', label: 'Manual testing', promptLabel: 'manual testing' },
            { value: 'automation', label: 'Automation testing', promptLabel: 'automation testing' },
            { value: 'both', label: 'Both', promptLabel: 'both manual and automation testing' },
          ],
        },
        {
          id: 'gitExperience',
          label: 'Experience with Git',
          group: 'experience',
          type: 'select',
          required: true,
          options: [
            { value: 'none', label: 'None', promptLabel: 'none' },
            { value: 'basic', label: 'Basic', promptLabel: 'basic' },
            { value: 'comfortable', label: 'Comfortable', promptLabel: 'comfortable' },
          ],
        },
        {
          id: 'vcsHost',
          label: 'Version control host',
          group: 'environment',
          type: 'select',
          required: true,
          default: 'github',
          options: [{ value: 'github', label: 'GitHub' }],
        },
        {
          id: 'practiceTarget',
          label: 'What will you test?',
          group: 'environment',
          type: 'select',
          required: true,
          default: 'demo-site',
          options: [
            { value: 'demo-site', label: 'A public demo site (Copilot suggests one)' },
            { value: 'own-app', label: 'My own application' },
          ],
        },
        {
          id: 'practiceTargetDetails',
          label: 'Your application (URL or short description)',
          group: 'environment',
          type: 'text',
          required: true,
          placeholder: 'e.g. https://staging.example.com — login and checkout pages',
          visibleWhen: { field: 'practiceTarget', equals: 'own-app' },
        },
      ],
      derived: [
        {
          id: 'practiceTargetDescription',
          compute(ctx) {
            if (!ctx.practiceTarget) return '';
            if (ctx.practiceTarget.value === 'own-app') {
              return ctx.practiceTargetDetails ? 'my own application (' + ctx.practiceTargetDetails.label + ')' : 'my own application';
            }
            return 'a public demo site suitable for practicing UI test automation (suggest one)';
          },
        },
      ],
    },
    { id: 'web-development', label: 'Web Development', comingSoon: true, fields: [] },
    { id: 'cloud', label: 'Cloud', comingSoon: true, fields: [] },
    { id: 'devops', label: 'DevOps', comingSoon: true, fields: [] },
    { id: 'ai', label: 'AI', comingSoon: true, fields: [] },
    { id: 'data', label: 'Data', comingSoon: true, fields: [] },
  ];
})((globalThis.SkillPath = globalThis.SkillPath || {}));
