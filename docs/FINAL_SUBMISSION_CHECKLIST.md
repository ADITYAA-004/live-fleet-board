# Live Fleet Board Final Submission Checklist

Updated: 2026-10-18. The current automated checks passed; the final video and transcript source gap still need attention.

## Submission requirements

| Requirement | State | Evidence or action |
|---|---|---|
| Working source and scripts | DONE | Server, React client, tests, simulator, and scripts are in the repository. |
| README prerequisites, one startup command, and test/load-test command | DONE | README lists Node 22.19+ LTS, npm start, npm test, and npm run load-test. A historical clean-clone check started both services. |
| Browser interface and all components started together | DONE | User browser checks confirmed the dashboard; the clean-clone check verified the README startup command and HTTP 200. |
| Load generator and documented command | DONE | npm run load-test passed this pass with 30 buses, three bursts, freshness, stale rejection, memory, sequence convergence, and automatic timing checks. |
| DECISIONS.md | DONE | Includes the required choices, costs, alternatives, trade-off, assumptions, stack, 10x prediction, omissions, next steps, and 15-hour total. |
| 5–10 minute video covering the four questions | MINE-TO-DO | The user reports a recording exists and is being edited. No MP4 was found in the project. Finish editing/export, verify duration and audible narration, and deliver it. |
| AI transcript exports used during development | DONE | Three real Codex exports and two setup notes are present; no newer project session logs were found. |
| Separate planning-assistant transcript cited in the AI log | MISSING | docs/ai-transcript/planning-chat.md is absent. Add the original conversation if it is required; do not reconstruct it. |

## Browser evidence already recorded

The user's 2026-10-17 Chrome check recorded the Step 11 button states and normal/burst behavior. With the server stopped, the button displayed exactly “Burst request failed: Server returned HTTP 502.” Separately, WebSocket status was disconnected and incoming rate fell to 0. After restart, WebSocket reconnected, the button worked again, and the feed returned to normal after the burst. The shutdown terminal also showed repeated WebSocket send error: write ECANCELED messages during connection teardown, then SIGINT received; shutting down and server stopped. This is recorded output, not a claim of error-free shutdown or a proven functional defect.

The reported browser check does not explicitly confirm that bus ages crossed 1,000 ms and displayed red STALE badges. Capture that state in the video if it occurs. The page-side view of an automatically started burst has also not been separately recorded; the existing browser burst recording was manually triggered.

## Remaining manual actions

- [ ] Finish editing/exporting the recorded video; verify it is 5–10 minutes, audible, and answers all four questions.
- [ ] In the video, show normal traffic, an automatic burst on the page if it occurs, a button-triggered burst, the injected out-of-order log line, the stale counter, and live panel values.
- [ ] Stop only the server while leaving Vite/browser running. Show disconnected status and incoming rate falling to zero. Wait until bus age exceeds 1,000 ms and show red STALE badges; if they do not appear, record that as a failed check. Restart and report the actual result.
- [ ] Add docs/ai-transcript/planning-chat.md from the original conversation if required; do not reconstruct it.
- [ ] Upload the final video and any required source archive, then confirm the evaluator can access them.

## Repository notes

- Latest npm test, client build, and load test results are in docs/TEST_RESULTS.md.
- The source archive is submission/live-fleet-board-code.zip. It contains tracked source at the final commit and excludes dependencies, build output, video, and PROJECT_CONTEXT.md.pdf.
- The video and ZIP are ignored by Git and are not part of the source commit.
