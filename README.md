# Vocab Farm Island — classroom game v0.48

## Play

- **Official classroom link:** https://viviantran253-commits.github.io/vocab-farm-island-private/
- The GitHub page opens the live Google Apps Script game. Enter the student number and private four-digit passcode. The public demo codes do not work here.
- The private Google Sheet supplies each student's vocabulary and stores their progress and answer history. New vocabulary appears after signing in again or choosing **Your Farmhouse → Answer history → Reload words** in the game.
- **Offline demo:** [demo.html](demo.html) is the older v0.13 local demo. It saves only in that browser and does not use the teacher Sheet.

## Teacher workflow

Open the restricted teacher Google Sheet and choose **Vocab Farm → Open Teacher Dashboard**. Add words to `Vocab_01` through `Vocab_10`, one student per tab, with English, IPA, part of speech, Vietnamese meaning, and example sentence in columns A–E. The teacher dashboard manages names, student passcodes, progress, and answer history. Keep the Sheet restricted; students only need the official game link and their individual passcode.

To start a student over, select their ID in the teacher dashboard, type that same two-digit ID under **Start this student over**, and click **Reset game progress**. This resets only that student's game, Special Seed ledger, and answer history to Level 1. Their name, passcode and vocabulary remain. The previous rows are copied to the private `_ResetArchive` tab; the student must sign in again.

Adding new shop items later does not itself clear saved progress. Keep the existing save fields and item IDs compatible when updating the game, and migrate older profiles if a future item needs new save data.

For private feature testing, unlock the teacher dashboard and choose **Create teacher test profile (11)**. Record the generated four-digit passcode. Profile 11 has its own `Vocab_11` sample words and saved progress. Sign in to the usual student link as **Teacher Test (11)** to use its test controls for gold, level, resources, plot unlocks, and growth timers. The controls affect only profile 11. To start it over, use the dashboard reset for ID 11.

The live student Apps Script project is `Vocab Farm Student Game`. Its private Script Properties hold `SHEET_ID` and `ASSET_BASE_URL`. Its web app runs as the teacher account and allows anyone to open the login page; access to each profile requires its passcode. The GitHub Pages site hosts artwork and routes visitors to that web app. No Sheet ID or PIN is stored in public source.

### Student login numbers

Students type their number and private four-digit passcode on the login page. In the teacher's private Google Sheet, open the `_Students` tab and edit column **I, Login number**. Each number must be unique and between 1 and 999999. Student 01 starts with login number `1`, Student 02 with `2`, and the teacher test profile with `11`. Refresh the teacher dashboard to see the numbers there. Changing a login number does not change the permanent student ID in column A, passcode, vocabulary, answer history, or saved game progress. Give the student their new number privately. If two students have the same login number, login is blocked until the teacher fixes it.

## Code and updates

- [v0.42 source bundle](staging/v0.42/README_START_HERE.md) retains the supplied student candidate and public assets. The official student source merges its new features with the existing classroom login and private Sheet settings.
- [v0.30 staging](staging/v0.30/README.md) remains as the previous source reference and rollback asset set.
- `google-apps-script/student-app/` contains the live web app source. After editing it, copy changed files into the Apps Script project and **deploy a new version of the existing web app deployment**.
- `google-apps-script/teacher-dashboard/` contains the separate Sheet-bound teacher dashboard source.
- Both Apps Script folders include their deployment manifest. The private `SHEET_ID`, `ASSET_BASE_URL`, passcodes, and Google credentials remain in Google or the teacher's private Sheet and are not in this source archive.
- `game.js`, `style.css`, and `map-config.js` power the older `demo.html` only. The official game uses `google-apps-script/student-app/`.
- `FINAL_SETUP_GOOGLE_SHEETS_GITHUB.md` is a setup guide for a fresh installation. This repository is already connected and deployed.

Existing offline demo progress is not imported into the teacher Sheet. Google Apps Script and Sheets service quotas still apply.

## Vocabulary categories

In each `Vocab_` tab, column C accepts `n`, `v`, `adj`, `adv`, `n. phr.`, `v. phr.`, `adj. phr.`, `adv. phr.`, `phrasal verb`, `idiom`, `collocation`, or `n/v` (or their full English names). Use `v. phr.` for “focus on”; use `phrasal verb` when a verb combines with a particle, such as “give up.” These categories appear in learning cards and questions. Existing word IDs and progress for legacy verb phrases remain intact.
