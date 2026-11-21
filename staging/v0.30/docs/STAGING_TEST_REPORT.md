# Static review results

- PASS: JS syntax: apps-script-student/Server.gs
- PASS: JS syntax: apps-script-student/GameCode.html
- PASS: JS syntax: apps-script-student/RecoveryCode.html
- PASS: JS syntax: apps-script-student/MapConfig.html
- PASS: JS syntax: source-recovered/Ma.gs
- PASS: JS syntax: source-recovered/GameCode.html
- PASS: JS syntax: source-recovered/MapConfig.html
- PASS: Preserves source word POS variants
- PASS: Additive online migration in client
- PASS: Staging sheet access guard
- PASS: Server Special Seed purchase/reveal methods
- PASS: No hardcoded configured spreadsheet ID
- PASS: No offline developer defaults in online runtime

These checks are **static and syntax-only**. No real Google Apps Script deployment, login, backup, student spreadsheet save, or mobile Safari test has been performed.

## Synthetic legacy account migration test (Node.js)

24/24 checks passed using a **fictional** v0.13 student profile. Verified preservation of gold, level, current and total XP, seeds (including an unknown legacy seed ID), harvested crops, existing plots and growing crop, orders, answer history, sales, badges, daily/weekly progress, and coordinates. Also verified adding missing companion/decor fields, rejecting wrong student IDs and future schemas, and profile validation.

This is a unit test of migration logic, **not** a live Google Sheets write/read test.
