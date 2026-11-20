# Vocab Farm Island — v0.13

**Ready for local demonstration and manual cloud setup; NOT already deployed online.**

## Start
- For an **offline demo**, open `index.html` in a browser; Student 01 PIN `0001` is only a public demonstration code.
- For **real classroom accounts, teacher-controlled vocabulary and cross-device progress tracking**, follow **`FINAL_SETUP_GOOGLE_SHEETS_GITHUB.md`** exactly.
- Use the separately packaged `Vocab_Farm_Island_GitHub_Public_v0_6.zip` for the public GitHub repository. The public site is an assets host/landing page; the online student game runs at a separately deployed Google Apps Script `/exec` link.
- The teacher dashboard is inside your private Google Sheet under **Vocab Farm → Open Teacher Dashboard** and requires your teacher PIN; no private data or teacher PIN is included in the public files.
- **Student Settings has been removed.** Students can view records and reload vocabulary from **Words**. Teacher controls are in the private dashboard.

Please retain backups of previous versions before changing your files. Existing offline progress is not automatically transferred to Google Sheets. No paid services or passwords are needed to prepare this code.

## Current in v0.13
- Plots 1–2 are free. Plots 3–10 require their stated levels and a single unlock payment (100, 200, …, 800 gold).
- There are **no daily or recurring planting-plot charges**. Unlocking a plot never charges extra after the initial payment.
- Existing student IDs, vocabulary, levels, gold, XP, unlocked plots, crops and answer histories remain compatible.
- Old obsolete plot-charge metadata is ignored and removed when profile data is loaded or saved.
- Offline and Apps Script student game code match. Student save format stays version 2.

## Earlier in v0.8
- Fixed duplicate characters in missing-letter tasks (for example, typing `r` in `o_g_n_s_` now fills only one blank).
- Uses the browser's native `input` event for typing. `keydown` now handles navigation, deleting, and submitting only.
- The fix is applied to both `game.js` (offline) and `google-apps-script/student-app/GameCode.html` (online).
- Previous game features, student progress format, and private teacher files are unchanged.

**Already deployed online?** Replace `GameCode.html` in the Google Apps Script student web-app project and deploy a new version. You do not need to republish the teacher dashboard or Google Sheet for this fix. A hard refresh on student devices can help ensure the latest version loads.

## Earlier in v0.7
- Spelling tasks now contain real editable blanks within the word. Tap/click a blank and type normally; focus moves to the next blank automatically.
- Plot pricing has subsequently changed; see **Current in v0.10** above.
- Both the offline game and the Google Apps Script student-app template are updated.

**If already deployed online:** update `GameCode.html` and `Stylesheet.html` in the student Apps Script project, then deploy a **new version** of the web app. The Google Sheet and teacher dashboard files do not need to be replaced for these two fixes.

## Updating an existing Apps Script deployment

Replace `GameCode.html` and `Server.gs` in your private student web-app project, save, and deploy a new version. You do not need to reset student accounts, private vocabulary tabs, or the teacher dashboard. Keep a backup of the old code and data before updating.
