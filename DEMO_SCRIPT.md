# Live Fleet Board video outline

Target length: about 7–8 minutes. Keep the browser, server terminal, and a PowerShell terminal visible when demonstrating live behavior. Use actual readings shown during recording; do not replace missing browser measurements with the headless load-test numbers.

## Timed outline

| Time | Segment | Talking points / action |
|---|---|---|
| 0:00–0:40 | Introduce the problem | Show the 30-bus dashboard and explain the goal: stay current during a burst and never let an older update overwrite a newer one. |
| 0:40–1:35 | What was chosen and why | Trace simulator → WebSocket `/feed` → sequence-guarded latest-state map → `requestAnimationFrame` snapshot → React table and honesty panel. Explain why the map intentionally overwrites intermediate states. |
| 1:35–2:20 | Alternatives | Briefly cover per-message React state, queueing, a worker, polling, SSE, Redux, and arrival-order last-write-wins. Emphasize that the sequence number, not arrival time, decides whether a state is newer. |
| 2:20–3:00 | Measured evidence | Show `docs/TEST_RESULTS.md`: 60.10 updates/sec baseline; burst averages 2,997.84, 2,995.34, and 2,995.34 messages/sec; 5,826 stale rejects; zero display regressions; worst sampled age 439 ms. Clarify that these are headless/store measurements. |
| 3:00–5:20 | Live demo | Follow the checklist below: normal traffic, immediate burst, injected stale message, honesty panel, then stop only the server and observe the disconnected state and increasing ages. |
| 5:20–6:15 | What breaks at 10x scale | Explain that a linear projection from the measured feed is about 300 buses and 30,000 burst messages/sec, not a test result. Discuss main-thread JSON parsing, server fan-out, per-client backpressure, table virtualization, clock skew, and multiple server instances. Add a worker only if profiling supports it. |
| 6:15–7:20 | AI suggestion segment | **Not ready to record as written:** the AI Suggestions Log in `CHANGES_LOG.md` is empty. Do not claim an AI made either suggestion. See “Real candidates to choose from” below; select one only if it matches the actual conversation history and record it in the log before filming this segment. |
| 7:20–7:50 | Close | Summarize the freshness-first design, what the tests establish, and the remaining browser evidence/transcript work. |

## Live-demo checklist

- [ ] Start with `npm start`; open <http://localhost:5173> and show connected status, all bus rows, and normal feed activity.
- [ ] Trigger a burst from PowerShell: `Invoke-RestMethod -Method Post http://localhost:8080/burst`.
- [ ] Show the server's `[burst] injected out-of-order: BUS-07 ... CLOSED delivered before ... OPEN` line and the stale-rejection count increasing in the page.
- [ ] Show the honesty panel during normal traffic and the burst: incoming rate, React commits/sec, rAF callbacks/sec, current/peak age, and normal/BURST indicator. Read out the values actually visible in this recording.
- [ ] Stop only the Node server process. Leave the browser/Vite page open; show disconnected status, bus ages rising and turning red/STALE, and incoming rate falling to zero. Restart the server and show reconnection if time allows.
- [ ] In a terminal, run `npm test` and show the passing summary.
- [ ] Run `npm run load-test` and show its baseline, burst, stale-reject, freshness, sequence, memory, and automatic-timing report. Say that its age is headless store age, not browser paint.

## Real candidates to choose from for the AI segment

The AI Suggestions Log is currently empty, so there is no verified “incorrect or lazy AI suggestion” to narrate. Two real Step 9 harness issues are documented in `docs/TEST_RESULTS.md` and `CHANGES_LOG.md`; they are candidates to inspect against the full chat history, not claims that AI suggested them:

1. An early harness check used a fixed 400 ms delivery drain and checked producer/store sequence equality before the final WebSocket delivery arrived. The harness was corrected to wait for sequence convergence.
2. The load-test monitor subscribed after the simulator had already emitted initial updates because the server starts simulator timers before `start()` returns. The monitor was corrected to seed its baseline from simulator sequence/time state.

Before recording this segment, compare the candidates with the actual AI conversation. If neither was an AI suggestion, choose a real suggestion from the full transcript and add it to the AI Suggestions Log yourself; do not present an implementation bug as an AI suggestion.
