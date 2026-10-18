# Live Fleet Board Final Submission Checklist

Updated: 2026-10-18. The current automated checks passed; the final video and transcript source gap still need attention.

## Submission requirements

| Requirement | State | Evidence or action |
|---|---|---|
| Working source and scripts | DONE | Server, React client, tests, simulator, and scripts are in the repository. |
| README prerequisites, one startup command, and test/load-test command | DONE | README lists Node 22.19+ LTS, npm start, npm test, and npm run load-test. A historical clean-clone check started both services. |
| Browser interface and all components started together | DONE | User browser checks confirmed the dashboard; the clean-clone check verified the README startup command and HTTP 200. |
| Page-side automatic burst | DONE (user-supplied evidence) | In the user's 7:32 demo recording, at about 1:40 the dashboard showed BURST while the button still read “No burst request yet”; the server log said the first burst was scheduled 45,000 ms after the first client connected. |
| Disconnected age and red STALE badges | DONE (user-supplied evidence) | Screenshots with the server stopped show disconnected status, incoming rate 0, increasing ages from about 53,403 ms to 142,719 ms, and red STALE badges on every row. |
| Load generator and documented command | DONE | npm run load-test passed this pass with 30 buses, three bursts, freshness, stale rejection, memory, sequence convergence, and automatic timing checks. |
| DECISIONS.md | DONE | Includes the required choices, costs, alternatives, trade-off, assumptions, stack, 10x prediction, omissions, next steps, and 15-hour total. |
| 5–10 minute video covering the four questions | MINE-TO-DO | The user reports a recording exists and is being edited. No MP4 was found in the project. Finish editing/export, verify duration and audible narration, and deliver it. |
| AI transcript exports used during development | DONE | Three real Codex exports and two setup notes are present; no newer project session logs were found. |
| Separate planning-assistant transcript cited in the AI log | MISSING | docs/ai-transcript/planning-chat.md is absent. Add the original conversation if it is required; do not reconstruct it. |

## Browser evidence already recorded

The user's 2026-10-17 Chrome check recorded the Step 11 button states and normal/burst behavior. With the server stopped, the button displayed exactly “Burst request failed: Server returned HTTP 502.” Separately, WebSocket status was disconnected and incoming rate fell to 0. After restart, WebSocket reconnected, the button worked again, and the feed returned to normal after the burst. The shutdown terminal also showed repeated WebSocket send error: write ECANCELED messages during connection teardown, then SIGINT received; shutting down and server stopped. This is recorded output, not a claim of error-free shutdown or a proven functional defect.

Additional user-supplied evidence (screenshots and a screen recording) closes two browser-check gaps. In the user's 7:32 demo recording, at about 1:40 the dashboard showed Feed state BURST, incoming about 2,967 updates/sec, React commits 66/sec, rAF 75/sec, current max staleness 56 ms, and 10-second peak 529 ms. The button still read “No burst request yet,” so this burst began automatically without a button press; the server log showed the first automatic burst scheduled 45,000 ms after the first client connected. Separate disconnected-state screenshots show the header as disconnected, incoming updates/sec at 0, ages growing through about 53,403 ms, 62,667 ms, 75,745 ms, 131,630 ms, and 142,719 ms, and a red STALE badge on every row. These are user-supplied observations, not independently inspected by Codex in this task.

## Remaining manual actions

- [ ] Finish editing/exporting the recorded video; verify it is 5–10 minutes, audible, and answers all four questions.
- [ ] In the final video, include the existing user-supplied automatic-burst recording, normal traffic, a button-triggered burst, the injected out-of-order log line, the stale counter, and live panel values.
- [ ] Include the user-supplied disconnected-state screenshots showing incoming rate 0 and red STALE badges; optionally repeat the check while recording the final video.
- [ ] Add docs/ai-transcript/planning-chat.md from the original conversation if required; do not reconstruct it.
- [ ] Upload the final video and any required source archive, then confirm the evaluator can access them.

## Repository notes

- Latest npm test, client build, and load test results are in docs/TEST_RESULTS.md.
- The source archive is submission/live-fleet-board-code.zip. It contains tracked source at the final commit and excludes dependencies, build output, video, and PROJECT_CONTEXT.md.pdf.
- The video and ZIP are ignored by Git and are not part of the source commit.
