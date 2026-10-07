# About Copilot SkillPath

Copilot SkillPath turns Microsoft 365 Copilot into a personal mentor for learning test automation. The app prepares the context and the prompts; Copilot does the teaching, inside a Copilot Notebook that remembers the learner's setup and progress.

## What it is

A small web app delivered as one HTML file. It opens with a double-click, works offline, and needs no installation, account, or server. There is no backend, no network access, and no built-in AI.

It currently covers one learning domain, **Automation Testing**, with two ready-made starting points:

- Playwright + JavaScript (VS Code)
- Selenium + Java (IntelliJ IDEA)

Other frameworks and languages can be chosen in a custom profile. Web Development, Cloud, DevOps, AI, and Data are listed as coming soon.

## Who it is for

| Audience | What they get |
| --- | --- |
| Manual testers moving to automation (primary) | A guided route from an empty machine to tests running in version control, explained in terms they already know |
| Beginners with a framework or language | One concept at a time, with exercises and questions, instead of a full solution to copy |
| Testers who already automate | A structured way to pick up a new stack, plus practice, quizzes, and interview-style questions |
| Team leads and learning programs | A repeatable path to hand to many people, using a Copilot license the company already pays for |

## Why it exists

Copilot can teach almost anything, but on its own it leaves a learner with a blank chat box. In practice that causes four problems:

1. **Not knowing what to ask.** Beginners don't know the next topic or how to phrase it.
2. **Losing context.** Every new chat starts from zero; the learner re-explains their stack, OS, and level each time.
3. **Copying instead of learning.** Copilot readily writes the whole solution, so the learner finishes a task without understanding it.
4. **No structure or progress.** Nothing tells the learner what they have covered, what is next, or when a topic is done.

SkillPath solves these by giving Copilot a fixed context, a teaching style, and an ordered path, while the learner keeps a clear view of where they are.

## How it works

1. **Learning profile.** The learner picks a preset or fills in a short form: framework, language, OS, IDE, experience, testing and Git background, practice target, goal, available time, target duration, and learning style. It takes under a minute.

    By default, all exercises use the [QA Automation Playground](https://auto-test-site.vercel.app/index.html), a practice site built for this path, with pages for logins, forms, a shop and checkout, tables, interactions, dynamic content, frames, and shadow DOM. Copilot is told to use only this site and never suggest another one. Learners can choose their own application instead.
2. **Notebook setup (step 0).** A four-screen wizard:
    1. Download 3 reference files generated from the profile: the learning profile, the Starter Path with each step's "done when" criteria, and the essentials of test automation.
    2. Create a Copilot Notebook and add the files as references.
    3. Paste the generated instructions into the Notebook's Instructions. They tell Copilot who the learner is and how to teach them.
    4. Paste the first prompt; Copilot reviews everything and creates a learning plan with a weekly schedule.
3. **Starter Path (steps 1–11).** One step at a time, the learner copies a short prompt into the same Notebook and works through it with Copilot:

    | Step | Topic |
    | --- | --- |
    | 1 | Prepare the environment (runtime, IDE, Git) |
    | 2 | Learn the language essentials |
    | 3 | Create the project |
    | 4 | Understand the project structure |
    | 5 | Write the first test |
    | 6 | Write the first selectors |
    | 7 | Assertions and waits |
    | 8 | Create the first Page Object |
    | 9 | Run tests locally |
    | 10 | Push to GitHub |
    | 11 | Run tests in CI (optional) |

    At the end of each step Copilot asks three questions, then sends the learner back to the app to mark the step done and copy the next prompt.
4. **Help on every step.** *Continue where I left off*, *I'm stuck*, *Explain this*, *Review my work*, and *Check my understanding* prompts, with the current step filled in automatically.
5. **Beyond the path.**
    - **Theory:** 10 short chapters, each with a "Go deeper in Copilot" prompt for the learner's stack.
    - **Quizzes:** pick a topic, number of questions, format, and difficulty; Copilot asks one question at a time, explains each answer, and keeps score.
    - **Prompt Library:** extra prompts to plan, learn, practice, build, validate, and review (for example *Give me an exercise*, *Interview me*, *Identify my knowledge gaps*).

### How Copilot is told to teach

The Notebook instructions set the same rules for every answer:

- One concept at a time: what it is, why it matters in tests, an example, common mistakes, and similar options.
- After each concept, in order: an exercise, the learner's output reviewed, then one check question.
- One request per message: never two questions, or a question and an output, at once.
- Each finished part ends with a "Checkpoint:" line, so *Continue where I left off* can resume there after a break.
- Hints first; the full solution only when the learner asks.
- Exact commands and menu paths for the learner's OS and IDE.
- Explanations matched to the learner's level, linked to manual testing for manual testers, with every Git command explained for Git beginners.
- Official documentation for the tools first, and a note when something depends on the version.

## Key design decisions

| Decision | Why |
| --- | --- |
| No backend, no network, no built-in AI | Nothing to host, approve, or secure; no data leaves the computer; works on locked-down corporate machines |
| One HTML file | Easy to share on Teams or email and open with a double-click |
| Copilot Notebook as the workspace | Its references and instructions give Copilot lasting context, so every later prompt can stay short |
| Full context once, short prompts after | The profile is pasted once in step 0; step prompts only name the goal and say "using my setup from this Notebook" |
| No technology names in templates | Prompts take the framework, language, and IDE from the profile, so one set of prompts serves every stack |
| Mentor rules over answers | The aim is understanding: hints before solutions, exercises, and questions at every step |
| Learner marks steps done | Copilot cannot report back to the app; the "done when" criteria and the end-of-step questions guide the decision |
| Notebook freshness check | The app remembers the profile the Notebook was set up with and shows a banner when they no longer match |

## Benefits

**For learners**

- Starts in about 10 minutes, then one prompt per step, whenever there is time.
- Lessons fit their own stack, OS, IDE, level, and schedule.
- Learning by doing, with feedback, instead of copying code.
- Always clear what is done, what is next, and what "done" means.

**For teams and organizations**

- Reuses the existing Microsoft 365 Copilot license; no new tool to buy or roll out.
- No data processing outside Copilot itself, so little or no security review.
- The same path for everyone, adapted to each person.
- Content is configuration: new steps, options, and prompts are added without changing the app's code.

## Data and privacy

- Everything the learner enters stays in their browser (localStorage). Nothing is sent anywhere by the app.
- The only data that reaches Copilot is what the learner pastes or uploads to their own Notebook.
- *My Profile → Export data* saves a backup file to move to another computer; importing shows the file's profile before anything is replaced.
- *Delete all my data and start over* removes everything from the browser.

## Requirements and limitations

- Needs a Microsoft 365 account with Copilot and access to Notebooks.
- Runs in current versions of Edge and Chrome. Firefox and Safari are not yet verified.
- Progress lives in one browser; switching computers needs an export and import.
- The quality of the teaching depends on Copilot. Answers can vary between runs, and very long Notebook conversations can degrade; starting a fresh Notebook usually helps.
- The app cannot see the learner's work, so it cannot verify that a step is really done.
- The app and all prompts are in English.

## Maintenance

- `npm test` checks the configuration, the prompts (length limits, no technology names, no missing values), storage, import and export, and that the app makes no network requests.
- `npm run build` produces `dist/copilot-skillpath.html`, the single file to share. Every push to `main` also publishes it to GitHub Pages.
- How to add options, fields, steps, and prompts is described in the [README](../README.md#adding-content).
- Testing guidance for reviewers is in the [test plan](test-plan.md).
