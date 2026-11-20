# Browser checks — v0.4

Automated Chromium desktop and simulated mobile tests completed using the actual v0.4 HTML, CSS, JS and image data embedded in a local test page (direct navigation to local filesystem / localhost was restricted in this testing environment).

- ✓ Student login and login-screen Teacher dashboard launch control
- ✓ Teacher instructions do not reveal a password or an unrestricted admin URL
- ✓ Old movement tip removed
- ✓ Plant: player enters plot, spends 2 seconds on it and exits
- ✓ Water, tend, fertilize: each begins on plot and ends on adjacent path after two-second animation
- ✓ Harvest: same timing/position as other farm actions, followed by feedback
- ✓ Word card displays speaker action and click produces no JavaScript exception
- ✓ Spelling: `s_l_t_o_` fills `o`, `u`, `i`, `n` sequentially and cursor moves to each immediate next blank
- ✓ Mobile viewport renders without horizontal scrolling, teacher access button appears
- ✓ Daily quiz still opens with four answers
- ✓ No browser JavaScript exceptions in checked flows

Not tested in a real student's Google Apps Script deployment, with a physical phone/iPad, or with every operating-system speech voice. Pronunciation fidelity depends on the available device voice.
