# Vocab Farm Island v0.8 — Duplicate-Letter Fix

## Problem
In the missing-letter activity (e.g., `o_g_n_s_` for **organise**), typing one letter could enter that same letter into two consecutive blanks on some devices.

## Cause and correction
The previous code had **two competing paths** to accept printable letters: `keydown` and the browser's native `input` event. Some keyboard/browser combinations generated both, which could duplicate a character when focus advanced to the next blank.

**Correction:** only the native `input` event inserts printable letters. The `keydown` listener is retained exclusively for Backspace, Delete, arrow keys, and Enter. In-progress IME composition events are ignored to avoid premature advancement. This was applied to both `game.js` and `google-apps-script/student-app/GameCode.html`.

## Tested
- `o_g_n_s_` + `r → a → i → e` = **organise**; exactly one character added per keystroke
- `s_l_t_o_` + `o → u → i → n` = **solution**
- `i_l_n_` + `s → a → d` = **island**
- Editing an earlier blank, Backspace, focus progression, submit availability, and simulated virtual-keyboard input
- Both the offline and Google Apps Script game JavaScript in headless Chromium, desktop and simulated mobile viewports
- Browser had to load test HTML in memory because file navigation was blocked. Physical phone/iPad and live deployed Apps Script tests are still required.

## Installation
- Offline: replace your existing game files with this package's `vocab-farm-island/` folder. Back up the old folder first.
- Online: replace only the student Apps Script project's `GameCode.html`, then **Deploy → Manage deployments → Edit → New version → Deploy**. Reload the game's `/exec` URL. No Google Sheet changes or billing are required.
