# v0.5 validation and limitations

Tests run on supplied v0.4 files after patching v0.5:

- `node --check` passed on the student JS and private Apps Script admin JS.
- Node VM game-logic tests passed: 15 daily, 10 weekly; next daily and next Monday reset times in UTC+07; all 10 rank titles; plot expansion 15% price and 16-gold reserve; bilingual action message; weekly correct answer 5 gold and history; migration of old saved games; zoom arithmetic.
- Node VM private-sheet authentication tests passed: pre-auth history denied, wrong PIN denied, salted hash only, authenticated read permitted, fake token denied, previous token invalidated after changing PIN.
- **Browser visual test not completed**: system Chromium is configured to block all navigations, including localhost and file URLs. Responsive layout and CSS updates require visual inspection on a real browser and mobile device before classroom release.
- **Live Google deployment not tested**: Apps Script permissions, Google account authorization, Sheets quota behavior and cross-device saving must be verified in the teacher's account with dummy student data before inviting students.
- PIN is not present anywhere in the ZIP; the teacher chooses and enters it privately after installing the sidebar.
- The game economy and task answers are still calculated in the browser. Server-side validation is not robust enough for high-stakes grading or anti-cheat assessment.
- Existing saved profiles use version 2 and remain readable; weekly challenge state is initialized automatically on first load.
