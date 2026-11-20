# Vocab Farm Island v0.6 — change log

- Spelling input changed to an in-word display with an explicit next-blank cursor; one letter advances one blank. Tested with `i_l_n_` and `s_l_t_o_`.
- Zoom controls moved to compact bottom-right positions; `Fit` computes a centered map when the world is smaller than the viewport.
- Player HUD shows bilingual rank: e.g., `Novice · Tay mơ`.
- Removed Settings button from the student UI and farmhouse. Student online vocabulary reload/save actions are available from **Words**.
- Teacher-only Settings panel added inside the private PIN-protected Google Sheets dashboard: CSV template, account management instructions and PIN change.
- Teacher dashboard tracks progress summary (including plots unlocked, active crops and badges), correct/incorrect/unverified attempts, selected student's vocab-sheet link.
- Server-side history handling recognizes weekly challenge entries when verifying answers.
- Online save snapshot size limited to protect the Google Sheets cell limit. Answer history remains in the separate `_History` tab. Pending event batching avoids silently dropping entries beyond the server batch limit.
- The ZIP contains a complete private installation guide; a separate public GitHub Pages ZIP contains only public assets and a simple student game landing link.

**Not yet deployed or live-tested in a real Google account.** Chromium navigation is blocked in the current sandbox, so real visual tests on phone/iPad are still required.
