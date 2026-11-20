# Vocab Farm Island — image audit

Audit basis: the actual accessible PNG files from the prior Vocab Farm Island asset folders (not merely their filenames).

## Result
- 13/13 automated checks passed.
- 208 PNG/JPG assets and references were copied or generated in the organized folder, including source masters and previews.
- 0 missing source files in the curated archive.
- **No animal assets or barn are included**. The legacy feeding sprite is intentionally excluded.
- All active girl sprite sheets are **256x64**, four frames of **64x64**. Their lower foot-anchor bound is at y=59.
- **45 crop sprites**, each **64x64**, with consistent alpha-object bottom bound at y=56, plus **nine 320x64 growth sheets**.
- Base world map is **2048x1280** (64x40 at 32px per tile); house/shop are **288x288**, harbour **288x320** and the two tree props vary by silhouette.
- The original locked plot was 128x128 while the four plot states were 108x88. A normalized **108x88 plot_locked.png** was made WITHOUT changing the source original, which is preserved under `source_masters/plots`.
- The source `map_layout.json` contained a deprecated `animal_care_area` pasture zone and animal care notes. The organized copy removes these, and references the current asset paths.
- Seven foreground tree overlays are **pixel-exact** against the source base map in the visible pixels at their recorded coordinates; dynamic z-order and collisions still need playtesting.

## Checks
- PASS — Map size and grid: Map is 2048x1280 and 32px-tile world is 64x40.
- PASS — All 10 active girl sheets: 10 sprite sheets (feeding removed), each 4 x 64x64.
- PASS — Player foot anchor: Foot-bound lower edge values: [59].
- PASS — 45 crop stages: Nine crops x five stages; each 64x64.
- PASS — Crop root anchor: All alpha-bbox bottom edges: [56].
- PASS — Nine growth sheets: 9 sheets, each 320x64.
- PASS — All 5 plot states aligned: Five plot states now 108x88.
- PASS — Seed, harvest, coin and XP icons: All shop/inventory/HUD icons standardized by size variant.
- PASS — Map references point to existing files: All building and background file paths resolve.
- PASS — No deprecated animal zone: Removed old pasture zone.
- PASS — 10 planting plots: 5x2 grid; 2 start unlocked, 8 unlockable.
- PASS — 7 overlays match map pixels: Color match fractions for visible pixels: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]. These do not prove occlusion gameplay correctness.
- PASS — All necessary PNGs have no missing source: Unavailable source paths: 0.

## Important caveats / remaining tasks

**Dimensions can appropriately differ between asset categories.** The building art, plot art, portrait, interface borders and icon variants are designed for different placements. A camera scale is not the same as resizing the source files.

1. **Pixel-density/style review recommended:** the 128px girl portrait and some UI/achievement art are more detailed than the very low-pixel walking sprites. No numerical size error; a visual choice for later in-game testing.
2. **Harbour frame:** its center is opaque parchment, NOT a transparent opening. Overlay HTML text/order rows on top of it; the shop decorative frame has a transparent center.
3. **Map trees:** trees are baked into the terrain image; optional foreground canopies duplicate the same pixels and must be drawn conditionally over the character when appropriate, not simply kept as an always-on blocking object.
4. **Collision** polygons, bridge walkability, building door interaction range, plot accessibility, and mobile zoom are design data and still need testing in an actual HTML prototype.
5. **Responsive UI:** login fields, HUD, order cards, Buy buttons, question forms, timers, and teacher dashboard must be HTML/CSS; they are intentionally not bundled as flat screenshots.
6. **Audio, music, tile-based terrain source, separately movable bridge, real-time multiplayer sprites, and backend/teacher code:** not included and not essential to the first graphics-only prototype. The bridge is baked into the approved background.
7. **Teacher records and online saving:** Google Apps Script/Google Sheets setup has not been performed. No credentials, billing or payment service used.

## Deliberately retired files

- Barn, animal-specific sprites, animal products, animal pasture, and `girl_feed.png` (not copied to active assets).

## Preservation

Sources in `/mnt/data` were not overwritten or modified. This is a new organized copy. The original, larger-resolution 9 seed packets, 9 harvested crop items, original badges/icons and original locked plot are retained in `source_masters` to allow future re-export.
