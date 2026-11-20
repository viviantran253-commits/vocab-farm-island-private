# v0.4 changes — November 20, 2026

1. Added a user-clickable 🔊 button beside the word in the vocabulary result card, using Web Speech API with `en-GB` and a UK voice preference. No external TTS API or billing.
2. Added 240 ms move-in and 300 ms move-out transitions for all five plant interactions, with 2,000 ms work animation on top of the plot. No changes to stored level, gold, XP or student IDs.
3. Shifted crops upward by 22 world pixels, keeping the fixed 64×64 sprites and the common root anchor consistent for each crop's five stages.
4. Rewrote the spelling field to use explicit slot position rather than the browser's shifted text caret. Verified `s_l_t_o_` → `solution` letter by letter.
5. Removed the old map controls sentence.
6. Added a teacher dashboard entry to the start screen: opens a private Google Sheets launch panel, not a publicly accessible teacher dashboard; no PIN is embedded.
7. Synchronized edits into the Google Apps Script `StudentGame.html`, `Stylesheet.html` and `GameCode.html` templates.

## Important limitations
- **TTS accent:** The browser must offer an en-GB voice to guarantee a British-sounding voice. When unavailable, the game requests en-GB but the device may fall back to another accent. It warns the player.
- **Backend not deployed:** The teacher dashboard requires the teacher's private bound Apps Script and Google Sheet installation. The new launcher is only a shortcut and instructions, not a public administrative login.
- **Browser rendering tested:** Desktop and simulated mobile tests passed; real Safari/iPad, Android and live Apps Script deployments have not been tested.
