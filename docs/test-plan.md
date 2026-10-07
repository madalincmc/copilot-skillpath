# Test plan – Copilot Skill Path

September 30, 2026

This round validates Copilot SkillPath, a local HTML app that sets up a Copilot Notebook and hands the learner one prompt per step of an automation Starter Path. Three things are tested: the app works, the prompts get good Copilot answers, and the learning path holds up.

## Setup

- Open `copilot-skillpath.html` from the local disk, in Edge, Chrome, Firefox or Safari; each browser should be covered by at least one tester.
- Microsoft 365 account with Copilot and Notebooks.
- Two profiles only, split across the team: **P1** Playwright + JavaScript (VS Code) and **P2** Selenium + Java (IntelliJ IDEA). Windows or macOS; presets default to Windows.
- A fresh Notebook per profile run.

## 1. Functional flows

| ID | Flow | Main steps | Expected | Result |
| --- | --- | --- | --- | --- |
| F1 | Profile from a preset | Start from a preset → check values → Save and start | Profile saved, user sent to Notebook setup |  |
| F2 | Adjusted preset and validation | Change OS, target (own app) and duration (custom) → leave new fields empty → Save | Extra fields appear only when needed; errors name the fields |  |
| F3 | Notebook setup wizard | Download the 3 files → create Notebook → paste instructions → paste plan prompt → Finish | Files hold the profile; menu names match Copilot; progress saved |  |
| F4 | Starter Path, steps 1–11 | Per step: copy prompt → paste in Notebook → Mark as done → Next step | Prompts personalized; progress tracked; step 11 optional; completion message at the end |  |
| F5 | Need help with this step? | Use Continue where I left off, I'm stuck, Explain this, Review my work, Check my understanding, with and without inputs | Step title and inputs appear; empty inputs stay as \[PLACEHOLDER\] |  |
| F6 | Theory, Quizzes, Prompt Library | Open each chapter, build quizzes with different options, copy one prompt per library group | Every prompt copies and matches the selection |  |
| F7 | Export, delete, import | Export data → Delete all my data → import the file; then import an invalid or edited .json | Data restored identically; invalid files rejected with a clear message |  |
| F8 | Profile change | After a few steps, Update my profile | Prompts update; a banner says the Notebook is out of date (for a framework or language change, it offers starting again with a new Notebook); the banner disappears after the setup is done again |  |
| F9 | Robustness | Reload mid-flow, private window, dark mode, narrow window, keyboard only | Nothing lost; clear message if storage is unavailable; layout usable |  |

## 2. Copilot responses

Method: paste each prompt unchanged into the Notebook, answer as a real beginner would (make mistakes, ask for the solution, report a failed command), and actually run the commands and code. Repeating one prompt in a second Notebook shows how consistent the answers are. Any score below 4 is backed by the saved conversation.

Each response is scored 1–5 on:

- Uses the profile (stack, OS, IDE) without asking again.
- Technically correct on current versions.
- One step at a time, hints before full solutions.
- Ends a step with 3 questions and sends the learner back to the app.
- Concise, at the learner's level.

Specific checks: the learning plan covers all 11 steps with time estimates and a weekly schedule; Copilot asks for one thing per message and ends each part with a Checkpoint line; Continue where I left off resumes from the last checkpoint after reopening the Notebook; I'm stuck asks diagnostic questions before giving a fix; Review my work lists improvements without rewriting the code; quizzes respect count, format and level, and the answers marked correct really are correct.

## 3. Feedback

| Perspective | Questions |
| --- | --- |
| Functionality | Where did the flow stall? What was missing or unnecessary? |
| Prompts | Which prompt gave the weakest answer, and what wording fixed it? Which rules did Copilot ignore? |
| Experienced automation engineer | Is the material accurate and current? What falls out of the flow (e.g. test independence, test data, flaky tests)? Where should the path insist more? Would the final project pass a code review? |
| Manual tester | Did setup work without outside help? Were explanations clear? Were the tests self-written or copied? Could a simple test for a real app be written afterwards? |

Starting ideas, to confirm or reject:

- Show each step's “Done when” as a checklist, and include it in the step prompt.
- A “Where I left off” prompt for returning to the Notebook after a break.
- Save quiz scores in the app.

## Reporting

One report per issue: title, type (functional bug, Copilot response, functionality suggestion, prompt suggestion, curriculum, learner experience), flow or prompt, profile, browser, steps, expected vs. actual, and screenshot.

Severity: **Blocker** (the path cannot continue), **Major** (wrong result, with a workaround), **Minor** (inconvenient), **Cosmetic** (visual only). Weak Copilot answers need the exact prompt and the full conversation; without them, a prompt problem cannot be told apart from a model problem.
