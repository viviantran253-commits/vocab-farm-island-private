# v0.30 official classroom release

The student game adds companions, Special Seeds, fences, decoration packs, and the expanded v0.30 artwork. The existing public web app URL and private teacher Sheet remain in use. The server reads its existing `SHEET_ID` property and serves images from the public `staging/v0.30/assets/` directory without changing Script Properties.

Existing v0.13 student profiles are migrated additively on login. Gold, level, XP, plots, crops, seeds, orders, answer history, and unknown legacy item IDs are retained. New fields default to empty. Server save revisions still reject conflicting writes. The teacher's reset control also archives and clears that student's Special Seed ledger.

Before deployment, the private Sheet was copied to a separate private backup. The previous Apps Script deployment version remains available for rollback. Local checks: seven migration and reset tests passed, and all updated JavaScript files passed syntax checks. A real student login and save require a private student PIN and must be checked in the live app after publication.
