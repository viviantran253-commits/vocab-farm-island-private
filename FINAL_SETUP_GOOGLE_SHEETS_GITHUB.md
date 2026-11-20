# Vocab Farm Island v0.6 — Complete no-payment setup guide

> **Current installation (November 2026):** The official classroom game is already deployed at https://viviantran253-commits.github.io/vocab-farm-island-private/. This page describes how to set up a separate installation from scratch. In the current repository, `index.html` is the official launcher and `demo.html` is the local offline demonstration. See [README.md](README.md) for the current teacher workflow.

**For:** one teacher, approximately ten students using phones/iPads/computers, one private Google Sheet, one public GitHub repository, and one free Google Apps Script student web app.

**Important distinction:** The ZIP's `index.html` is a **local demonstration**. It cannot share student progress across devices. To track answers from your computer while a student plays on their phone, the student must use the **Google Apps Script `/exec` game link** described in Part C. GitHub Pages provides **public artwork and an optional landing-page link**, not the student database.

**No payments or credentials shared:** You can do the following from your own free Google/GitHub accounts. Do not enable Firebase Blaze, Google Cloud billing, paid APIs, or paid GitHub plans. Never send ChatGPT your Google password, student PINs, teacher PIN, Sheet ID or private data. Apps Script and Sheets have free-use quotas and possible service limitations; they are not unlimited or guaranteed permanent.

## A. Keep the correct folders

After extracting `Vocab_Farm_Island_v0_6_Complete_Kit.zip`, you should have:

```text
vocab-farm-island/
├── index.html                 # Offline demonstration only
├── game.js
├── style.css
├── map-config.js
├── assets/                   # Maps, sprites, crops, icons
├── google-apps-script/
│   ├── teacher-dashboard/
│   │   ├── Admin.gs
│   │   └── TeacherDashboard.html
│   └── student-app/
│       ├── Server.gs
│       ├── StudentGame.html
│       ├── Stylesheet.html
│       ├── MapConfig.html
│       └── GameCode.html
└── FINAL_SETUP_GOOGLE_SHEETS_GITHUB.md
```

A second ZIP, `Vocab_Farm_Island_GitHub_Public_v0_6.zip`, contains **only** the public `assets/` images, `.nojekyll`, and a simple GitHub landing-page `index.html`. Do not upload the private data files or teacher dashboard to a public GitHub repository.

## B. Create the PRIVATE Google Sheet and teacher dashboard

1. Go to **https://sheets.google.com/** while logged in to your own Google account. Create **Blank spreadsheet**.
2. Rename it to **`Vocab Farm — Private Teacher Data`**. Leave sharing at **Restricted**; do **not** share the Sheet with students or make it public.
3. In the Sheet, click **Extensions → Apps Script**. This opens a **container-bound** Apps Script project linked to the Sheet. Name the project `Vocab Farm Teacher Dashboard`.
4. Find the default `Code.gs`. You may rename it **`Admin`** or replace its contents; paste the **entire** contents of `google-apps-script/teacher-dashboard/Admin.gs` into the script editor. Do not paste the filename/path itself.
5. Click **+ → HTML** in the editor's Files section. Name this new HTML file **`TeacherDashboard`**. Paste the **entire** contents of `google-apps-script/teacher-dashboard/TeacherDashboard.html` (the editor creates the `.html` extension).
6. Click **Save**. Return to Google Sheets and **reload the spreadsheet browser tab**. A new menu named **Vocab Farm** should appear. If not, verify that the script was saved and that the Sheet and script are linked.
7. Click **Vocab Farm → Open Teacher Dashboard**. Google may ask you to authorize the script to access the spreadsheet. Inspect the requested permissions, and authorize **only if you understand them and trust the files you installed**. You do not need to give us any passwords.
8. In the private sidebar, create a six-digit teacher PIN. Enter your preferred six-digit PIN **yourself**, inside that private sidebar. The downloaded public code contains no teacher PIN. A PIN already shared in conversation is better replaced with a fresh code before classroom use.
9. Sign in with your private teacher PIN. Click **Set up Sheets**. The dashboard creates 10 student accounts. **Record the newly generated four-digit student PINs immediately**; each code is displayed only once. If you lose a PIN, reset it from the dashboard later.
10. Verify the Sheet now contains:

```text
_Students   # private student IDs / account hashes; do not edit casually
_Progress   # one saved state per student (gold, level, crops, plots)
_History    # one row per submitted question or retry
Vocab_01 ... Vocab_10   # private vocabulary for each student
```

11. Select a student, change the **Display name** (optional), and click **Save name**. You can also reset that student's four-digit code. Under **⚙️ Teacher settings**, you can download the vocabulary CSV template and change the private teacher PIN.

### Add vocabulary each day

Open `Vocab_01`, `Vocab_02`, etc. and fill columns **A–E**:

| A — English word | B — UK IPA | C — POS | D — Vietnamese meaning | E — Example sentence + Vietnamese translation |
|---|---|---|---|---|
| planet | /ˈplæn.ɪt/ | n | hành tinh | Earth is a planet. (Trái Đất là một hành tinh.) |
| generous | /ˈdʒen.ər.əs/ | adj | hào phóng | He is generous. (Anh ấy hào phóng.) |

- POS must be `n`, `v`, `adj` or `adv`. Fill all five columns for every word; incomplete rows are ignored.
- Do not rename `Vocab_01`…`Vocab_10`, `_Students`, `_Progress`, or `_History`.
- Add words in the next available row; do not delete an assigned word during an active crop cycle if you need consistent history verification.
- Students get new words by **signing in again** or opening **Words → Tải từ mới (Reload words)** in the **online student app**. No manual Google Sheet summary entry is required.
- The teacher dashboard also has a button **Open this student's vocab tab**. The private Sheet remains accessible only to authorized editors.

## C. Put PUBLIC image assets on free GitHub Pages

1. Go to **https://github.com/**, sign in to your own account, and click **New repository**.
2. Repository name: **`vocab-farm-island`** (you can choose another name). Choose **Public** for free GitHub Pages. Do not turn on any paid plan.
3. Create the repository. Open the separate **`Vocab_Farm_Island_GitHub_Public_v0_6.zip`** and extract it.
4. Upload **the contents of the extracted folder** into the **repository root**, not into an extra nested directory. You should see `index.html` and the `assets/` directory immediately at the root.
5. Commit the uploaded files. In the GitHub repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, choose the `main` branch and **`/(root)`** folder, and save.
6. Your public site will normally look like:

   `https://YOUR_GITHUB_USERNAME.github.io/vocab-farm-island/`

   Substitute your actual username and repository name. **Keep the final trailing `/`.** Check that the URL opens the landing page, and check a real image URL such as:

   `https://YOUR_GITHUB_USERNAME.github.io/vocab-farm-island/assets/characters/girl/girl_portrait.png`

   If the image doesn't open, correct the folder structure or Page settings before continuing.
7. At this point the public homepage intentionally says **teacher setup needed**, because the student Apps Script app hasn't been deployed yet. This is normal.

**Security:** The GitHub public ZIP includes only images and a landing page. Never put a private Google Sheet URL, teacher PIN, student codes, spreadsheet export, Apps Script `SHEET_ID`, or actual student history into the repository.

## D. Create a SEPARATE online student Apps Script app

1. Go to **https://script.google.com/** and click **New project**. This should be a **standalone** Apps Script project, **not** the Sheet-bound teacher-dashboard project from Part B.
2. Name it **`Vocab Farm Student Game`**. Rename the default `Code.gs` file **`Server`** and paste the complete contents of `google-apps-script/student-app/Server.gs`.
3. Create **four HTML files**, each using **+ → HTML** in the Apps Script editor:

   | Apps Script filename | Paste contents from |
   |---|---|
   | `StudentGame` | `google-apps-script/student-app/StudentGame.html` |
   | `Stylesheet` | `google-apps-script/student-app/Stylesheet.html` |
   | `MapConfig` | `google-apps-script/student-app/MapConfig.html` |
   | `GameCode` | `google-apps-script/student-app/GameCode.html` |

   Do **not** use the offline `index.html` here. Each file has a separate purpose: game layout, styles, map settings and playable JavaScript.
4. Save the project. Open **Project Settings** (gear icon) and scroll to **Script properties**. Add these **two** properties:

   **`SHEET_ID`** — open the private Google Sheet from Part B. Its URL looks like:
   `https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_SHEET_ID/edit`
   Copy only the ID between `/d/` and `/edit`; paste it privately as the Script property's value.

   **`ASSET_BASE_URL`** — paste your public GitHub Pages address **ending in a `/`**, for example:
   `https://YOUR_GITHUB_USERNAME.github.io/vocab-farm-island/`

   **Never** paste a teacher PIN or Google password as a property. Students must not have editor access to this script or the Sheet.
5. In Apps Script choose **Deploy → New deployment**. Select **Web app** as the deployment type. Choose:

   - **Execute as:** `Me` (the teacher's Google account)
   - **Who has access:** `Anyone` (student accounts don't need Google sign-in)

   This is a public entry point, but student data is protected by the game's student-ID/PIN checks. With **Execute as Me**, students do not get direct spreadsheet access. Your account grants the script permission to read and write the private Sheet. Do not place OAuth tokens in the source.
6. Click **Deploy** and review Google's authorization prompt. Copy the generated production **Web app URL ending in `/exec`**. Do not share the `/dev` testing URL with students.
7. Open the `/exec` link on a browser or phone. The page should show the **student login**, without the offline-demo PIN hint. Select `01` and enter that student’s newly generated four-digit code from Part B. The farmer's display name should match the private Sheet.
8. Have the student buy a carrot seed or use an existing seed, plant it, and submit at least one question (intentionally make one answer wrong if testing). Allow the game to complete its save request; you can select **Words → Save progress** when connected. Wait for the save confirmation or verify the rows directly in the Sheet. Do not close the page during a pending save.
9. On your **computer**, open the **private Google Sheet → Vocab Farm → Open Teacher Dashboard**, log in, select the same student, and press **Refresh** and **Refresh history**. You should see their level, gold, XP, growing crops, words assigned, correct/wrong counts, and the **individual attempted answers**. Enable **Show mistakes only** to view incorrect submissions.

If you want students to start from your GitHub Pages homepage, edit the **public GitHub `index.html`**, replacing:

```js
const STUDENT_GAME_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE';
```

with your own valid Apps Script `/exec` URL. Commit the update. That public homepage then provides a single **Play** button leading into the online Google Apps Script student game. **Students should not use the downloadable offline `index.html` for classroom tracking.**

## E. Verify with TWO different devices before teaching

This is the most important checkpoint. Use a non-sensitive test account until these checks pass.

1. **Phone (student):** Open the `/exec` link on the phone using student `01` and their unique four-digit code. Note the display name and starting gold.
2. Plant one carrot and complete the **Water** question correctly. Then answer a **Tend** question incorrectly at least once. That wrong attempt must still be recorded even if the student later retries correctly.
3. From **Words**, choose **Save progress** after the question (if online). Keep the browser online until the save is processed; also leave it open for one automatic sync interval.
4. **Computer (teacher):** Open the private Sheet and unlock the sidebar with your teacher PIN. Press **Refresh**, select student `01`, click **Refresh history**, and enable **Show mistakes only**.
5. Verify that the record includes the **vocabulary word, student's submitted answer, correct answer, task stage, attempt number, result, timestamp**. Verify the summary's level/gold/XP and current growing crop match what the student sees.
6. On the **phone**, log out and log in again. Confirm that their same crops, gold, XP, level, and unlocked plots are restored. This proves the server saved progress rather than only the phone's local storage.
7. Open the same student account on another device only **after logging out of the first**; simultaneous sessions can conflict.
8. **Update the private vocabulary Sheet**: add a test word in `Vocab_01`, then ask the student to tap **Words → Tải từ mới** or sign in again. Confirm the new vocabulary becomes available.
9. **Test account management:** Change the display name in the sidebar; check on next login. Reset the student's four-digit PIN; verify the old PIN and old session no longer work, and the new PIN does.
10. Check a phone and iPad for spelling input, touch movement, zoom controls, safe-area layout, browser UK pronunciation, and Wi-Fi reconnection. The browser itself may not have a British voice; speech availability varies.

**Do not share a classroom link until the cross-device test and permission checks succeed.** A ZIP alone cannot prove live Google account permissions, on-device browser behavior or Apps Script deployment.

## F. What to do if something does not work

| Symptom | Likely cause | Check |
|---|---|---|
| Game says `Offline demo` | Opened local/GitHub `index.html`, not Apps Script `/exec` | Give students the `/exec` link |
| Game says `Set ASSET_BASE_URL` | Missing public assets property | Project Settings → Script properties |
| The island map/images are blank | Wrong `ASSET_BASE_URL` or GitHub folder | Confirm `assets/...png` opens at GitHub Pages |
| `Teacher has not configured SHEET_ID` | Missing private Sheet ID in student script | Add the correct Sheet ID property |
| Login says ID/passcode incorrect | Using old demo PIN `0001` instead of generated private PIN | Reset that student's code in dashboard |
| Dashboard menu missing in Google Sheet | Bound script not saved or Sheet not refreshed | Check Extensions → Apps Script and reload Sheet |
| No saved progress after question | Offline game, failed save, session expired, quota/conflict | Open `_Progress`, Apps Script **Executions**, and check for a save error |
| No incorrect-answer rows | Pending save not completed, wrong login, or missing word | Check `_History`, selected `Vocab_XX`, and server call errors |
| `Another device changed this account` | Same account used in multiple devices concurrently | Log out other device and re-enter |
| Teacher history shows `Unverified` | Word no longer exists or does not match `Vocab_XX` | Restore missing vocabulary entry (English+POS) |
| `Too many wrong codes` | Multiple failed sign-ins (intentional lockout) | Wait for lockout / reset PIN if appropriate |
| Teacher sidebar opens in app but is empty | Google Sheets mobile sidebar limitation | Use desktop Google Sheets in a browser |

## G. Updating the game later without deleting progress

- **Changing only artwork:** Replace the relevant files in the GitHub Pages `assets/` folder. No Apps Script code changes needed (though browsers may cache old images).
- **Changing gameplay/UI:** Edit `GameCode.html`, `Stylesheet.html`, `StudentGame.html`, and/or `MapConfig.html` in the **standalone student script** using the corresponding updated files. Then choose **Deploy → Manage deployments → Edit → New version → Deploy**; using the existing deployment maintains the `/exec` URL.
- **Changing teacher functions/sidebar:** Edit `Admin.gs` or `TeacherDashboard.html` in the **private Sheet-bound script**, save, and reload the Sheet. **Never** publish that bound teacher script as an unrestricted student web app.
- **Changing vocabulary:** Just edit `Vocab_XX`; students reload vocabulary. No game redeploy needed.
- **Backing up:** Periodically use **File → Make a copy** in your private Google Sheet (or download a secure backup), and protect those copies. Never upload them to public GitHub.
- **Do not rename or delete** `_Students`, `_Progress`, `_History` or the student vocab tabs during updates. Existing local-only demo progress is **not** automatically migrated into Google Sheets.

## H. Privacy, security, quotas and realistic limits

- The teacher Sheet and dashboard are **private**, controlled by your Google account and a six-digit PIN. Do not publish the teacher Sheet, settings or API tokens. The PIN is an extra check, not a substitute for Google account permissions.
- A four-digit student code is **weak authentication**. Avoid full real student names and sensitive educational/medical/personal records. A malicious visitor could intentionally lock a known student account by trying wrong PINs. The game is not a tamper-proof examination platform.
- Gold, XP and many gameplay values are calculated in the browser. Teacher answer logs include server-side checking of current vocabulary, but users with developer tools may still modify gameplay. Use the dashboard for **informal learning progress**, not high-stakes grading.
- **Automatic saves are asynchronous**: pending events are batched and may be delayed by network interruption. The online code keeps up to 50 new answer events per save request and retains further pending events for later saves. Each attempt should appear in `_History` after it is received. If the connection fails mid-task, no remote save is guaranteed until a successful retry.
- Google Apps Script and Sheets have execution limits, concurrent execution constraints, quota changes, and spreadsheet size restrictions. The revised version keeps detailed answer attempts in `_History`, while limiting the size of each student snapshot in `_Progress`. The history Sheet can still grow; archive or back it up periodically.
- **No billing-enabled plans are required** for this design. Google and GitHub still reserve the right to change free tiers, permissions and quotas. Do not enable any paid plan or add a payment method if you want to avoid billing risk.
- Students may encounter a Google authorization or script-access restriction if your Google account has organizational policies; if “Anyone” deployment is unavailable, the proposed login-free architecture cannot be activated as written.
- The teacher dashboard is designed for **desktop Google Sheets**; Google Sheets mobile app sidebars are not fully equivalent.

## What has been tested in this package?

- JavaScript syntax and image references checked.
- **Spelling logic tested** for `i_l_n_ → island` and `s_l_t_o_ → solution`: one typed letter fills the next underscore; editing an earlier slot also works.
- **Backend logic tested with simulated Google Spreadsheet services** for: student login, server-side saving, a correct and an incorrect answer, weekly answer, dashboard counts, saved gold/level/XP, PIN reset, session invalidation, and duplicate-event detection.
- HUD rank text contains both English and Vietnamese; CSS places small zoom controls at the lower-right, and `Fit` uses a centered map camera calculation.
- **Not yet proven**: live authorized Google deployment or full visual/browser behavior in this environment (browser navigation was blocked). Validate the actual computer, phone and iPad before classroom use.

Official references:
- Google Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
- Apps Script HTML Service: https://developers.google.com/apps-script/guides/html
- `google.script.run`: https://developers.google.com/apps-script/guides/html/communication
- Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas
- GitHub Pages public publishing: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
