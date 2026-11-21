# Progress preservation and staging test plan

1. Make a **separate test Google Sheet** with the same tab headers as production, but use artificial student IDs and fake PINs. Never put real student records in a public repository or chat.
2. In a **new** Apps Script project use the files under `apps-script-student/`. Do not paste into or redeploy the existing production script.
3. Set `STAGING_MODE=true`, `STAGING_SHEET_ID` to the new test Sheet ID, `PRODUCTION_SHEET_ID` to the *existing production* spreadsheet ID (inside private Script Properties only), and `ASSET_BASE_URL` to an HTTPS path containing the game's public `assets/` directory.
4. Check fresh login, one existing v0.13 profile, saving and reloading, Level 5 unlock, server Special Seed limit, rarity persistence, and correct handling of learning-history rows.
5. Confirm updated profiles preserve: `id`, `gold`, `level`, `xp`, `xpTotal`, `seeds`, `harvest`, `plots` (including growing crops), `history`, `sales`, `daily`, `weekly`, `orders`, and old item IDs. Newly added fields should default empty only when absent.
6. Run tests with a profile near the 49,000-character Sheets cell limit and with 2 devices saving concurrently. A conflict must stop saving and warn the student, not reset profile progress.
7. Backup the production `_Students`, `_Progress`, `_History`, every student's `Vocab_` sheet, and all Script Properties and source revisions privately before any promotion.
8. On release, update the existing deployment with a new version only after teacher approval. Keep a rollback version and previous data snapshots.
9. Never import demo accounts, level 5 shortcuts, unlimited Special Seeds, or dev reset tools into production.

## Known release blockers
- The current production spreadsheet headers and the backend deployed at the `/exec` URL have not been independently verified.
- The existing backend is not authoritative for all gold, XP, and ordinary crop transactions. Server reconciliation is required before a security-sensitive classroom launch.
- The large game uses Google Apps Script and Google Sheets quotas; server request volume must be tested.
- Preserve old item IDs; retired decorations must remain valid in saved inventory.
- Full answer history exists in `_History`, not necessarily in the newest 40 entries of the profile JSON.
