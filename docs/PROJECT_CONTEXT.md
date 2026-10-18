# Live Fleet Board Project Context

Updated: 2026-10-18. Project root: C:\Users\adity\OneDrive\Desktop\busfleet.

## Current state

The implementation for Steps 0–9 is complete and Step 11's browser-triggered burst is implemented and manually confirmed. Step 10 documentation is prepared. The final demo recording is user-reported to exist and to be in editing; no MP4 was found in this repository. Final editing, export, review, and delivery remain. The separate planning-assistant transcript named in the AI log is not present.

At the beginning of this pass, master was synchronized with origin/master at cf46653092552bdf03c9d31045861dca0ac1ec21. This pass records the current final documentation, verification, and packaging results.

## Latest automated verification

Run on 2026-10-18 with Node.js v24.22.0 and npm 11.19.1.

- npm test: PASS, 24 passed / 0 failed in 10.453 seconds. Normal feed: 182 messages in 3.004 seconds (60.59/sec). Burst integration: 6,002 messages in 2.017 seconds (2,975.71/sec), 639 out-of-order frames, and 639 stale rejects.
- npm run build --workspace=client: PASS, Vite 8.3.4, 22 modules, 374 ms.
- npm run load-test: PASS. Baseline 59.99 updates/sec across 30 buses with no normal-mode reordering. Three burst averages were 2,992.85, 2,994.34, and 2,993.85/sec, with peak buckets 3,060, 3,033, and 3,028/sec. Stale rejects totaled 5,705; state regressions/resurrections were 0. The worst sampled headless age was 126 ms on BUS-01; p99 sampled age was 43 ms. The store remained at 30 entries, and all accepted sequences converged to their highest produced sequence.
- Three-burst memory soak: heap used rose from 8,792 KiB to 9,911 KiB (1,119 KiB) within the 12,288 KiB allowance. Shutdown cleanup passed.
- Automatic timing: the first burst started 45.01 seconds after client 1 connected. Client 2 connected 20.02 seconds after client 1, and the burst started 24.99 seconds after client 2, so the timer was not reset.

The load test measures accepted-state age, not browser paint. These commands passed in this pass; no browser session or clean-clone install was repeated.

## Browser evidence and limits

The user-reported Chrome check on 2026-10-17 confirmed the Step 11 button's initial, started, already-running, and server-stopped states. With the server stopped, the button showed exactly “Burst request failed: Server returned HTTP 502”; separately, the WebSocket showed disconnected and the incoming rate fell to 0. After restart the WebSocket reconnected, the button worked again, and the feed returned to normal after the burst.

Earlier browser evidence recorded normal incoming traffic around 60–61 updates/sec, 58–60 React commits/sec, and 116–121 rAF callbacks/sec. The burst screen recording started mid-burst and showed 2,525 then 1,281 incoming updates/sec, with 78 then 70 commits/sec and 121 rAF callbacks/sec. Max staleness was 201 then 481 ms during that clip, with a ten-second peak of 502 ms; normal current max age was 470–497 ms and the ten-second peak was 502–508 ms. A separate button-triggered browser report recorded 2,979–3,034 incoming updates/sec, 84 commits/sec against 107 rAF callbacks/sec, and 511 ms peak staleness. These are user-reported readings, not a fresh browser measurement in this pass.

The automatic timer and server log are verified by automated checks and the user's terminal report, but the browser's visible feed-rate rise during an automatically started burst has not been separately recorded. The user reported seeing the server's injected BUS-07 line during a manually started burst. The disconnected-state report confirms status and feed rate zero; the reported evidence does not explicitly confirm a red STALE badge after ages pass 1,000 ms. Shutdown terminal output included repeated WebSocket send error: write ECANCELED messages during teardown, followed by SIGINT received; shutting down and server stopped. This is recorded as output, not proof of a functional defect.

React commit rate and rAF callback rate are measured separately. They do not measure compositor paint latency. The headless test measures accepted-state age, not whether a browser painted the state.

## Submission acceptance state

| Requirement | State | Evidence or remaining item |
|---|---|---|
| Normal operation | DONE | Automated baseline and user-reported browser view show 30 buses and about 60 updates/sec. |
| Automatic burst | MINE-TO-DO | Server timing and logs pass, but the page-side automatic start and visible feed-rate rise still need to be captured. |
| Freshness | DONE | Final headless run's worst sampled age was 126 ms; prior user-reported browser burst peak was 502 ms. |
| Out-of-order protection | DONE | Final load run recorded 5,705 stale rejects and zero state regressions; BUS-07 remained CLOSED at the highest sequence. |
| Bounded rendering | DONE | Store held 30 entries; fake-rAF tests coalesced updates. Browser measurements are tied to offered rAF cadence, not a fixed 60 Hz limit. |
| Honesty panel | DONE | User-reported normal/burst values are recorded; React commits and rAF callbacks are distinct metrics. |
| One-command startup | DONE | README documents npm start; historical clean-clone check started both services and returned HTTP 200. |
| Decision document | DONE | DECISIONS.md has choices, alternatives, costs, trade-off, assumptions, stack, scale prediction, omissions, next steps, and 15-hour report. |
| Demo video | MINE-TO-DO | The user reports the recording exists and is being edited. No MP4 is in the repository; finish the edit, verify the 5–10 minute duration/audio/content, and deliver it. |
| AI transcript exports | DONE | Three existing Codex exports and two setup notes are present; no newer project session logs were found under .codex/sessions. |
| Planning-assistant transcript cited in the AI log | MISSING | docs/ai-transcript/planning-chat.md is absent. Add the original if that separate conversation is required; do not reconstruct it. |

## Transcript inventory

The existing docs/ai-transcript/ folder has three Codex session exports and two setup notes. The exported transcripts contain 158 User/Assistant message headings in total. No newer project session JSONL logs were found in %USERPROFILE%\.codex\sessions, so no new transcript export was created.

| Existing export | Messages | First timestamp | Last timestamp |
|---|---:|---|---|
| codex-session-2026-10-15-01a13e43.md | 148 | 2026-10-15T06:32:36.031Z | 2026-10-16T08:48:11.257Z |
| codex-session-2026-10-15-01a13e55.md | 5 | 2026-10-15T06:52:33.791Z | 2026-10-15T06:52:51.581Z |
| codex-session-2026-10-15-01a13e5a.md | 5 | 2026-10-15T06:57:39.018Z | 2026-10-15T07:01:14.234Z |

The two setup notes are step-00-workspace-relocation-session-log.md and step-01-project-skeleton-session-log.md; they are notes, not full conversation exports. docs/ai-transcript/planning-chat.md is absent.

## Remaining manual actions

- Finish and export the recorded demo, check the audio and duration, and include the four required topics.
- In the video, show the automatic burst on the page if it occurs, and show the button burst, out-of-order server line, stale count, metrics, and server-only disconnect. Wait until bus age exceeds 1,000 ms and show the red STALE badge; if it does not appear, record that as a failed check.
- Add the original planning-assistant transcript if the assignment requires it.
- Upload the final video and any required source archive to the assignment destination.
