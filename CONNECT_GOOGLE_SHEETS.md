# Connect Vocab Farm Island to your free Google Sheets

**Version:** v0.5 student game + private teacher dashboard (installation kit)

**Privacy:** You do **not** need to send anyone your Google password, teacher PIN, Sheet URL, student codes, API keys, or OAuth tokens. Carry out these steps yourself in your Google account. Keep the Google Sheet **private**. Do not enable Firebase Blaze, paid Google Cloud billing, or paid APIs.

## Which address should students use?

The **online student game** will run at the **Google Apps Script web-app URL** you deploy. Your **GitHub Pages** site hosts the game's public image files only (and optionally a link to the game). Opening `index.html` directly on GitHub still launches the **offline demo**, not the shared classroom system.

## Part A — Your private teacher dashboard (Google Sheet)

1. In your own Google account, create a blank Google Sheet named `Vocab Farm — Private Teacher Data`.
2. **Do not share the Sheet with students**. Keep it accessible only to your teacher account (or trusted co-teacher editors).
3. In the Sheet, choose **Extensions → Apps Script** (this creates a *container-bound teacher project*).
4. Add the two files from `google-apps-script/teacher-dashboard/`:
   - `Admin.gs` as a **script** file named `Admin`;
   - `TeacherDashboard.html` as an **HTML** file named `TeacherDashboard`.
5. Save, return to the Sheet, and reload it. Open **Vocab Farm → Open Teacher Dashboard**. Authorize access when Google asks.
6. In the private sidebar, choose a **6-digit teacher PIN**. Enter your preferred PIN in the masked field yourself; the secret is hashed in private Apps Script properties, not copied into GitHub or the public student game. Subsequent visits require this PIN. Your Google account and private Sheet permissions are the first security layer; the PIN is an additional layer.
7. After unlocking the private sidebar, select **Set up Sheets**. It creates these tabs without erasing existing data:
   - `_Students` — student IDs, teacher-set display names, *salted SHA-256 PIN hashes*, failed sign-in counters;
   - `_Progress` — browser game state snapshots and revisions;
   - `_History` — one row per submitted question (including mistakes);
   - `Vocab_01` through `Vocab_10` — separate vocabulary for each student.
8. **Write down the generated student PINs shown once** in the sidebar and share each one privately. To reset a code later, choose a student and press **Reset PIN**. Changing the code also invalidates that student's old online session.
9. To rename `Student 01`, select that student, edit **Display name**, and save. The new name appears on their next login or vocabulary reload.

**Where the dashboard lives:** In Google Sheets → **Vocab Farm → Open Teacher Dashboard**. It requires both editor access to the private Sheet and the 6-digit teacher PIN you set in the private sidebar. Students never receive the dashboard source as an app. The PIN is **not embedded in GitHub**.

### Enter new vocabulary daily

Open `Vocab_01`, `Vocab_02`, etc. and fill **exactly five columns**:

| A — English word | B — UK IPA | C — POS | D — Vietnamese meaning | E — Bilingual example |
| --- | --- | --- | --- | --- |
| planet | /ˈplæn.ɪt/ | n | hành tinh | Earth is a planet. (Trái Đất là một hành tinh.) |
| generous | /ˈdʒen.ər.əs/ | adj | hào phóng | He is generous. (Anh ấy hào phóng.) |

Allowed part-of-speech values: `n`, `v`, `adj`, `adv`. All five cells must be filled for a word to be loaded. Do not rename the `Vocab_XX` tabs. The teacher can add more rows anytime. Students click **Settings → Reload vocabulary / Tải từ mới**, or sign out and sign back in, to get the additions. Do not include students' private data in the vocabulary tabs.

## Part B — Publish public assets on GitHub Pages

1. Create a public GitHub repository, e.g., `vocab-farm-island`.
2. Upload the `assets/` folder (and optionally the offline demo source) from this ZIP to the repository root. Publicly uploaded assets and source code **can be viewed by anyone**. Do not upload Google Sheets, `_Students`, `_Progress`, `_History`, passcodes, or private records.
3. In the repository's Settings, enable **Pages** → deploy from main branch/root (depending on current GitHub UI).
4. Copy its HTTPS URL, e.g. `https://YOUR_GITHUB_USERNAME.github.io/vocab-farm-island/`. It must end in `/` and contain the `assets/` folder, e.g. `[URL]assets/map/islands_base.png`.
5. The online game loads these public images from GitHub Pages. GitHub Pages itself does **not** provide student authentication or data storage.

## Part C — Deploy the student web app (separate Apps Script project)

**Do not add student server functions to the private teacher's bound Apps Script project.** Use a **second**, standalone Apps Script project for the public student game. Keeping these two projects separate is an important privacy boundary.

1. In your own browser, go to [script.google.com](https://script.google.com/) → **New project**.
2. Add the files from `google-apps-script/student-app/`:
   - `Server.gs` as a script file named `Server`;
   - `StudentGame.html` as HTML named `StudentGame`;
   - `Stylesheet.html` as HTML named `Stylesheet`;
   - `MapConfig.html` as HTML named `MapConfig`;
   - `GameCode.html` as HTML named `GameCode`.
3. Open **Project Settings → Script Properties** and create:

   | Property | Value (example only — use your own) |
   | --- | --- |
   | `SHEET_ID` | The ID inside your private Sheet URL between `/d/` and `/edit` |
   | `ASSET_BASE_URL` | `https://YOUR_GITHUB_USERNAME.github.io/vocab-farm-island/` |

   Never paste your password or Google OAuth token. Script properties live in your private Apps Script project.
4. Press **Deploy → New deployment → Web app**. Choose **Execute as: Me**; access: **Anyone** (if you need students without Google accounts). This means the web app runs with your authorized Sheet access: **do not grant other people edit access to this script**.
5. Copy the deployed `/exec` URL. **This is the link you send students**. Students use their 2-digit ID and 4-digit student PIN; they do not need your Google account or Sheet access.
6. Open the web-app link in an incognito/private browser window and try Student 01. The teacher can watch the progress and submitted answers in the private Sheet dashboard.
7. When changing any public student code, **update the deployment to a new version** as Google's deployment system requires. Merely uploading changed GitHub images does not update inline HTML/JS embedded in an Apps Script deployment.

### Safe deployment testing checklist

- [ ] Student enters a 4-digit PIN; the correct display name appears.
- [ ] Student can buy carrot seeds and plant them.
- [ ] Plant, water, tend, fertilize all animate for about **2 seconds**.
- [ ] A new teacher-added word appears after **Reload vocabulary**.
- [ ] A wrong answer is logged as **Wrong** in `_History` and the dashboard.
- [ ] A right answer is logged as **Correct**.
- [ ] Reloading or signing in on another device restores the previous crop, inventory, gold, and XP (if its last save completed).
- [ ] Teacher can rename a student and reset the student's PIN.
- [ ] The public student URL does **not** provide teacher dashboard controls.
- [ ] All student data Sheets remain private.

## Important limitations (before classroom deployment)

**The uploaded package contains working Apps Script code, but it has NOT been deployed or end-to-end tested against your Google account.** Your first live test should use dummy vocabulary and test student IDs. Offline browser tests are not a substitute for live Google permissions and quota testing.

- Google Apps Script and Sheets have free usage quotas and service limits, which Google may change. They are **not a guaranteed permanent unlimited hosting service**. This architecture requires **no payment method or billing-enabled Blaze plan**.
- A public student web app protected with **4-digit PINs** is low assurance. It includes a short account lock after six wrong attempts, but a malicious person may repeatedly lock a known student ID. Use fictional display names (no full real names) if possible, and do not treat the app as a secure examination platform.
- The game computes gold, XP, and most question choices in the browser. The server checks submitted history against current teacher words, but a technically capable user could manipulate gameplay. These records are useful for everyday learning, **not tamper-proof assessment**.
- Saving is asynchronous. Most important actions initiate a save immediately, and periodic saves occur around every 18 seconds. Disconnects and simultaneous devices can cause a conflict warning. Students should use **one device at a time**.
- Online progress starts in the private sheet when the account is first used. Existing **offline localStorage** demo progress is **not automatically migrated**. Offline saves remain in that browser unless its storage is cleared.
- Individual Sheet cell size and history growth limits exist; back up `_History` periodically if the class uses the game for months.
- Teacher dashboard runs as a **Google Sheets sidebar** in the desktop browser; it is not guaranteed to work in the Google Sheets mobile app.
- The six-digit teacher PIN is set directly by you inside the **private Sheet sidebar**, is stored as a salted hash in the private bound Apps Script properties, and is verified server-side before showing student histories. There is no actual PIN value in this ZIP or the public student source. Do not make the private Sheet accessible to students.

## Free tools and privacy

- Google Docs/Sheets and Apps Script are official Google services used under their free quotas.
- GitHub Pages hosts **public static artwork**, not teacher histories or secrets.
- You never need to share any password with ChatGPT, GitHub, or another person to install this kit.

Useful official docs:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/guides/dialogs
- https://developers.google.com/apps-script/guides/triggers

## v0.4 teacher button on login screen
The new **Teacher dashboard · Giáo viên** button on the public login interface does not grant admin access. It shows a short instruction panel and opens your private Google Sheets file (or the Google Sheets homepage). Only Google-account-authorized editors of the private Sheet can open **Vocab Farm → Open Teacher Dashboard**, and the private sidebar then requires the teacher PIN. This means it is safe to display the button publicly, but it will not work as a live dashboard until Part A is complete. Do **not** paste your Google password, PIN, or student records into the login panel.

## v0.4 browser pronunciation
Student pages use `speechSynthesis` and request English `en-GB` voice; playback is initiated by a user click. No audio recordings or TTS provider accounts are required. Availability and fidelity vary by browser/device, so check a physical phone and iPad before classroom deployment.


## v0.5 — Challenge resets, weekly tasks, ranks, zoom and plot expansion

- **Daily tasks:** 15 questions; reset **every day at 00:00 Vietnam time (UTC+07)**. Each correct answer rewards 3 gold; each question has one attempt.
- **Weekly tasks:** 10 questions; reset **every Monday at 00:00 Vietnam time (UTC+07)**. Each correct answer rewards 5 gold; seven correct weekly answers unlock the weekly badge.
- The Tasks panel includes a **live countdown** for both resets. Saved daily/weekly answer state is kept in the existing JSON progress, and every submitted answer is also recorded in `_History`.
- The 10 farmer ranks cover levels 1–50, five levels each. Rank 10 remains the title after level 50; numeric levels remain unlimited.
- The map has **+, − and Fit** zoom controls; desktop mouse wheels can zoom over the map.
- Every plant action-ready message includes a brief Vietnamese translation.
- Online game interface updates require a **new deployed Apps Script version**, whereas image-only asset changes can be delivered by updating GitHub Pages.

**Live deployment required:** The PIN, online saves, vocabulary updates and the shared teacher dashboard cannot be activated by this ZIP alone. You must paste the private teacher files into your Google Sheet's Apps Script editor and authorize them yourself. This project does not require paid hosting or a billing-enabled plan, but Google free-use quotas still apply.

## Current plot expansion rules

Plots 1–2 start unlocked. Plots 3–10 require the appropriate student level and a one-time purchase price of 100–800 gold. There are no recurring plot charges. Student progress continues to use the existing v2 profile format.
