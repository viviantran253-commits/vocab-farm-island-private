# Changes in Vocab Farm Island v0.3

- Added required **2-second non-skippable animated action** with progress display for planting, watering, tending, and fertilizing. Farming timers start at the action time so the 2 seconds count within the usual growth interval.
- Retained the working 9 crops, 10 plots, six-minute carrot growth (four 90-second intervals), spelling/POS/translation questions, 10/20/30-second retry delays, shop, harbour, daily challenges, inventory, gold, XP, badges and responsive touch controls.
- Added optional Google Apps Script runtime path. Offline `index.html` still works for testing; when hosted as the **separate student Apps Script web app**, the game can load per-student words from private Google Sheets and save account progress and history.
- Added **private teacher dashboard** files under `google-apps-script/teacher-dashboard/` (for a Sheet-bound script). The teacher can create 10 student accounts and vocab tabs, rename students, rotate four-digit PINs, and review/filter incorrect answers.
- Teacher's vocabulary tabs use exactly five columns. Student can reload words in Settings without disrupting active crop words.
- Added student PIN hashes with random salt, a six-attempt/15-minute lockout, six-hour server sessions, and a multi-device revision conflict warning. Teacher passcode is not embedded in public code.
- Added `CONNECT_GOOGLE_SHEETS.md` for safe zero-billing setup. **Actual cloud deployment remains for the teacher to authorize and verify.**
