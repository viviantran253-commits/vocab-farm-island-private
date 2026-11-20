# v0.13 Verification — Removed Recurring Plot Charges

## Changes checked

- No gameplay code computes or collects recurring plot charges.
- Locked-plot panel contains only **Locked 🔒**, its one-time gold price, and its required level, plus the existing action buttons.
- Inventory and Farmhouse no longer display recurring charges.
- Older save metadata (`landTax`) is discarded without changing gold or unlocked plots.
- New offline and Google Apps Script profiles do not include the obsolete field.
- Offline game and the embedded Apps Script copy have identical JavaScript.
- Plot unlock progression and fixed price sequence are unchanged (Plots 3–10: Levels 2/4/6/8/10/12/15/20; Prices 100/200/300/400/500/600/700/800 gold).
- Daily and weekly challenge date resets are unchanged.

## Tests performed

- Node.js syntax: **passed** for offline JavaScript, Apps Script game JavaScript, and server code.
- Isolated actual-game-function tests: **passed** for older saved-profile cleanup, daily/weekly resets, zero recurring deduction, one-time Plot 3 and Plot 4 purchases, and level gates.
- Archive and asset checks: **passed** for the expected game assets and source files.

## Not tested

- Live browser visual navigation: attempted but blocked by the environment (`ERR_BLOCKED_BY_ADMINISTRATOR` for both local file and local HTTP server).
- Live deployed Google Apps Script and Google Sheets integration: requires your own deployment and authorization.
- Physical-phone and iPad testing.

This is a code-level update. It does not contact or change any Google account, private Sheet, student record or billing setting.
