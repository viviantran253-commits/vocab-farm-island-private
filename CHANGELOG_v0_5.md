# Vocab Farm Island v0.5

- New Vietnam-time daily reset (00:00) and weekly reset (Monday 00:00), with live countdowns in Tasks.
- First real weekly challenge: 10 English → Vietnamese questions, one attempt each, 5 gold per correct; 7 correct earn weekly badge.
- Ten farmer rank names, five levels per title through level 50, infinite levels thereafter.
- Plot expansions cost the greater of a fixed minimum or 15% of current gold; expansion cannot leave the player with fewer than two carrot-seed prices (16 gold). Existing purchased plots remain unlocked.
- Zoom In, Zoom Out, Fit Map controls on desktop and mobile; mouse wheel zoom on desktop.
- All farming action-ready labels include short Vietnamese translations.
- Private teacher Google Sheets dashboard now requires a six-digit PIN after Google account access; PIN is configured privately, hashed and never placed into public JS, assets or GitHub.

**Data migration:** Save format stays version 2. Existing offline save slots remain readable. Weekly state initializes on first login.
**Online:** Re-deploy Student Apps Script with new StudentGame, GameCode, and Stylesheet files after testing; update Admin.gs and TeacherDashboard.html in the private Google Sheet to enable the PIN.
