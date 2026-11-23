# Vocab Farm Island v0.42 — Full Game + Mixed-Resolution Companion Update

This bundle is based directly on the user-provided complete v0.41 archive. It includes the **full offline game**, **undeployed Apps Script staging source and public assets**, original character handoff archives, and updated QA reports.

## Where to find the game
- **Offline demo:** `01_Offline_Game/vocab-farm-island/index.html` (open locally for a development demo; does not share data across student devices).
- **Apps Script staging source:** `02_Apps_Script_Staging/official-apps-script-staging/` (not deployed automatically).
- **Original v0.41 completed asset handoffs:** `03_HD_Character_Handoffs/` (preserved as historical reference, not substituted for newly supplied sprites).
- **Validation:** `04_QA/VALIDATION_SUMMARY.json`, `04_QA/CHARACTER_SPRITE_INVENTORY.csv`, `04_QA/FILE_SHA256.csv`.

## v0.42 update
Replaced the companion PNG files for five characters in **both** offline and Apps Script staging assets: Asuna Yuuki, Itadori Yuji, Krixi, Rouie and Saitama (12 PNG assets per character in each tree; 120 overwritten files total).

The input also supplied complete sets for Frieren, Kamado Tanjiro, Pikachu, and Sakura Kinomoto. Their PNGs matched v0.41 byte-for-byte, so those files were left unchanged.

Exactly 22 companions remain (264 PNGs in each environment, 528 total). Supported source sprite sizes are 64×64/128×128 for idle and growth, and 256×64/512×128 for four-frame walking sheets. The existing rendering code dynamically detects sprite resolution, normalizing to a 64×64 game-world display size.

**All other original functional game files are preserved unchanged.** No source code, live student data, Apps Script credentials or live services were changed.

## Important deployment note
This **full archive itself is not a public-web upload folder**. It contains both an offline demo and backend/staging source materials. For web deployment, follow the original deployment documentation and publish only the appropriate public assets. Do not publish private Google Sheets information, teacher secrets, student records or Apps Script server files in a public repository.

No live deployment or full real-device gameplay verification was performed for v0.42. Run browser and Apps Script checks before replacing any live class deployment.
