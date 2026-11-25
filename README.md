# Vocab Farm Island — classroom game v0.50

## Play

- **Official classroom link:** https://viviantran253-commits.github.io/vocab-farm-island-private/
- The GitHub page opens the live Google Apps Script game. Enter the student number and private passcode. Existing four-digit codes work; new and reset codes have six digits. The public demo codes do not work here.
- The private Google Sheet supplies each student's vocabulary and stores their progress and answer history. New vocabulary appears after signing in again or choosing **Your Farmhouse → Answer history → Reload words** in the game.

## Teacher workflow

Open the restricted teacher Google Sheet and choose **Vocab Farm → Open Teacher Dashboard**. Add words to `Vocab_01` through `Vocab_10`, one student per tab, with English, IPA, part of speech, Vietnamese meaning, and example sentence in columns A–E. The teacher dashboard manages names, student passcodes, progress, and answer history. Keep the Sheet restricted; students only need the official game link and their individual passcode.

To start a student over, select their ID in the teacher dashboard, type that same two-digit ID under **Start this student over**, and click **Reset game progress**. This resets only that student's game, Special Seed ledger, and answer history to Level 1. Their name, passcode and vocabulary remain. The previous rows are copied to the private `_ResetArchive` tab; the student must sign in again.

Adding new shop items later does not itself clear saved progress. Keep the existing save fields and item IDs compatible when updating the game, and migrate older profiles if a future item needs new save data.

For private feature testing, unlock the teacher dashboard and choose **Create teacher test profile (11)**. Record the generated six-digit passcode. Profile 11 has its own `Vocab_11` sample words and saved progress. Sign in to the usual student link as **Teacher Test (11)** to use its test controls for gold, level, resources, plot unlocks, and growth timers. The controls affect only profile 11. To start it over, use the dashboard reset for ID 11.

The live student Apps Script project is `Vocab Farm Student Game`. Its private Script Properties hold `SHEET_ID` and `ASSET_BASE_URL`. Its web app runs as the teacher account and allows anyone to open the login page; access to each profile requires its passcode. The GitHub Pages site hosts artwork and routes visitors to that web app. No Sheet ID or PIN is stored in public source.

### Student login numbers

Students type their number and private passcode on the login page. In the teacher's private Google Sheet, open the `_Students` tab and edit column **I, Login number**. Each number must be unique and between 1 and 999999. Student 01 starts with login number `1`, Student 02 with `2`, and the teacher test profile with `11`. Refresh the teacher dashboard to see the numbers there. Changing a login number does not change the permanent student ID in column A, passcode, vocabulary, answer history, or saved game progress. Give the student their new number privately. If two students have the same login number, login is blocked until the teacher fixes it.

## Code and updates

- `assets/` contains every image used by the official game. The `assets/companions/registry.json` catalog lets the teacher add, replace, or disable companions through GitHub. See [COMPANIONS.md](COMPANIONS.md).
- `assets/audio/` contains the approved music and sound effects. See [AUDIO.md](AUDIO.md) for controls and manual deployment steps.
- Run `node scripts/validate-assets.mjs` before publishing assets. It checks every registered companion image, dimensions, references, and unused files.
- `google-apps-script/student-app/` contains the live web app source. After editing it, copy changed files into the Apps Script project and **deploy a new version of the existing web app deployment**.
- `google-apps-script/teacher-dashboard/` contains the separate Sheet-bound teacher dashboard source.
- Both Apps Script folders include their deployment manifest. The private `SHEET_ID`, `ASSET_BASE_URL`, passcodes, and Google credentials remain in Google or the teacher's private Sheet and are not in this source archive.
- Rollback point: Git tag `rollback-before-dynamic-companions-2026-11-25` and student Apps Script version 20. Restore both together if needed; old code refers to the old staging asset path.

Existing offline demo progress is not imported into the teacher Sheet. Google Apps Script and Sheets service quotas still apply.

## Vocabulary categories

In each `Vocab_` tab, column C accepts `n`, `v`, `adj`, `adv`, `n. phr.`, `v. phr.`, `adj. phr.`, `adv. phr.`, `phrasal verb`, `idiom`, `collocation`, `conj`, `n/v`, or `v/n` (or their full English names). Use `v. phr.` for “focus on”; `phrasal verb` remains available when the teacher wants to record the more specific linguistic type, such as “give up.” Both appear to students and are graded as **Cụm động từ (v. phr.)**. The original type remains in the word record, and existing word IDs and progress remain intact.

The November 2026 workbook audit checked all 962 populated vocabulary rows across the student tabs. Every row is now loadable, including mixed noun/verb entries and the conjunction in `Vocab_10`. The phrase labels for “make a decision,” “communal house,” and three standalone phrasal verbs were corrected in the private teacher Sheet. Existing word IDs for the edited entries are preserved by the server.
