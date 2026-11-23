# Vocab Farm Island v0.43 — teacher test profile

- Added a separate teacher test account (ID 11) that the teacher creates from the PIN-protected private dashboard. The dashboard displays its generated four-digit passcode once and creates `Vocab_11` with sample words.
- Added authenticated online test controls for profile 11: gold, level, Special Seeds, fences, plots, growth time, and making growing plots ready. The server checks the active session and rejects all student IDs.
- Kept the ten student accounts, their vocabulary tabs, progress, and challenge rules unchanged. Test controls write only profile 11's `_Progress` row.
- The same student web app link is used; its static artwork remains under `staging/v0.42/assets/`.
