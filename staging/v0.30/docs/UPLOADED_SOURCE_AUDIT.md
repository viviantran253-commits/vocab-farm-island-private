# User-exported official Apps Script source audit

The uploaded ZIP contains five functional source files, but each one was saved through macOS TextEdit as Cocoa HTML (for example, `Mã.gs.html`). The `source-recovered` directory contains UTF-8 plain-text Apps Script source recovered from those HTML wrappers. It does not contain the original spreadsheet, account passwords, PINs, or public asset folder.

## Observed project baseline (source-derived)
- `Ma.gs`: v0.13 server with `studentLogin`, `studentWords`, `studentSave`, student PIN hashing, and Google Sheets access.
- `StudentGame.html`, `GameCode.html`, `Stylesheet.html`, `MapConfig.html`: v0.13 frontend sources.
- Google Sheets tabs: `_Students`, `_Progress`, `_History`, and `Vocab_<studentId>`.
- `_Progress` row layout: student ID, revision, profile JSON, timestamp, event IDs.
- `_History` row layout: event ID, timestamp, student ID, name, source, stage, vocabulary word, submitted answer, correct answer, result, attempt number.
- Save schema version: `version: 2`; 10 planting plots.
- Existing source requires `SHEET_ID` and `ASSET_BASE_URL` script properties. It expects a public static asset host for `assets/`.

## Differences from v0.30 demo
- The old server has no companion rarity ledger, Special Seed daily purchase service, decoration stock, fence placement, or companion persistence validation.
- The new UI includes these features and several additional profile fields. The merge adds those fields only when absent, preserving older values and unknown item IDs.
- The original profile writer retains the last 40 entries in `profile.history`; full submitted answer events belong in the separate `_History` tab. Existing history records in that tab must remain intact.
- The old backend is trust-based for most gold, XP and ordinary purchases. This package does not claim cheat-proof economy or verified production readiness.

## Safety note
This is a source-aligned STAGING candidate; not a verified production deployment. It has not read a live student spreadsheet or edited the official Apps Script project. Do not replace production code until a staging test with a separate spreadsheet passes, production data is backed up, and the teacher approves promotion.

## Source completeness
The ZIP contains the student-facing web app and its server functions. No separate teacher-dashboard script was present. If the teacher dashboard is a different Apps Script project, its source should be reviewed independently before any production merge.
