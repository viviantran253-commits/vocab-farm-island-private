# Vocab Farm Island v0.30 — SOURCE-ALIGNED OFFICIAL STAGING PACKAGE

**DO NOT DEPLOY THIS ON THE LIVE PROJECT.** This package is a staging integration prepared from the user-uploaded official source files, not a production upgrade.

## What changed since the previous staging candidate
- Extracted and preserved all five actual user-uploaded v0.13 source files from their TextEdit HTML wrappers, under `source-recovered/`.
- Replaced archived candidate account/login and vocabulary-parsing routines with exact routines from the exported `Ma.gs` source, including handling of `phr.v`, `phr`, and `n/v`.
- Added missing companion, fence, and decoration fields through **additive migration**; never reset an old profile automatically.
- Applied the same migration to the client upon online login (the previous staging version skipped it).
- Retained staging-only server access safeguards and the Magic Seed server API in the candidate.
- Kept original account IDs, student PIN checks, `_Students`, `_Progress`, `_History`, and `Vocab_` sheet conventions.
- Did not add public credentials, paid databases, or change the official deployment.

## Folder structure
- `source-recovered/`: clean copies of the five supplied official files (reference only).
- `apps-script-student/`: Apps Script web app staging candidate (new project only).
- `public-assets/assets/`: image and UI assets referenced by the frontend (static HTTPS host).
- `docs/`: source audit, migration plan, file manifest, and test report.

## Current status
A candidate for testing in a separate Apps Script project with **fake student accounts and a separate private test Sheet**. This has not been connected to the real official deployment. No real student data or student passwords are included.

In this repository the public images live under `staging/v0.30/assets/`. For a separate staging Apps Script deployment, set `ASSET_BASE_URL` to `https://viviantran253-commits.github.io/vocab-farm-island-private/staging/v0.30/` after GitHub Pages publishes these files. The staging backend also requires `PRODUCTION_SHEET_ID`; it refuses to open any spreadsheet until that property is set and differs from `STAGING_SHEET_ID`. Keep both IDs in private Script Properties.

The repository copy adds a session recheck inside each save or Special Seed transaction lock. This helps reject actions queued before a teacher changes a student's PIN or resets progress. It does not replace the separate staging tests described below.

Read `docs/UPLOADED_SOURCE_AUDIT.md`, `docs/DATA_MIGRATION_PLAN.md`, and `docs/STAGING_TEST_REPORT.md` before using.
See `docs/REPOSITORY_INTEGRATION.md` for the adjustments and checks made when adding this package to the repository.
