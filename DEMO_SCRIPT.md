# Live Fleet Board video outline

Target length: about 7–8 minutes. Keep the browser, server terminal, and a PowerShell terminal visible when demonstrating live behavior. Use actual readings shown during recording; do not replace missing browser measurements with the headless load-test numbers.

## Timed outline

| Time | Segment | Talking points / action |
|---|---|---|
| 0:00–0:40 | Introduce the problem | Show the 30-bus dashboard and explain the goal: stay current during a burst and never let an older update overwrite a newer one. |
| 0:40–1:35 | What was chosen and why | Trace simulator → WebSocket `/feed` → sequence-guarded latest-state map → `requestAnimationFrame` snapshot → React table and honesty panel. Explain why the map intentionally overwrites intermediate states. |
| 1:35–2:20 | Alternatives | Briefly cover per-message React state, queueing, a worker, polling, SSE, Redux, and arrival-order last-write-wins. Emphasize that the sequence number, not arrival time, decides whether a state is newer. |
| 2:20–3:00 | Measured evidence | Show the latest audit run in `docs/TEST_RESULTS.md`: 59.98 updates/sec baseline; three burst averages of 2,992.85, 2,996.84, and 2,993.85 messages/sec; 5,768 stale rejects; zero state regressions; worst sampled headless age 49 ms. Explain that these are store-age measurements, not browser paint. Then show the separately labelled user-recorded browser values. |
| 3:00–5:20 | Live demo | Follow the checklist below: normal traffic, automatic burst timing, a manual burst, the injected stale message, honesty panel, then stop only the server and observe disconnect and increasing ages. The automatic page-side transition was not previously recorded; capture it in this video if practical. |
| 5:20–6:15 | What breaks at 10x scale | Explain that a linear projection from the measured feed is about 300 buses and 30,000 burst messages/sec, not a test result. Discuss main-thread JSON parsing, server fan-out, per-client backpressure, table virtualization, clock skew, and multiple server instances. Add a worker only if profiling supports it. |
| 6:15–7:20 | AI suggestion segment | Use the actual Step 1 entry in `CHANGES_LOG.md`. The planning assistant attributed the install failure to the Codex sandbox having no network and told the user to install on their PC. That diagnosis was wrong: the PC reached the npm registry (HTTP 200), while Node 23.1.0 rejected the certificate with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. The PC install was useful as a diagnostic, but it did not explain the failure. The correction was a newer Node LTS plus `NODE_USE_SYSTEM_CA=1` for that PowerShell install; TLS verification stayed enabled. Explain the engineering lesson: verify the failing layer and fix certificate trust without disabling TLS checks. |
| 7:20–7:50 | Close | Summarize the freshness-first design and what the tests establish. State that the video is the remaining submission item and that the earlier page recording did not capture the automatic transition. |

## Live-demo checklist

- [ ] Start with `npm start`; open <http://localhost:5173> and show connected status, all bus rows, and normal feed activity.
- [ ] For the automatic burst, connect the first browser client, show the server's scheduled line, and keep the recording running until the server logs the first burst about 45 seconds later. The prior page recording showed a manually triggered burst, not the automatic page-side transition.
- [ ] Trigger a burst from PowerShell: `Invoke-RestMethod -Method Post http://localhost:8080/burst`.
- [ ] Show the server's `[burst] injected out-of-order: BUS-07 ... CLOSED delivered before ... OPEN` line and the stale-rejection count increasing in the page.
- [ ] Show the honesty panel during normal traffic and the burst: incoming rate, React commits/sec, rAF callbacks/sec, current/peak age, and normal/BURST indicator. Read out the values actually visible in this recording.
- [ ] Stop only the Node server process. Leave the browser/Vite page open; show disconnected status, bus ages rising and turning red/STALE, and incoming rate falling to zero. Restart the server and show reconnection if time allows.
- [ ] In a terminal, run `npm test` and show the passing summary.
- [ ] Run `npm run load-test` and show its baseline, burst, stale-reject, freshness, sequence, memory, and automatic-timing report. Say that its age is headless store age, not browser paint.

The AI segment is grounded in the single real Step 1 row in the project's AI Suggestions Log. Do not substitute either Step 9 harness bug for an AI suggestion; no such attribution is recorded.
