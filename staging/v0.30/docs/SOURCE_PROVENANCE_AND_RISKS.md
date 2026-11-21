# Source provenance and migration issues

| Source | Used for | Limitation |
|---|---|---|
| Archived v0.30 Developer Test ZIP | UI, newest assets, inventory, companions, decoration packs, 8-second vocabulary read-and-close window | Explicitly offline; Developer Test privileges removed/disabled in staging adapter |
| Archived v0.17 Online Integrity Test ZIP | `Server.gs` functions for login, `_Progress`, `_History`, `studentSpecialBuy`, `studentSpecialReveal` | Not verified to match current production. Existing server is not fully cheat-resistant |
| User's /exec URL | Confirmed deployed web app exists | Does not expose editable source or private Google Sheet schema |

### Migration warnings
- `_Students` account rows, names, and credential-version fields must not be replaced.
- `_Progress` uses a revision number and v2 profile JSON. Do not modify live records until current schema is inspected and a full backup exists.
- `_History` is intended to retain all answer events. Check current live columns and idempotency before migrating.
- The server's old 49,000-char profile limit must be evaluated against real v0.30 profiles; `_History` must not be collapsed into the profile cell.
- Retired catalog IDs must remain recognized in student inventories.
- Online economy writes beyond Special Seed transactions remain trust-based in the archived backend; server-side enforcement is needed for a secure official version.
- No on-disk demo state or Level-5 privileges should ever be copied into student production data.

### Minimum acceptance checks before production
1. Back up private `_Students`, `_Progress`, `_History` and vocabulary tabs in a separately access-controlled location.
2. Compare current live server functions and sheet columns to this archived template (diff, never blind replace).
3. Test with copies of at least three existing student profiles at different levels, including rare companions, decorations, and planted Special Seeds.
4. Verify current gold, XP, 10 plots, purchased seeds, original crop timers, companion positions, rarity, 1/day limit, and answer history survive across reload and update.
5. Simulate two concurrent clients for revision-conflict detection.
6. Confirm teacher dashboard still reads full answers correctly; never weaken student login or expose teacher actions to students.
7. Verify iPhone Safari login, input controls, voice/IPA, and save status using the actual staging `/exec` deployment.
8. Run basic quota and performance checks with the intended class size.
