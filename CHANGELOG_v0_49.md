# Vocab Farm Island v0.49 — online account and save hardening

- The online server computes gold, XP, inventory, crop stages, challenge rewards, orders, and companions from validated player actions. Browser-submitted totals no longer control those values.
- New and reset student passcodes are six digits. Existing four-digit codes continue to work until reset. Logging out revokes the current student session.
- Save requests replay against the latest saved profile. Action IDs prevent duplicate rewards, and history writes are deduplicated on retry. A rejected save returns the student to login so the latest saved game can be loaded.
- Vocabulary reads use a short server cache. Progress reads use only needed columns, and save timing is reported to the browser console for diagnostics.
- Removed an unused online-link example file and dead source functions. The intentional offline demo and rollback assets remain available.

Tests cover forged totals, duplicate actions, challenge limits, timed watering, Special Seed transactions, history retries, passcode creation, and existing assets. Live Apps Script and Sheet performance must be measured after deployment; local tests do not measure Google's service latency.
