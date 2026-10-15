# Live Fleet Board — Project Context

Updated: 2026-10-16. Project root: `C:\Users\adity\OneDrive\Desktop\busfleet`.

## Finished state

Steps 0–10 are marked Done in `CHANGES_LOG.md`. The application contains a Node simulator and WebSocket server, a React/Vite client, the per-bus freshness guard, a latest-state store, a controlled animation-frame render loop, measured metrics, and a headless burst/load harness. Step 10 changed submission documentation only; no application code was changed.

## Verified results

From `docs/TEST_RESULTS.md` (Step 9, Node.js `v24.22.0`, npm `11.19.1`):

- `npm test`: 24 passed, 0 failed. The normal feed integration test measured 60.07 updates/sec; the short burst integration test measured 2,977.18 messages/sec and observed stale rejections.
- `npm run load-test`: baseline 60.10 updates/sec across 30 buses; three burst averages were 2,997.84, 2,995.34, and 2,995.34 messages/sec.
- The three bursts produced 5,826 stale rejects and 0 displayed sequence regressions/resurrections. Final accepted sequences converged to each bus's highest produced sequence.
- Across the 50 ms state-age samples, the worst bus maximum was BUS-08 at 439 ms; p99 across sampled bus-age values was 31 ms. This measures headless store state age, not browser paint.
- The store retained 30 entries. Forced-GC heap usage rose from 8,773 KiB to 9,907 KiB, a 1,134 KiB increase against the documented 12,288 KiB allowance.
- The first automatic burst began 45.00 seconds after the first client connected. A second client connected 20.01 seconds after the first; the burst began 25.00 seconds after that second connection, so it did not reset the timer.
- A clone of the Step 9 committed tree installed 42 packages, started the server and Vite, returned HTTP 200 with the React entry script, and was shut down and deleted. Alternate ports were used because default ports were occupied.

## Browser evidence and remaining limits

The user's recorded browser checks confirmed that the fleet table continued updating during a burst and that the server logged the injected BUS-07 out-of-order line. Earlier Step 3/4 checks confirmed WebSocket reconnect behavior and the table's 30 sorted rows with visible OPEN/CLOSED transitions.

The metric and disconnect readings in the supplied Step 5/7/8 browser report were placeholders (`<REAL>` and `<shown / not shown>`). Therefore the browser-visible rate rise, React commits/sec, rAF rate, browser age values, BURST indicator, and disconnect-age behavior remain **PENDING-BROWSER**. The headless load test does not substitute for those measurements.

## Milestone commits

| Milestone | Commit |
|---|---|
| Step 0 — workspace ready | `91fb9a1` |
| Step 1 — project skeleton | `540af21` |
| Step 2 — simulator | `1db7bf0` |
| Step 3 — WebSocket and browser confirmation | `5f68623`, `ed76c62` |
| Step 4 — fleet table and browser confirmation | `b2e8a3b`, `bdb61d0` |
| Step 5 — sequence guard | `00f3638` |
| Step 6 — render loop and browser confirmation | `9106f41`, `0c02a3d` |
| Step 7 — burst and browser confirmation | `74d99c6`, `5f4b7d9` |
| Step 8 — metrics and browser confirmation | `6cb48f1`, `8ea27f1` |
| Step 9 — load test, results, and clean-start check | `85aeecf` |
| Step 10 — decisions and demo prep | Recorded in the current Step 10 commit. |

## Submission items

- `DECISIONS.md` and `DEMO_SCRIPT.md` are the Step 10 written preparation.
- The video is not recorded; the user must record it.
- `docs/ai-transcript/` has `step-00-workspace-relocation-session-log.md` and `step-01-project-skeleton-session-log.md`. These are session notes, not the full AI chat transcript; the full transcript remains for the user to add.
- `CHANGES_LOG.md` has an empty AI Suggestions Log. The demo outline names two real harness issues as candidates but does not attribute them to AI or write a log row.

## Source of Truth §9 consistency check

| Submission item | Status | Evidence / remaining work |
|---|---|---|
| Working source code and scripts | DONE | Server, client, simulator, unit/integration tests, and `scripts/load-test.js` are present; current `npm test` and `npm run load-test` runs passed. |
| README prerequisites, one startup command, test and load-test commands | DONE | README documents Node.js 22.19+ LTS, npm, `npm start`, `npm test`, and `npm run load-test`. The commands and documented PowerShell burst controls were exercised in this session. |
| DECISIONS.md | DONE | Created with the selected design, rejected alternatives, costs, assumptions, trade-offs, scale risks, and next steps. |
| 5–10 minute demo video | MISSING | `DEMO_SCRIPT.md` is prepared; the user still needs to record the video. |
| Full AI chat transcript | MISSING | `docs/ai-transcript/` contains only the two setup session notes listed above, not the full development chat. The user still needs to add the transcript. |

### README command verification from Step 10

- PowerShell `$env:NODE_USE_SYSTEM_CA = '1'; npm install` → success; `up to date, audited 45 packages in 4s`, 0 vulnerabilities.
- `npm start` with `PORT=8094` to avoid the already-running server → server started on 8094; Vite selected 5175 because 5173 and 5174 were occupied. HTTP returned 200 and referenced `/src/main.jsx`; a WebSocket client through Vite `/feed` received a valid eight-field message. `POST http://localhost:8094/burst` returned `{"ok":true,"started":true}`. Both processes were stopped; the pre-existing port-8080 process was left untouched.
- `BURST_ON_START=1 npm start` with `PORT=8095` → server logged an immediate burst and the injected BUS-07 out-of-order message. The process was stopped after the burst.
- `npm test` → 24 passed, 0 failed in 9.629 seconds.
- `npm run load-test` → passed every check: baseline 59.91/sec; burst averages 2,995.84, 2,994.01, and 2,996.84/sec; 5,727 stale rejects; 0 state regressions; worst sampled age 55 ms; heap growth 1,113 KiB within 12,288 KiB; automatic burst at 45.02 seconds; later client did not reset the timer.

The browser UI itself was not manually inspected in this Step 10 session. Browser-visible honesty-panel values remain pending because the previously supplied readings were placeholders.

## Current tracked project shape

Root instructions, README, decisions, demo outline, npm workspaces, server, client, load-test script, source document, test results, and session notes are present. `node_modules/` is ignored. A root-level untracked `PROJECT_CONTEXT.md.pdf` is present; it is user data and has been left untouched. This Markdown file is the requested current context document under `docs/`.
