# v0.13 — No recurring plot fees

- Removed the daily plot-charge logic entirely from offline and online game code.
- Removed related UI labels in Inventory, Farmhouse and locked-plot panels.
- Preserved level requirements and fixed one-time unlock prices for plots 3–10.
- Preserved existing player profiles. Obsolete `landTax` records are discarded safely without changing gold, crops or progress.
- Updated Apps Script profile creation and saving to exclude obsolete fields.
- Teacher account data and vocabulary sheets are unchanged.

**Deployment:** If your online web app is already deployed, update `GameCode.html` and `Server.gs`, then publish a new Apps Script deployment version. This ZIP does not deploy anything automatically.
