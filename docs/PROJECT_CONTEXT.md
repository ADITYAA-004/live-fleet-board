# Live Fleet Board — Project Context

Updated: 2026-10-16. Project root: `C:\Users\adity\OneDrive\Desktop\busfleet`.

## Current state

Steps 0–9 are complete according to the Step Status table and their recorded evidence in `CHANGES_LOG.md`. The app has a Node simulator, a WebSocket server, a React/Vite dashboard, a per-bus sequence guard and latest-state store, a controlled `requestAnimationFrame` publish loop, measured dashboard metrics, and a headless load test. Step 10's written submission documents and checklist have been prepared. The required demo video is still pending, so the project is not fully submitted and Step 10 remains in progress.

No application code was changed in the final-submission preparation task.

## Latest automated verification

Environment: Node.js `v24.22.0`, npm `11.19.1`.

| Command | Result |
|---|---|
| `npm test` | PASS — 24 passed, 0 failed; duration 9.615 s. The normal feed test received 180 messages in 3.003 s (59.94/sec). The 2-second burst integration test received 6,002 messages in 2.011 s (2,984.58/sec), with 627 out-of-order frames and 627 stale rejects. |
| `npm run build --workspace=client` | PASS — Vite 8.3.4 transformed 22 modules and built in 352 ms. |
| `npm run load-test` | PASS — detailed current run below. |

### Current load-test run

- Baseline: 600 messages in 10.01 s (59.94/sec), all 30 buses, zero normal-mode reorder.
- Burst averages: 2,992.85/sec, 2,995.01/sec, and 2,998.33/sec; respective measured peaks: 3,013/sec, 3,049/sec, and 3,024/sec.
- Stale rejects: 1,973 + 2,015 + 1,936 = 5,924. Displayed sequence regressions/resurrections: 0. BUS-07 ended CLOSED at seq 1,826.
- Freshness: all 30 buses stayed within 1,000 ms; worst sampled per-bus maximum was 432 ms (BUS-10); p99 of sampled bus ages was 31 ms. These are headless store-age samples, not paint measurements.
- Store and soak: exactly 30 entries remained. Forced-GC heap used rose from 8,782 KiB to 9,904 KiB (reported growth 1,123 KiB), within the 12,288 KiB allowance.
- Automatic timing: first burst began 45.01 s after client 1 connected. Client 2 connected 20.02 s after client 1; the burst began 25.00 s after client 2, confirming the later client did not reset the timer.
- Shutdown: local server, simulator, and scheduler timers were cleared.

These values are from the final-submission preparation run on 2026-10-16. Earlier Step 9 and documentation-audit values in `docs/TEST_RESULTS.md` remain as historical results from their respective runs.

## Browser evidence and limits

The user's Chrome recording and reports are manually supplied evidence, not a browser check performed during this documentation task. The recording started mid-burst:

- Captured burst: BURST indicator; incoming 2,525 then 1,281/sec; React commits 78 then 70/sec; rAF callbacks 121/sec; current maximum age 201 then 481 ms; 10-second peak 502 ms.
- Subsequent normal traffic: incoming 60–61/sec; commits 58–60/sec; rAF callbacks 116–121/sec; current maximum age 470–497 ms; 10-second peak 502–508 ms.
- All 30 rows kept updating and none showed STALE. A separate earlier user report confirms disconnect/reconnect behavior; it supplied no numeric disconnect-age readings.
- The recording began mid-burst, so the on-screen incoming reading did not capture the overall burst peak. Approximately 3,000/sec is supported by the server logs and load tests. The page-side automatic burst transition was not separately recorded; the automatic timer is verified by the user's server-log report and automated timing checks.

The browser and server share a machine clock in this setup. Headless age does not measure whether the browser painted a state. React commits and rAF callbacks are separately measured; a display's rAF cadence is an opportunity bound, not a promise to display every incoming update.

## Transcript inventory

The directory `docs/ai-transcript/` contains five files. The three exported Codex session Markdown files contain 158 `## User` / `## Assistant` headings in total (148 + 5 + 5). An earlier export note says 156; the count here is from the current files. The two Step 0/1 files are session notes, not full transcript exports, and are not included in that heading count. The source files are left unchanged.

| File | Bytes | Speaker headings / date evidence |
|---|---:|---|
| `codex-session-2026-10-15-01a13e43.md` | 131,236 | 148; first `2026-10-15T06:32:36.031Z`, last `2026-10-16T08:48:11.257Z` |
| `codex-session-2026-10-15-01a13e55.md` | 70,951 | 5; first `2026-10-15T06:52:33.791Z`, last `2026-10-15T06:52:51.581Z` |
| `codex-session-2026-10-15-01a13e5a.md` | 55,520 | 5; first `2026-10-15T06:57:39.018Z`, last `2026-10-15T07:01:14.234Z` |
| `step-00-workspace-relocation-session-log.md` | 2,773 | Setup session note dated 2026-10-15; not a full transcript |
| `step-01-project-skeleton-session-log.md` | 2,680 | Setup session note dated 2026-10-15; not a full transcript |

The exported sessions include the Step 0–10 development conversation and the logged Step 1 npm-install suggestion. The count disagreement is resolved by counting the current files; no transcript was reconstructed or edited for this audit.

## Current repository and milestone history

The original `docs/SOURCE_OF_TRUTH.docx` is present and unchanged from its initial Git blob (`7cf3168c4a44ad86060a2a74b7e9c1a5719552e8`). The branch is `master`; the pushed HEAD before this final-submission preparation was `832fad8 docs: finalize submission documentation`. The milestone hashes below are the current post-redaction history, not the earlier pre-rewrite hashes.

| Step | Current commit(s) |
|---|---|
| 0 | `80bc90f` |
| 1 | `e55349e` |
| 2 | `a60e0b2` |
| 3 | `4e8a897`, `0438fa8` |
| 4 | `fb4367b`, `6eabb76` |
| 5 | `8f40d15`, with browser confirmation in `e8b90d3` |
| 6 | `d6d0192`, `74e1916` |
| 7 | `f1c8c92`, `b88d0f2` |
| 8 | `22bbe11`, `e8b90d3` |
| 9 | `31d5b1b` |
| 10 written preparation | `0d93e17`, `832fad8` |

Subsequent commits recorded browser readings, automatic-burst confirmation, the AI suggestion, transcript export/redaction, and GitHub publication; see `git log --oneline` and `CHANGES_LOG.md` for those follow-ups.

## Source of Truth §9 submission checklist

| Deliverable | Status | Evidence / remaining work |
|---|---|---|
| Working source code and scripts | DONE | Server, client, tests, simulator and load-test script are present. Current tests, build and load test passed. |
| README prerequisites, one startup command, and load/burst command | DONE | `README.md` documents Node.js 22.19+ LTS, `npm start`, `npm test`, and `npm run load-test`. Prior Step 10 log records clean-clone and README command checks; they were not repeated in this run. |
| `DECISIONS.md` | DONE | Chosen design, alternatives, costs, trade-offs, assumptions, scale risks and next steps are documented. |
| 5–10 minute video answering the four questions | PENDING USER | Record it using `DEMO_SCRIPT.md`; the video is not present in the repository. |
| AI chat transcript used during development | PRESENT | Three exported session files with 158 speaker headings, plus two setup notes; see inventory above. This is the actual archived material, not a reconstructed transcript. |
| Final submission checklist and video staging instructions | PREPARED | `docs/FINAL_SUBMISSION_CHECKLIST.md` lists evidence and manual work; `submission/README.md` gives the video filename and delivery guidance. The MP4 is absent and ignored by Git. |

## Manual actions still required

1. Record the 5–10 minute video using `DEMO_SCRIPT.md`. Show normal traffic, the automatic burst timing, a manual burst, the out-of-order BUS-07 server line and stale count, measured panel values, server-only disconnect behavior, and the test/load-test commands.
2. In the AI segment, use only the Step 1 entry in the AI Suggestions Log: explain that the network diagnosis was wrong, the PC reached the registry, the actual error was certificate verification under Node 23.1.0, and the fix preserved TLS verification.
3. Add the video file or submission link to the required submission location and confirm the final submission checklist with it included.

The project is not fully submitted until the video has actually been recorded and added.
