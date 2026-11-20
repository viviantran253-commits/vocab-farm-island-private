# Vocab Farm Island — classroom game v0.13

## Play

- **Official classroom link:** https://viviantran253-commits.github.io/vocab-farm-island-private/
- The GitHub page opens the live Google Apps Script game. Choose a student profile and enter that student's private four-digit passcode. The public demo codes do not work here.
- The private Google Sheet supplies each student's vocabulary and stores their progress and answer history. New vocabulary appears after signing in again or choosing **Words → Reload words** in the game.
- **Offline demo:** [demo.html](demo.html) runs locally and saves only in that browser. It does not use the teacher Sheet.

## Teacher workflow

Open the restricted teacher Google Sheet and choose **Vocab Farm → Open Teacher Dashboard**. Add words to `Vocab_01` through `Vocab_10`, one student per tab, with English, IPA, part of speech, Vietnamese meaning, and example sentence in columns A–E. The teacher dashboard manages names, student passcodes, progress, and answer history. Keep the Sheet restricted; students only need the official game link and their individual passcode.

The live student Apps Script project is `Vocab Farm Student Game`. Its private Script Properties hold `SHEET_ID` and `ASSET_BASE_URL`. Its web app runs as the teacher account and allows anyone to open the login page; access to each profile requires its passcode. The GitHub Pages site hosts artwork and routes visitors to that web app. No Sheet ID or PIN is stored in public source.

## Code and updates

- `google-apps-script/student-app/` contains the live web app source. After editing it, copy changed files into the Apps Script project and **deploy a new version of the existing web app deployment**.
- `google-apps-script/teacher-dashboard/` contains the separate Sheet-bound teacher dashboard source.
- `game.js`, `style.css`, and `map-config.js` power `demo.html`; keep gameplay changes aligned with the student app files.
- `FINAL_SETUP_GOOGLE_SHEETS_GITHUB.md` is a setup guide for a fresh installation. This repository is already connected and deployed.

Existing offline demo progress is not imported into the teacher Sheet. Google Apps Script and Sheets service quotas still apply.
