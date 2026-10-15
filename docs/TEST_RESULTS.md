# Step 9 Test Results

- Date: 2026-10-16
- Node.js: `v24.22.0`
- npm: `11.19.1`

## Commands and results

| Command / check | Result |
|---|---|
| `node --check scripts/load-test.js` | PASS; no syntax diagnostics. |
| `npm test` | PASS; 24 tests passed, 0 failed, duration 9.559 s. The burst integration test measured 6,002 messages in 2.016 s (2,977.18 msgs/sec), 615 out-of-order arrivals, and 615 stale rejects. The normal feed test measured 181 messages in 3.013 s (60.07/sec). |
| `npm run load-test` | PASS on the final run. The 10-second baseline received 601 messages (60.10/sec) across all 30 buses, with 0 normal-mode reordering. Three 6-second bursts each delivered 18,002 updates: Burst 1 averaged 2,997.84/sec (peak one-second bucket 3,002/sec), Burst 2 averaged 2,995.34/sec (peak 3,031/sec), and Burst 3 averaged 2,995.34/sec (peak 3,031/sec). Per-burst stale rejects were 1,930, 1,969, and 1,927 (5,826 total). |
| Burst freshness / no resurrection | PASS. Across 315 50 ms sample ticks, all buses stayed below 1,000 ms; worst per-bus maximum was BUS-08 at 439 ms, and p99 across bus-age samples was 31 ms. Displayed regressions/resurrections: 0. BUS-07 finished CLOSED at seq 1,826. Each bus's accepted seq matched its highest produced seq after convergence; producer seq and timestamps passed checks. |
| Three-burst memory soak | PASS. Forced-GC heap used was 8,773 KiB before and 9,907 KiB after; growth was 1,134 KiB against a 12,288 KiB allowance. The store retained exactly 30 entries. The tolerance is the larger of 12 MiB or 25% of the starting heap, allowing ordinary runtime variation while catching retained growth over the soak. |
| Automatic timing | PASS. The first burst began 45.00 s after client 1 connected. Client 2 connected 20.01 s after client 1; the burst began 25.00 s after client 2 connected, confirming the second client did not restart the timer. Exactly one burst had started at the check. |
| Clean-start clone | PASS. After committing Step 9, I cloned the committed tree under `%TEMP%` and `npm install` reported `added 42 packages in 11s`. `npm start` logged `server starting`, `server listening on port 8081`, and Vite `Local: http://localhost:5175/`. `Invoke-WebRequest` returned HTTP 200 and the HTML referenced `/src/main.jsx`. SIGINT logged `server stopped`; the temporary clone was deleted. Existing processes already occupied ports 8080, 5173, and 5174, so this check used `PORT=8081` and Vite's automatic port fallback to 5175 without stopping those processes. |

The load test is a headless client using the same `client/src/lib/fleetStore.js` freshness guard. Its age values are `Date.now() - ts` for the newest accepted state; they measure state-store freshness, not browser paint. The browser honesty panel is responsible for measured React commits and rAF callbacks.

## Per-bus maximum state age

Maximum observed per bus across all three bursts, sampled every 50 ms:

| Bus | Max age (ms) | Bus | Max age (ms) | Bus | Max age (ms) |
|---|---:|---|---:|---|---:|
| BUS-01 | 49 | BUS-11 | 44 | BUS-21 | 222 |
| BUS-02 | 49 | BUS-12 | 43 | BUS-22 | 39 |
| BUS-03 | 48 | BUS-13 | 43 | BUS-23 | 39 |
| BUS-04 | 48 | BUS-14 | 42 | BUS-24 | 38 |
| BUS-05 | 47 | BUS-15 | 42 | BUS-25 | 38 |
| BUS-06 | 47 | BUS-16 | 42 | BUS-26 | 128 |
| BUS-07 | 46 | BUS-17 | 41 | BUS-27 | 37 |
| BUS-08 | 439 | BUS-18 | 41 | BUS-28 | 37 |
| BUS-09 | 424 | BUS-19 | 254 | BUS-29 | 37 |
| BUS-10 | 408 | BUS-20 | 41 | BUS-30 | 36 |

## Acceptance tests

| Acceptance test | Status | Evidence |
|---|---|---|
| Normal operation | PASS | The headless baseline measured 60.10 updates/sec and saw 30 distinct buses. The user's Step 4 Chrome/Edge report in `CHANGES_LOG.md` confirmed 30 sorted rows and changing values. |
| Automatic burst | PENDING-BROWSER | The fresh server started its first burst 45.00 seconds after the first client connected, within the expected window, and the later client did not reset the timer. The user reported the table kept updating during a burst and the injected server log line appeared. The requested browser incoming-rate and BURST-indicator fields in the manual report were placeholders, so visible rate rise is not evidenced here. |
| Freshness | PASS | All 30 headless store ages stayed at or below 439 ms during three measured bursts, below the 1,000 ms requirement. This is a same-machine server/store measurement, not a browser paint measurement. |
| Out-of-order protection | PASS | The three bursts produced 5,826 stale rejections; displayed regressions/resurrections were 0; BUS-07 ended CLOSED at its highest produced sequence. The user also reported seeing the injected BUS-07 log line in the browser run. |
| Bounded rendering | PASS | The latest-state map stayed at 30 entries through three bursts; heap growth was 1,134 KiB within the stated tolerance. Existing fake-rAF tests pass, including coalescing 1,000 updates into one publish. Browser repaint-rate values were placeholders in the user's report. |
| Honesty panel | PENDING-BROWSER | The metric calculations passed their fake-clock tests and the user reported completing the browser check. However, the normal/burst incoming rate, React commits/sec, rAF callbacks/sec, max-age, BURST indicator, and disconnect observations in `CHANGES_LOG.md` were supplied as placeholders, so the actual browser readings cannot be recorded. |
| One-command startup | PASS | In a clean local clone, the README's `npm install` and `npm start` commands installed dependencies and started both processes. The Vite page returned HTTP 200 and referenced the React entry script. Alternate ports were used because the default ports were occupied by the already-running project. |

## Failed attempts and fixes

The first load-test attempt checked producer/store equality after a fixed 400 ms drain and caught BUS-25 at accepted seq 620 versus produced seq 621. The socket callback could still be delivering a frame at the instant the check ran. The harness now waits for all accepted sequences to converge with producer counters, with a 2-second failure timeout.

The next attempt found BUS-01 and BUS-02 already at seq 2 when the harness subscribed. The server starts staggered simulator timers before `start()` returns, so the monitor had missed their initial seq 1 updates. The harness now seeds its production monitor from each simulator bus's current next sequence and last production timestamp before it begins observing. The final load-test run passed all checks.

## Browser readings from the user

The user confirmed in Chrome/Edge that the table continued updating during the burst and the server log showed the injected out-of-order line. The readings for normal incoming rate, React commits/sec, rAF callbacks/sec, max age, indicator, burst readings, and disconnected behavior were literal `<REAL>` / `<shown / not shown>` placeholders in the supplied report and corresponding `CHANGES_LOG.md` entry. No values have been inferred or invented.

## Known limitations

- Headless age measures the latest accepted telemetry timestamp, not whether the browser painted that state. The browser metrics require a real browser check.
- The user's browser-check report confirms the burst/table and injected log behavior, but its metric and disconnect fields contain placeholders; those readings remain unverified.
- With `LOAD_TEST_URL`, the script can compare accepted state against the highest seq received on the WebSocket, but that external server does not expose simulator internals. The default isolated-server run used here compares against the actual highest produced seq.
- Age assumes the same machine clock for producer and test client, as in this project setup.
