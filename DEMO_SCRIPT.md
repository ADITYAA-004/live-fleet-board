# Live Fleet Board video outline

Target length: about 8–9 minutes. Keep the browser, server terminal, and a PowerShell terminal visible when demonstrating live behavior. Use actual readings shown during recording; do not replace missing browser measurements with the headless load-test numbers.

## Timed outline

| Time | Segment | Talking points / action |
|---|---|---|
| 0:00–0:35 | Start and introduce | Start `npm start`, open the page, connect the first browser client, and explain the goal: stay fresh during bursts without allowing stale updates to overwrite newer states. The automatic timer starts on this first connection. |
| 0:35–1:25 | Architecture and choices | While normal traffic runs, trace simulator → WebSocket `/feed` → sequence-guarded latest-state map → `requestAnimationFrame` snapshot → React table and honesty panel. Explain why intermediate states are coalesced. |
| 1:25–2:05 | Automatic burst and stale protection | Keep the page and server log visible through the expected ~45-second first-burst delay. Show the automatic `[burst] started` line, measured BURST/rate state, injected BUS-07 CLOSED-before-OPEN line, and stale count. This page-side automatic transition was not separately recorded before; capture it in this submission video. |
| 2:05–2:45 | Alternatives | Cover per-message `setState`, queueing, a worker, polling, SSE, Redux, and arrival-order last-write-wins. Explain why per-bus `seq` determines freshness. |
| 2:45–3:30 | Measured results | Show the latest run in `docs/TEST_RESULTS.md`: 59.94 updates/sec baseline; burst averages of 2,992.85, 2,995.01, and 2,998.33/sec; 5,924 stale rejects; zero regressions; worst sampled headless age 432 ms. Separate these store-age numbers from the user's earlier browser readings. |
| 3:30–4:10 | Manual burst and honesty panel | Trigger `POST /burst` from PowerShell and show incoming rate, React commits/sec, rAF callbacks/sec, staleness, and door state. Read only the values actually visible in this recording. |
| 4:10–4:45 | Disconnect behavior | Stop only the server, leave Vite/browser running, and show disconnected status, rising bus ages, and incoming rate falling to zero. Restart the server if time allows. |
| 4:45–5:35 | What breaks at 10× scale | Explain that 300 buses and 30,000 burst messages/sec are a linear projection, not a measured result. Cover main-thread JSON parsing, server fan-out/backpressure, table virtualization, clock skew, and multiple server instances. Add a worker only after profiling. |
| 5:35–6:30 | Actual AI suggestion | Use the Step 1 AI Suggestions Log row only. The planning assistant blamed the sandbox's network and recommended running install on the PC. The PC returned HTTP 200; the actual error was Node 23.1.0's `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Running on the PC served as a diagnostic, not a fix to that diagnosis. The resolution used a newer Node LTS and `NODE_USE_SYSTEM_CA=1`, keeping TLS verification enabled. Explain the engineering lesson: verify the failing layer and preserve certificate checks. |
| 6:30–6:55 | Tests and close | Run `npm test` and `npm run load-test`, show their real summaries, and state that load-test age is headless store age rather than browser paint. Close by stating that the video is the final pending submission item. |

## Live-demo checklist

- [ ] Start with `npm start`; open <http://localhost:5173> and show connected status, all bus rows, and normal feed activity.
- [ ] For the automatic burst, connect the first browser client, show the server's scheduled line, and keep the recording running until the server logs the first burst about 45 seconds later. This video should capture the automatic page-side transition missing from earlier recordings.
- [ ] Trigger a burst from PowerShell: `Invoke-RestMethod -Method Post http://localhost:8080/burst`.
- [ ] Show the server's `[burst] injected out-of-order: BUS-07 ... CLOSED delivered before ... OPEN` line and the stale-rejection count increasing in the page.
- [ ] Show the honesty panel during normal traffic and the burst: incoming rate, React commits/sec, rAF callbacks/sec, current/peak age, and normal/BURST indicator. Read out the values actually visible in this recording.
- [ ] Stop only the Node server process. Leave the browser/Vite page open; show disconnected status, bus ages rising and turning red/STALE, and incoming rate falling to zero. Restart the server and show reconnection if time allows.
- [ ] In a terminal, run `npm test` and show the passing summary.
- [ ] Run `npm run load-test` and show its baseline, burst, stale-reject, freshness, sequence, memory, and automatic-timing report. Say that its age is headless store age, not browser paint.

Run taskkill /F /IM node.exe.
Window 1: npm run start --workspace=server
Window 2: npm run dev --workspace=client

The AI segment is grounded in the single real Step 1 row in the project's AI Suggestions Log. Do not substitute either Step 9 harness bug for an AI suggestion; no such attribution is recorded.
