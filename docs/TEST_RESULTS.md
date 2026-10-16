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
| Normal operation | PASS | Headless baseline: 60.10 updates/sec across 30 buses. In the user's Chrome screen recording after the burst, normal traffic read 60–61 updates/sec, React commits 58–60/sec, rAF callbacks 116–121/sec, current max staleness 470–497 ms, and ten-second peak max staleness 502–508 ms. All 30 buses kept updating and none showed STALE. |
| Automatic burst | PASS | The user's server terminal logged `[burst] first automatic burst scheduled in 45000ms after first client connection`, followed about 45 seconds later (about 34 one-second log lines) by `[burst] started #1: 6000ms at 100 updates/sec/bus target`, without a manual trigger. The same run's burst rates were 2,978, 3,048, 2,990, 3,049, and 3,031 msgs/sec. A client disconnect/reconnect did not reschedule the burst. The load test measured 45.00 s and 45.02 s. The browser's automatic page-side transition was not separately recorded; the existing page recording shows a manually started burst. |
| Freshness | PASS | The headless load test's worst per-bus max age was 439 ms. In the screen recording, current max staleness during the burst read 201 then 481 ms, and the ten-second peak read 502 ms (≤1000 ms). In normal traffic, current max read 470–497 ms and the ten-second peak read 502–508 ms (≤1000 ms). No bus showed STALE. |
| Out-of-order protection | PASS | The three bursts produced 5,826 stale rejections; displayed regressions/resurrections were 0; BUS-07 ended CLOSED at its highest produced sequence. The user also reported seeing the injected BUS-07 log line in the browser run. |
| Bounded rendering | PASS | Store size remained 30 and the three-burst heap increase was 1,134 KiB in the headless soak; fake-rAF tests coalesce 1,000 updates into one publish. In the screen recording, burst incoming rate read 2,525 then 1,281/sec while commits read 78 then 70/sec and rAF callbacks read 121/sec; normal commits were 58–60/sec against 116–121 rAF callbacks/sec. The relevant browser bound is the observed rAF cadence, not an assumed ~60 commits/sec cap. |
| Honesty panel | PASS | User screen recording showed BURST; incoming rate 2,525 then 1,281/sec; commits 78 then 70/sec; rAF 121/sec; current max staleness 201 then 481 ms; ten-second peak 502 ms. Normal readings were incoming 60–61/sec, commits 58–60/sec, rAF 116–121/sec, current max age 470–497 ms, and peak max age 502–508 ms. All 30 buses updated and none showed STALE. The earlier disconnected-state/reconnect confirmation is recorded in the Step 3 browser follow-up in `CHANGES_LOG.md`; this recording did not add disconnected-age or feed-rate readings. |
| One-command startup | PASS | In a clean local clone, the README's `npm install` and `npm start` commands installed dependencies and started both processes. The Vite page returned HTTP 200 and referenced the React entry script. Alternate ports were used because the default ports were occupied by the already-running project. |

## Failed attempts and fixes

The first load-test attempt checked producer/store equality after a fixed 400 ms drain and caught BUS-25 at accepted seq 620 versus produced seq 621. The socket callback could still be delivering a frame at the instant the check ran. The harness now waits for all accepted sequences to converge with producer counters, with a 2-second failure timeout.

The next attempt found BUS-01 and BUS-02 already at seq 2 when the harness subscribed. The server starts staggered simulator timers before `start()` returns, so the monitor had missed their initial seq 1 updates. The harness now seeds its production monitor from each simulator bus's current next sequence and last production timestamp before it begins observing. The final load-test run passed all checks.

## Browser readings from the user

The user supplied measurements from a Chrome screen recording on a display reported as approximately 120 Hz. The recording began mid-burst. During the captured burst, feed state was BURST; incoming updates/sec read 2,525 then 1,281 as it tailed off; React commits/sec read 78 then 70; browser rAF callbacks/sec read 121; current max staleness read 201 then 481 ms; ten-second peak max staleness read 502 ms. During subsequent normal traffic, incoming rate read 60–61/sec; commits 58–60/sec; rAF callbacks 116–121/sec; current max staleness 470–497 ms; ten-second peak 502–508 ms. All 30 buses kept updating and none showed STALE.

The captured on-screen burst reading is 2,525/sec because recording started mid-burst; it is not presented as the overall peak. Approximately 3,000/sec burst peak is supported by server logs and the load-test results. The animation-frame rate is the repaint opportunity bound: 78 commits/sec was below 121 rAF callbacks/sec during the captured burst. No fixed 60 commits/sec acceptance cap applies. The earlier disconnected-state/reconnect recording is documented in the Step 3 follow-up in `CHANGES_LOG.md`; the current recording did not supply disconnected-age or feed-rate numbers. Earlier browser reports had placeholders; this follow-up supersedes those missing normal/burst values without inferring unprovided readings.

## Known limitations

- Headless age measures the latest accepted telemetry timestamp, not whether the browser painted that state. The browser metrics above are from the user's reported screen recording and were not independently inspected in this session.
- The browser recording started mid-burst and does not separately show the page during an automatically triggered first burst; the server terminal log and load test establish the trigger and timing. The recorded browser values and terminal log are user-reported, not independently inspected in this session.
- With `LOAD_TEST_URL`, the script can compare accepted state against the highest seq received on the WebSocket, but that external server does not expose simulator internals. The default isolated-server run used here compares against the actual highest produced seq.
- Age assumes the same machine clock for producer and test client, as in this project setup.

## Documentation-finalization verification — 2026-10-16

This is a fresh run performed while reconciling Step 10 documents. It supplements, and does not overwrite, the historical Step 9 run and the user's earlier browser measurements above.

- Environment: Node.js `v24.22.0`, npm `11.19.1`.
- `npm test` → PASS, 24 passed / 0 failed in 9.816 s. Normal feed: 180 messages in 3.003 s (59.94/sec). Two-second burst integration: 6,002 messages in 2.008 s (2,989.04/sec), 630 out-of-order frames, and 630 stale rejects.
- `npm run build --workspace=client` → PASS, Vite 8.3.4 transformed 22 modules and completed in 386 ms.
- `npm run load-test` → PASS. Baseline: 600 messages / 10.00 s = 59.98/sec; 30 distinct buses; zero normal-mode reordering. Burst averages: 2,992.85, 2,996.84, and 2,993.85/sec; peaks: 3,027, 3,012, and 3,022/sec. Per-burst stale rejects: 1,951, 1,939, and 1,878 (5,768 total). State regressions/resurrections: 0; BUS-07 ended CLOSED at seq 1,826. All 30 buses stayed within 1,000 ms; worst sampled per-bus maximum was 49.0 ms (BUS-01), and p99 across sampled ages was 30.0 ms.
- Three-burst soak: 30 store entries; forced-GC heap used 8,792 KiB before and 9,914 KiB after (+1,122 KiB), within the 12,288 KiB allowance. Server/simulator timers were cleared at shutdown.
- Automatic timing: first burst started 45.00 s after client 1 connected. Client 2 connected 20.01 s after client 1; the burst started 24.99 s after client 2, so it did not restart the timer.

The automatic page-side transition was not separately recorded in the prior browser capture. The user's server log and this automated timing run verify the automatic timer; the recorded page-side burst was manually triggered. This run did not open a browser, reinstall packages, or repeat the clean-clone startup check.

## Submission status

The source, scripts, README, `DECISIONS.md`, and three exported Codex session transcripts are present. The transcript directory also contains two Step 0/1 setup notes; the three exported transcript files contain 158 User/Assistant Markdown headings (148 + 5 + 5). A prior log entry reported 156; the current file count is the corrected inventory. The required 5–10 minute video remains **PENDING USER**. Do not treat this project as fully submitted until that video is recorded and added.

## Final-submission preparation verification — 2026-10-16

Fresh verification run for the final-submission preparation task. It supersedes the previous documentation-finalization run as the latest automated result; earlier Step 9 and prior audit results above are retained as historical records.

- Environment: Node.js `v24.22.0`, npm `11.19.1`.
- `npm test` → PASS, 24 passed / 0 failed in 9.615 s. Normal feed: 180 messages in 3.003 s (59.94/sec). Short burst integration: 6,002 messages in 2.011 s (2,984.58/sec), with 627 out-of-order arrivals and 627 stale rejects.
- `npm run build --workspace=client` → PASS; Vite 8.3.4 transformed 22 modules and built in 352 ms.
- `npm run load-test` → PASS. Baseline: 600 messages in 10.01 s (59.94/sec), all 30 buses, no normal-mode reordering. Three burst averages were 2,992.85/sec (peak 3,013), 2,995.01/sec (peak 3,049), and 2,998.33/sec (peak 3,024). Out-of-order/stale rejects by burst were 1,973, 2,015, and 1,936 (5,924 total); displayed regressions/resurrections were 0; BUS-07 finished CLOSED at seq 1,826.
- Freshness sampling: 106, 104, and 104 samples across the bursts. All 30 buses remained at or under 1,000 ms; the worst sampled per-bus maximum was 432 ms on BUS-10, and p99 across samples was 31 ms. Each burst ended with 30 store entries and producer/store sequence convergence in 152.3 ms, 155.2 ms, and 92.3 ms.
- Three-burst soak: heap used `8,782 KiB before -> 9,904 KiB after` (reported growth `1,123 KiB`), within the `12,288 KiB` allowance. Shutdown cleanup passed.
- Automatic timer: first burst began 45.01 s after client 1 connected. Client 2 connected 20.02 s after client 1; the burst began 25.00 s after client 2, confirming it did not restart the timer.

No browser was opened and no clean-clone install was repeated in this run. Prior browser readings in this report were supplied by the user; they remain distinct from these headless test results. The automatic page-side transition has not been separately recorded. No video is present, so Step 10 remains in progress.
