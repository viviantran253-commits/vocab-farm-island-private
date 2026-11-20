# Changes in Vocab Farm Island v0.2

## Learning screens
- POS: `Loại từ của “knowledge”:`; English target word bold, answers Vietnamese.
- English → Vietnamese: `“generous” nghĩa là:`.
- Vietnamese → English: `“hào phóng” tiếng Anh gọi là:`.
- Spelling: `Điền vào chữ cái còn thiếu: hào phóng (adj).` with one inline word and underscores.
- Four option buttons (where applicable), one Submit button, X close. Choices remain editable until Submit.
- Removed long English helper paragraphs and overlong eyebrow headings.
- Enlarged question fonts, answer buttons, and vocabulary feedback. Tuned mobile spacing.

## Bug fixes
- Spelling inputs previously processed one character from both `keydown` and `beforeinput`. They now use one insertion path. Tested `g_n_r_u_` → `generous` one character at a time, including Backspace.
- Incorrect daily answers now display a red `× Incorrect · 0 gold`; the correct vocabulary entry is revealed without a green success tick.
- Shop gold uses the actual yellow coin icon (`assets/items/currency/64/gold_coin.png`).
- Home and shop signs point at doors; Harbour points at the dock instead of the inland path.

## Scope and limitations
- Offline demo profiles, local browser saves, and sample vocabulary are unchanged.
- Google Sheets, Apps Script, real authentication, private teacher dashboard, and cross-device saves are NOT included.
- No new payment method, billable backend, API key, or password is required.
- Automated UI checks run with local embedded assets; test the extracted game on physical devices before classroom use.
