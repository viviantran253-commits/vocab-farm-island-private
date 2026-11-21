# v0.30 repository integration

The `Vocab_Farm_Island_v0_30_Official_Source_Aligned_STAGING.zip` candidate is stored here without replacing the live v0.13 student app, the teacher dashboard, or the root offline demo. `source-recovered/` records the supplied v0.13 baseline; it matches the repository's student source apart from trailing newlines.

## Repository adjustments

- Moved the supplied `public-assets/assets/` to `staging/v0.30/assets/`, so a separate staging project can set `ASSET_BASE_URL` to the GitHub Pages `staging/v0.30/` directory.
- Required `PRODUCTION_SHEET_ID` in staging Script Properties before any Sheet can open. `STAGING_SHEET_ID` must differ from it.
- Rechecked the student's session after acquiring the save and Special Seed transaction locks, so a queued request is rejected if the teacher invalidated that session.
- Corrected a misleading comment in the online game code.
- Regenerated `FILE_MANIFEST.json` with sizes and SHA-256 hashes for this repository copy.

## Checks run

- `node --test staging/v0.30/tests/migration.test.cjs`: 4 passing tests for preservation of legacy progress, client migration, schema refusal, and staging Sheet separation.
- JavaScript syntax checks passed for `Server.gs`, `GameCode.html`, `RecoveryCode.html`, and `MapConfig.html` after copying to temporary `.js` files.
- All 395 images have PNG signatures; all 28 literal PNG paths in the student code exist.

These checks do not establish live Google Sheets save behavior, teacher dashboard compatibility, Apps Script quota use, or mobile browser behavior. The staging candidate has not been deployed or connected to real student data.
