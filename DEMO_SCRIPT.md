# Live Fleet Board Demo Script

Target length: about 8 minutes. Follow the four questions in the assignment order. Use only readings visible during this recording. Distinguish user-recorded browser results from automated load-test results.

## 0:00–3:15 — What I chose and why

Start with the page running at http://localhost:5173. Show the 30 bus rows, connected status, normal feed, and honesty panel. Explain that I chose React and a Node WebSocket server because the brief specified them. Point to the sequence guard, latest-state map, and animation-frame publishing: the table keeps the newest accepted state per bus rather than replaying every intermediate position.

If possible, keep the first browser client connected until the server starts its automatic burst. Show the server scheduling and burst-start lines, and show the page feed indicator and current staleness. The automatic timer was measured at about 45 seconds after the first client connected, but the page-side automatic transition was not separately recorded in the earlier browser capture. If it does not appear on screen, say so; do not claim that it did.

When normal traffic returns, press Trigger burst now. Read the button response and the current max staleness aloud. Point out the injected BUS-07 CLOSED-before-OPEN line and the stale-rejection counter. Describe the button-triggered browser readings only as readings from those recordings, not as a guaranteed result for this take.

## 3:15–5:00 — Alternatives I considered and rejected

Show the alternatives section in DECISIONS.md. Explain why I did not call React state for every message or queue every update for a later frame. Then explain that server-side coalescing is a valid complement, but the client still needs its sequence guard because this feed deliberately delivers updates out of order. I did not add a worker because I have not measured parse time; the recorded freshness readings do not establish that a worker is unnecessary at every scale. Polling adds repeated request/response cycles. SSE can carry one-way telemetry, but the brief required WebSocket. The small current-state store did not need Redux, and arrival order cannot identify the newest update.

## 5:00–6:30 — What I predict breaks first at 10x

Show the 10x prediction in DECISIONS.md. Explain that 300 buses at about 100 burst updates per second each would produce about 30,000 messages per second. This is a projection, not a load-test result. I expect main-thread JSON parsing and sequence checks, followed by per-message server fan-out, to need profiling first. I would test source-side coalescing, batching, and per-client backpressure; I would add a worker only if measurements justify it.

## 6:30–8:00 — One incorrect or lazy AI suggestion and how I handled it

Show both entries in the AI Suggestions Log in CHANGES_LOG.md. First, the planning assistant attributed npm install failure to the sandbox lacking network access. My PC reached the registry; the actual error was Node 23.1.0 rejecting the certificate. I installed a newer Node LTS and used NODE_USE_SYSTEM_CA=1 without disabling TLS verification.

Second, the planning assistant treated about 60 React commits per second as the upper bound. That assumed a 60 Hz display. My browser offered about 121 animation frames per second, and the recorded burst showed 78 commits per second while about 2,500 updates per second arrived. I corrected the criterion to use the browser's offered frame rate, not a fixed 60 commits per second.

## Live demo checklist

- [ ] Show normal traffic, all 30 rows, connected status, and the measured metrics panel.
- [ ] Keep the first browser connection open and capture an automatic burst starting on its own. The earlier page recording showed a manually triggered burst; do not claim it showed the automatic transition.
- [ ] Press Trigger burst now and read the response and current staleness aloud.
- [ ] Show the server's [burst] injected out-of-order line and the stale-rejection count increasing.
- [ ] Stop only the server, leave the Vite client and browser open, and show disconnected status and ages rising. Wait until bus age exceeds 1,000 ms and show the red STALE badge; if it does not appear, report that as a failed check.
- [ ] Restart the server and report the observed reconnect behavior.
- [ ] Run npm test and npm run load-test from the project root and show their actual output.

## Do not show

- README, PROJECT_CONTEXT, or FINAL_SUBMISSION_CHECKLIST packaging notes.
- The OBS control window.
- Personal browser bookmarks.
