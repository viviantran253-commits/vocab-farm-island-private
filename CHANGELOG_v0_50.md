# v0.50 — root assets and dynamic companions

- Published all official game images from root `assets/`; removed the old `staging` copies, offline prototype, duplicate and unused images, and obsolete prototype reports. The active asset validator reports 445 required files and zero unused files.
- Added a validated public companion registry and a server fetch with a one-minute cache. New and replacement companions can be published through GitHub without editing or redeploying Apps Script. The previous 22 companions remain as a safe fallback if the GitHub fetch fails.
- Upgraded 17 companion sprite sets to the supplied 128×128 artwork. Five sets still use their available 64×64 artwork until new images are supplied.
- Kept the existing student game URL, teacher Sheet integration, account data, and deployed security rules. Added a read-only `?health=companions` check.
- Rollback: Git tag `rollback-before-dynamic-companions-2026-11-25` and student Apps Script version 20. Restore both the GitHub assets and Apps Script version together.
