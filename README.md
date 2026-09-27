# Copilot SkillPath

A local-first web app that gives people an entry point into learning with Microsoft Copilot: set up a Copilot Notebook, follow a guided Starter Path, and copy a personalized prompt for each step.

The app has no backend, makes no network requests, and contains no LLM. Copilot does the teaching; this app prepares the context and the prompts.

## Run it

Double-click `index.html`. It works offline in Edge and Chrome, opened straight from disk (`file://`).

## Develop

No build step and no dependencies. Tests need Node.js 20+:

```sh
npm test
```

### Constraints to keep

* **Classic `<script>` tags only.** Browsers block ES modules and fetching local files when a page is opened from `file://`. Every script attaches to the `SkillPath` global, and the load order is in `index.html`.
* **No network.** No CDNs, web fonts, or analytics. `tests/offline.test.js` enforces this.
* **User data stays in the browser** (localStorage).

## Structure

```
index.html                 App shell and script load order
css/styles.css             Styles (light and dark)
js/config/domains.js       Domains, field groups, fields, derived prompt variables
js/config/presets.js       One-click profile presets
js/config/starter-path.js  Starter Path steps and the Notebook setup wizard screens
js/config/helpers.js       Visibility, sanitizing, validation, prompt context, config integrity check
js/engine/prompt-engine.js Template syntax, validation, and generation (pure functions)
js/templates/registry.js   Template registry
js/templates/setup.js      Step 0: Notebook instructions, initialize-workspace prompt
js/templates/steps.js      Starter Path main prompts, steps 1-10
js/templates/helpers.js    Helper prompts shown on every step
js/templates/library.js    Prompt Library prompts and groups
js/content/references.js   Reference files for the Notebook, generated from the profile
js/storage/storage.js      Versioned localStorage store with in-memory fallback
js/export/data-file.js     JSON data file export/import (pure)
js/ui/dom.js               Small DOM helper (text nodes only, no innerHTML)
js/ui/browser.js           Clipboard (with file:// fallback), download, file reading
js/ui/components.js        Page header, empty state, status messages
js/ui/prompt-card.js       Prompt card: inputs, copy, character count
js/ui/views/               Starter Path, Notebook setup wizard, Prompt Library, My Profile
                           (incl. data export/import and reset)
js/ui/app.js               Navigation, routing, storage notice, announcements
tests/                     node:test suites
```

## Adding content

* **New option** (framework, language, IDE, …): add it to the field's `options` in `js/config/domains.js`. Templates don't change. They receive the option's label as a variable.
* **New field:** add it to the domain's `fields` or to `commonFields`. A `visibleWhen` rule may only reference fields defined earlier.
* **New step:** add it to `js/config/starter-path.js` with the next `number` and a `mainTemplateId`, then register that template.
* **New template:** create a file in `js/templates/`, call `SkillPath.templates.register({...})`, and add a `<script>` tag after `registry.js` in `index.html`.

The schemas are documented at the top of each config file and of `prompt-engine.js`. Run `SkillPath.config.validateConfig({ checkTemplates: true })` in the browser console to check that every referenced template exists.

### Writing prompts

* **Step 0 prompts carry the full profile.** Every other prompt stays short: it refers to "my setup from this Notebook" and repeats a profile value only when it changes the answer (e.g. OS for installing tools).
* **No technology names in templates.** Framework, language, and IDE come from the profile; Copilot supplies the stack-specific commands. `tests/content.test.js` enforces this, along with the length limits.
* **Copilot Notebooks facts the content relies on:** instructions are set via More options (…) → Instructions. References can be .docx, .pptx, .xlsx, .pdf, .loop, .page, .txt, .rtf files, OneNote pages, or links to organization content. Public web pages and .md files can't be added. The setup wizard (`config.wizards`) follows these menu names.

### Template syntax

```
{{framework}}                      label of a profile value, e.g. "Playwright"
{{input:error}}                    prompt-level input; renders its placeholder when empty
{{#if gitExperience == "none"}}    compare the raw value; also !=, in ["a", "b"], name, !name
...
{{else}}
...
{{/if}}
{{step.title}}                     built-in step variables: title, summary, number, definitionOfDone
```

* A line that uses an absent optional variable is dropped.
* An absent required variable is reported in `missing` and shown as `[MISSING: name]`.
* A block tag on its own line leaves no blank line behind.
* Bump a template's `version` whenever its text changes.
