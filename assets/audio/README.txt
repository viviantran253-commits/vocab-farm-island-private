VOCAB FARM ISLAND — GAME AUDIO PACK

Copy this audio/ folder into assets/ so the project has assets/audio/.
Use action_map.json as the event-to-file map. Paths are relative to assets/audio/; null means no playback. The game should skip null or failed audio without blocking any action. action_map.csv gives the status and original source per event; asset_manifest.json provides provenance, codec, duration and hashes for every included recording.

52 uploaded audio entries -> 40 unique recordings (12 exact duplicates removed).
39 production recordings: 1 music track and 38 other sounds. 1 additional recording kept under review/.
50 of 51 sound-effect assignments are mapped, plus background music. mute_audio is intentionally silent. give_milk is unmapped because the selected Gentle Sipping filename is absent. The unidentified companion recording in review/ may be the intended download but its name and metadata do not confirm that; audition it before assigning it. If it is correct, move it to sfx/give_milk.wav and update the action map. Do not deploy review/ to the public asset host until approved.

Flowerbed Fields was converted from the uploaded 32-bit float WAV to 160 kbps stereo MP3 for smaller size and broad browser support. No cuts, fades or volume changes were applied. The other recordings retain their uploaded WAV or MP3 encoding. Loop transitions must be tested in the game, particularly Safari; MP3 playback through different engines may introduce a gap. Harbour ambience remains WAV and is optional. Do not change file extensions without actual conversion.

Suggested integration: default music 25%, sound effects 60%, optional environment off (10% when enabled); bottom-right speaker button, global mute and independently saved preferences. Use the existing project audio/asset URL helper, and prefix all non-null map entries with the actual audio asset base URL. Play action success sounds only after server confirmation. No actual game code was modified.

Validation: all 40 exported files decoded to completion using FFmpeg. Duplicate removal was based on SHA-256 of uploaded bytes. Action map paths checked for existence. Browser playback, subjective sound identity and game integration not tested. Source-declared license information is preserved; review before distribution.
