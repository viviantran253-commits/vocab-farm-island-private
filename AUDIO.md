# Game audio

The approved recordings and action map are in [`assets/audio/`](assets/audio/). `action_map.json` maps game events to paths relative to that folder; `null` means the event is intentionally silent. The unverified recording from the supplied `review/` folder is excluded from the repository and public site. Source information is retained in `LICENSES.txt` and `asset_manifest.json`.

Music loops during gameplay at 25% by default. Effects start at 60%; optional harbour ambience starts off. The speaker button mutes all audio. Hold it to open Audio Settings, or use **Your Farmhouse → Audio Settings**. Music, effects, speech, and environment each have their own switch and volume slider. Preferences are stored in this browser's `localStorage`, separately from student progress in Google Sheets. Browsers may require another tap after login before starting music.

## Manual update and deployment

1. Add approved recordings under `assets/audio/music/`, `sfx/`, or `environment/`. Do not publish files under `review/`.
2. Add or change event paths in `assets/audio/action_map.json`. Keep paths relative to `assets/audio/`; use `null` for an unavailable sound. Update `asset_manifest.json` and the source records when changing recordings.
3. Run `node scripts/validate-assets.mjs` and `node --test tests/*.test.cjs`, then commit and push to GitHub `main`. GitHub Pages serves the audio files at `https://viviantran253-commits.github.io/vocab-farm-island-private/assets/audio/`.
4. For a **sound-file or action-map-only** change, reload the student game after GitHub Pages finishes publishing. No Apps Script deployment is needed.
5. For an **audio code or interface** change, update `AudioManager.html`, `GameCode.html`, `StudentGame.html`, and `Stylesheet.html` in the existing **Vocab Farm Student Game** Apps Script project as needed. Create a new version under **Deploy → Manage deployments → Edit**, select that version, and deploy to the existing web app URL. Keep **Execute as me** and **Anyone** access. Do not create a new web app deployment or change the private teacher Sheet.
6. Test in Chrome and Safari using the private Teacher Test profile: start the game with a user gesture, toggle mute, adjust each setting, answer a question, buy a seed, and confirm that the sound follows a successful save. Check that failed or rejected actions play no success sound. On mobile, tap the speaker and long press for settings.

Existing student data and PINs are unaffected. Audio preferences are local to each browser and device.
