# Final Submission Checklist

Updated: 2026-10-16. Project root: `C:\Users\adity\OneDrive\Desktop\busfleet`.

This checklist follows the original assignment in `docs/SOURCE_OF_TRUTH.docx`. **The project is not fully submitted until the real 5–10 minute video is recorded and delivered.**

## Assignment requirements and evidence

| Requirement | Status | Evidence and limits |
|---|---|---|
| Working React dashboard and separate Node.js/WebSocket server | COMPLETE | `client/`, `server/`, root npm workspaces, and `npm start`. README startup was verified during the historical Step 9 clean-clone check; startup was not repeated during this final-preparation run. |
| Exactly 30 simulated buses with stable IDs and required telemetry fields | COMPLETE | `server/simulator.js`; `server/simulator.test.js`; current `npm test`; current load test saw all 30 IDs. |
| Normal feed near 2 updates/sec per bus (about 60/sec total) | COMPLETE | Current `npm test`: 180 messages in 3.003 s (59.94/sec). Current load test baseline: 600 messages in 10.01 s (59.94/sec), 30 buses, no normal-mode reordering. |
| Burst near 50× normal, about 3,000 messages/sec for several seconds | COMPLETE | `server/burst.test.js`; current integration burst: 2,984.58/sec. Current load bursts averaged 2,992.85, 2,995.01, and 2,998.33/sec. |
| Automatic burst begins within 1–2 minutes after the first client connects | COMPLETE | Current load test: first burst at 45.01 s; a later client did not reset the timer. User's server log also confirmed automatic start. |
| Feed-rate metric visibly rises during an automatically triggered page burst | PARTIAL | The user's browser recording shows a BURST indicator and rising feed rate during a manually triggered burst. Server logs and load tests prove the automatic trigger, but the page-side automatic transition has not been separately recorded. Capture it in the final video. |
| Deliberate out-of-order arrivals include CLOSED-before-stale-OPEN | COMPLETE | `server/index.js`, `server/burst.test.js`, `scripts/load-test.js`; current logs showed the injected BUS-07 pair each burst. Current three-burst run observed 5,924 stale rejects. |
| Per-bus sequence guard prevents stale updates and door resurrection | COMPLETE | `client/src/lib/fleetStore.js` and unit/integration tests, including newer CLOSED followed by stale OPEN. Current load test reported 0 regressions and BUS-07 final CLOSED at seq 1,826. |
| State freshness stays at or below 1,000 ms under the specified burst test | COMPLETE | Current load test sampled all 30 buses every 50 ms; worst maximum was 432 ms on BUS-10 (p99 31 ms). The user's separate browser recording reported 502 ms peak max age. Headless age is store age, not browser paint. |
| Bounded rendering coalesces updates and uses browser animation frames | COMPLETE | `client/src/lib/renderLoop.js` and fake-rAF tests; 1,000 updates coalesced to one publish. User-reported browser capture showed 78 React commits/sec versus 121 rAF callbacks/sec during the captured burst. |
| Honesty panel reports measured feed, React commits, rAF callbacks, ages, stale state and burst status | COMPLETE | `client/src/lib/metrics.js`, `client/src/App.jsx`, `FleetMetrics.jsx`, tests, and user's browser measurements recorded in `docs/TEST_RESULTS.md`. React commits are not a compositor paint measurement; the UI labels them separately from rAF callbacks. Browser readings are user-reported and were not independently rechecked during this task. |
| Header, 30-row table, connection status, position/speed/door/seq/age | COMPLETE | `client/src/components/FleetTable.jsx`; manual browser confirmations recorded in `CHANGES_LOG.md`. |
| One documented startup command and clean-machine setup | COMPLETE | `README.md` documents Node 22.19+ LTS, `npm install`, and `npm start`. Historical Step 9 clean-clone test installed dependencies and started server/Vite successfully on alternate ports; not repeated here. |
| Test and load-test commands documented and runnable | COMPLETE | Root `package.json`, `README.md`; all three commands below passed in this run. |
| `DECISIONS.md` covers choices, rejected alternatives, costs, trade-offs, assumptions, scale risks and next steps | COMPLETE | `DECISIONS.md`; measurements distinguish the current run from historical results. |
| Actual AI suggestion and engineering response for the video | COMPLETE | One real Step 1 row in the AI Suggestions Log in `CHANGES_LOG.md`; `DEMO_SCRIPT.md` uses that row only. |
| Development AI transcript included | COMPLETE | `docs/ai-transcript/` has three exported Codex sessions with 158 User/Assistant headings (148 + 5 + 5) and two Step 0/1 setup notes. Files were inspected and not reconstructed or edited. |
| 5–10 minute demonstration video answering the four required questions | PENDING | No video file exists. Record and deliver it using `DEMO_SCRIPT.md` and `submission/README.md`. Step 10 remains in progress. |

## Current automated verification

Environment: Node.js `v24.22.0`, npm `11.19.1`.

| Command | Actual result |
|---|---|
| `npm test` | PASS — 24 passed, 0 failed; 9.615 s. Normal feed: 180 updates / 3.003 s (59.94/sec). Burst: 6,002 messages / 2.011 s (2,984.58/sec), 627 out-of-order frames, 627 stale rejects. |
| `npm run build --workspace=client` | PASS — Vite 8.3.4, 22 modules, 352 ms. |
| `npm run load-test` | PASS — baseline 59.94/sec, 30 IDs, zero normal reordering. Burst averages 2,992.85, 2,995.01, 2,998.33/sec; peaks 3,013, 3,049, 3,024/sec. Per-burst stale rejects 1,973, 2,015, 1,936 (5,924 total); zero regressions; all 30 buses at or under 1,000 ms (worst 432 ms, BUS-10; p99 31 ms); BUS-07 final CLOSED seq 1,826. |

Three-burst soak retained 30 store entries. Heap used was 8,782 KiB before and 9,904 KiB after; the test reported growth of 1,123 KiB within the 12,288 KiB allowance. The automatic burst began 45.01 s after client 1 connected; client 2 joined 20.02 s after client 1 and did not reset the timer. Shutdown cleanup passed. These headless measurements do not establish browser paint or a clean install on another machine.

## Reproduction commands

From the project root:

```powershell
npm install
npm start
```

Open <http://localhost:5173>. To trigger a development burst from a separate PowerShell window:

```powershell
Invoke-RestMethod -Method Post http://localhost:8080/burst
```

Run checks from the project root:

```powershell
npm test
npm run build --workspace=client
npm run load-test
```

`npm run load-test` starts an isolated server by default. Set `LOAD_TEST_URL` only when intentionally testing an already running server; in that mode the external server does not expose simulator-produced sequence counters.

## Video checklist and suggested 8–9 minute sequence

1. Start `npm start`, open the dashboard, show normal traffic and connected status. The first client connection starts the automatic-burst timer.
2. While the timer runs, explain the simulator → WebSocket → per-bus sequence guard/latest-state map → rAF → React flow, and why intermediate updates are coalesced.
3. Show the automatic burst on the page and in the server log. Point out the injected BUS-07 CLOSED-before-OPEN line, stale rejection count, and measured panel values. This page-side automatic transition is the main missing browser recording.
4. Trigger a manual burst with the PowerShell command if needed to show the out-of-order behavior again.
5. Stop only the server while leaving Vite/browser open. Show disconnected status, ages rising, and incoming rate falling to zero; restart and show reconnection if time allows.
6. Explain trade-offs and alternatives; cover what is projected to break at 10× scale without presenting projections as measurements.
7. Tell the real Step 1 AI suggestion story from `CHANGES_LOG.md`: the network diagnosis was wrong, the user's PC got HTTP 200, the actual error was Node 23.1.0 certificate verification, and the fix preserved TLS validation.
8. Run `npm test` and `npm run load-test`, show their actual summaries, explain the headless-age limitation, and close by stating the video is being submitted separately.

## Pending manual actions and limitations

- Record the real 5–10 minute video; do not create a placeholder. Use the filename `live-fleet-board-demo.mp4` and the local staging path in `submission/README.md` if useful.
- Deliver the video through the assignment's required platform or approved file-sharing location; do not commit the MP4 to GitHub. Add its final link to the submission location when known.
- Capture the automatic page-side transition if practical. Prior browser footage showed a manually triggered burst; automatic timing is supported by server logs and automated tests.
- Browser measurements in the report came from the user's supplied recording, not a browser session during this final-preparation run. The historical clean-clone install was not repeated.
