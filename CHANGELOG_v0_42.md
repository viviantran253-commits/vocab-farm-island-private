# Vocab Farm Island v0.42

- Integrated the full v0.42 student game candidate with the existing classroom login, private Sheet, and Apps Script deployment.
- Added 10 more companions (22 total), updated five companion sprite sets, and added the latest companion movement, collection, camera, and challenge UI changes.
- Improved mobile HUD and menu readability, map panning, and the Follow button.
- Shortened crop timers and removed the one Special Seed per day limit. Purchases still require Level 5, 300 gold each, and server confirmation.
- Preserved student IDs, PINs, saved progress, vocabulary, answer history, and the teacher reset workflow. New save fields are migrated additively.
- Public artwork lives under `staging/v0.42/assets/`; the Apps Script source uses the existing private `SHEET_ID` property and its existing web app deployment.

The supplied staging server's test Sheet guard and raw HTML include helper were not copied into production. The previous production version remains available for rollback in Apps Script.
