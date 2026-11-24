# Vocab Farm Island v0.48 — game audit

- Removed the top Words menu, Farmhouse Companions button, Fit/Follow controls, and duplicate plot status text. Answer history remains in Your Farmhouse; companions remain in Collection. Direct map tap interaction remains the primary control.
- Camera follows the farmer automatically after a short manual pan. Zoom controls recenter on the farmer.
- Replaced broad island polygons with an 8-pixel walk mask derived from the map artwork. Swept movement and companion path checks prevent steps across water gaps. Existing saves with positions off the new walkable map return safely to land on login.
- Added phrase, phrasal verb, idiom, collocation, mixed noun/verb, and conjunction labels to vocabulary cards and questions. `focus on` displays as a verb phrase while retaining its old word ID and history. New categories can be entered in vocabulary column C.
- Adjusted Vietnamese labels including Planting → Đang trồng and Novice → Người mới.
- Deferred loading of unused crop and companion artwork. Local browser emulation loaded 18 images at login, with no console errors or horizontal overflow at 320, 390, and 1280 pixels.
- Fixed online inventory/history headings that incorrectly described browser-local storage.

Checks: 18 automated tests pass. Local Chrome emulation checked the layouts and water/bridge route samples. The private teacher workbook was inspected in Chrome: all 962 populated rows were replayed through the parser with zero skipped rows, and phrase classifications were corrected in the Sheet. The automated scan found no blank required fields or duplicate English/category pairs. A full human linguistic review of every translation was outside this pass. Real mobile devices were not tested.
