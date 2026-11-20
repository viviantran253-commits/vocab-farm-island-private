# Vocab Farm Island v0.7 — Test Report

## Automated UI logic checks
- Desktop Chromium: `solution` (`s_l_t_o_`) filled using `o → u → i → n` without additional clicks.
- Desktop Chromium: `island` (`i_l_n_`) filled using `s → a → d` and Backspace/editing worked.
- Replacing an earlier missing letter advances to the next blank, preserving other entries.
- Submit is enabled only after all missing letters are filled.
- Mobile-emulation Chromium: native `input` events filled `solution` in order; submit enabled.
- Plot 3 shows the Vietnamese 15% pricing rule, 100-gold minimum, and required 16-gold reserve.
- No uncaught JavaScript errors in these tests.

## Limitations
- Direct browser navigation was blocked by the sandbox administrator. For tests the HTML, CSS and scripts were loaded in the Chromium browser directly (UI logic worked); linked artwork could not be loaded for these previews.
- The test mobile viewport simulates a phone but is **not** a physical iPad or phone.
- Live Google Apps Script / Google Sheets deployment was not modified or tested.

## Manual test after downloading
1. Extract the ZIP and open `vocab-farm-island/index.html`.
2. Select Student 01 and enter demo PIN 0001.
3. Reach a harvest spelling task; tap the first underscore and type consecutive letters.
4. Verify that every letter appears and focus advances without additional clicks.
5. Open locked Plot 3 and review the bilingual price explanation.
6. If using the online game, update the student app code and deploy a new Apps Script version first.
