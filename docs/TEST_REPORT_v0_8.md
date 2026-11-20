# Vocab Farm Island v0.8 — Spelling Regression Results

Four Chromium test configurations passed: desktop and simulated mobile for both `game.js` and `GameCode.html`.

For each configuration:
1. Typed letters in `o_g_n_s_` (organise), checking the value and focus after every key.
2. Repeated the same checks for `s_l_t_o_` (solution) and `i_l_n_` (island).
3. Checked replacing a previously entered letter, Backspace, and enabling Submit after all blanks are completed.
4. Simulated `input` events without keydown, representing virtual-keyboard behaviour.
5. Checked for uncaught JavaScript errors.

All checks passed in headless Chromium. **Not** a claim of testing every device; please verify on the specific phone/browser where the duplicate was observed. Google Apps Script was not deployed or accessed.
