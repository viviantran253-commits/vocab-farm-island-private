# Manage companions through GitHub

The live student game reads [`assets/companions/registry.json`](assets/companions/registry.json) from GitHub Pages. Companion image and catalog changes do **not** require an Apps Script redeployment. Publishing on GitHub Pages and the server's one-minute catalog cache can delay visibility briefly; reload the game and sign in again to load a changed catalog.

## Add a companion

1. Choose a permanent ID using lowercase letters, numbers, and underscores, starting with a letter (for example `new_friend`). **Never reuse an ID** that belonged to a different companion: saved student pets refer to IDs.
2. In `assets/companions/<id>/`, upload these 12 transparent PNG files:

   ```text
   growth/01_newborn.png       idle/idle_down.png     sheets/walk_down.png
   growth/02_baby.png          idle/idle_up.png       sheets/walk_up.png
   growth/03_young.png         idle/idle_left.png     sheets/walk_left.png
   growth/04_final.png         idle/idle_right.png    sheets/walk_right.png
   ```

   Each growth and idle image is square, either 128×128 or 64×64 pixels. Each walk sheet has four square frames in one horizontal row, so 128-pixel art makes a 512×128 sheet. Use matching frame sizes within one companion.
3. Add an entry to the `characters` array in `registry.json`. Example:

   ```json
   {
     "id": "new_friend",
     "name": "New Friend",
     "enabled": true,
     "portrait": false,
     "phrases": [{"en": "Let's grow together!", "vi": "Cùng nhau trưởng thành nhé!"}]
   }
   ```

   `portrait: false` uses `idle_down.png` in the collection. For custom portraits, set it to `true` and also upload `assets/companion-ui/portraits/<id>_portrait_128.png` and `<id>_silhouette_128.png`.
4. Change `assetVersion` to a new short value, such as `2026-11-26-1`. This refreshes cached images, particularly when replacing art at an existing path.
5. Commit the files to the GitHub repository's `main` branch. If working locally, run `node scripts/validate-assets.mjs` before pushing. Wait for GitHub Pages to publish, then reload and sign in to the student game. The [public registry](https://viviantran253-commits.github.io/vocab-farm-island-private/assets/companions/registry.json) should show your new entry.

## Replace, hide, or retire

- To replace art, overwrite the relevant files under the **same ID**, increment `assetVersion`, and commit.
- To hide a companion from future Special Seeds, set `enabled` to `false` and increment `assetVersion`. Keep its registry entry and images so existing students' pets remain visible.
- To change its displayed name or phrases, edit the registry entry, increment `assetVersion`, and commit.

The registry allows up to 100 entries. It contains public game artwork and phrases only; never put student data, passcodes, Sheet IDs, or Google credentials in it.
