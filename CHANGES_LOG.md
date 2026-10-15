# CHANGES_LOG — Live Fleet Board

This file traces every change made to the project. **Codex must update it after every task** (see `AGENTS.md` §6).
Append-only: never edit or delete old entries.

---

## Step Status

| # | Step | Status | Date done | Notes |
|---|------|--------|-----------|-------|
| 0 | Kickoff / read rules | ✅ Done | 2026-10-15 | Required docs read; project files moved into a dedicated repository folder. |
| 1 | Project structure + README | ✅ Done | 2026-10-15 | Node v24.22.0; install and runtime HTTP checks passed. User should still visually confirm the rendered placeholder in a browser. |
| 2 | Node.js simulator | ✅ Done | 2026-10-15 | Simulator, update/test harnesses, and 35-second rate/door-transition check passed. |
| 3 | WebSocket server + minimal client | ✅ Done | 2026-10-15 | Feed test, client build, and user's manual browser disconnect/reconnect check passed. |
| 4 | React table (normal traffic) | ✅ Done | 2026-10-15 | Tests, client build, and user's manual browser check passed. |
| 5 | Sequence guard + latest-state map | ⬜ Not started | | |
| 6 | requestAnimationFrame render loop | ⬜ Not started | | |
| 7 | Auto burst + out-of-order + door transitions | ⬜ Not started | | |
| 8 | Honesty panel (measured metrics) | ⬜ Not started | | |
| 9 | Load/burst test + fixes | ⬜ Not started | | |
| 10 | DECISIONS.md + demo prep + transcript | ⬜ Not started | | |

Status values: ⬜ Not started · 🟨 In progress · ✅ Done · ❌ Blocked

---

## Deviations from spec / AGENTS.md

| Date | What deviated | Why | Where documented |
|------|---------------|-----|------------------|
| | | | |

---

## AI Suggestions Log
(Needed for the demo video: one incorrect or lazy AI suggestion and how it was handled.)

| Date | Step | What the AI suggested | Why it was wrong/lazy | How it was handled |
|------|------|-----------------------|-----------------------|--------------------|
| | | | | |

---

## Entry template (copy for each new entry)

    ### [YYYY-MM-DD HH:MM] Step N — <short title>
    **Prompt summary:** one line of what the user asked
    **Files created:** path — purpose
    **Files modified:** path — what changed and why
    **Files deleted:** path — why (or "none")
    **What changed (plain English):**
    **Why / design reasoning:**
    **Tests run & REAL results:** command → output summary (pass/fail)
    **Verified:** …   **Not verified:** …
    **Known issues / limitations:**
    **Deviations from spec:** none | describe
    **Next step:**

---

## Change Log (newest first)

<!-- Codex: add new entries directly below this line -->

### [2026-10-15 23:24] Step 4 follow-up — Manual browser check confirmed
**Prompt summary:** Record the user's manual Chrome/Edge confirmation of the 30-row fleet table and door-state transition; make no application changes.
**Files created:** none.
**Files modified:** `CHANGES_LOG.md` — recorded the user-confirmed browser check and cleared Step 4's pending note.
**Files deleted:** none.
**What changed (plain English):** The user confirmed 30 distinct bus rows sorted by ID, changing values without a refresh, and observed a bus transition from OPEN back to CLOSED.
**Why / design reasoning:** This completes the manual browser check that was pending after Step 4's automated checks.
**Tests run & REAL results:** No commands or automated tests were run for this documentation-only task. The browser check was performed and reported by the user.
**Verified:** User-confirmed Chrome/Edge behavior: 30 distinct sorted rows, live value updates, and an OPEN-to-CLOSED transition.
**Not verified:** I did not independently reproduce the browser check.
**Known issues / limitations:** None reported for this manual check.
**Deviations from spec:** None.
**Next step:** Step 5 — Sequence guard and latest-state map.

### [2026-10-15 23:11] Step 4 — Fleet table
**Prompt summary:** Replace the temporary raw-message view with a sorted 30-bus table showing position, speed, door, sequence, and update age, using a temporary 100 ms snapshot publisher while preserving WebSocket reconnect behavior.
**Files created:** `client/src/components/FleetTable.jsx` — presentational fleet table and memoized row component.
**Files modified:** `client/src/App.jsx` — stores incoming updates in a ref-held Map and publishes snapshots every 100 ms; `client/src/style.css` — minimal table and door-state styling; `CHANGES_LOG.md` — recorded Step 4 and updated its status.
**Files deleted:** none.
**What changed (plain English):** Replaced the last-ten raw-message view with a table that always lists BUS-01 through BUS-30 in ID order. Rows show position and speed to one decimal place, OPEN/CLOSED text labels with distinct colors, last sequence, and age calculated as `Date.now() - ts`. Rows without data show “waiting…”. The WebSocket message handler only parses and writes to the Map; a temporary interval publishes snapshots and refreshes age display.
**Why / design reasoning:** The temporary Map and interval meet this step's simpler rendering requirement while keeping React state updates out of the WebSocket message handler. Memoized rows compare sequence and age so changed telemetry and the live age display are reflected.
**Tests run & REAL results:** `npm test` → 3 tests passed, 0 failed; feed test received 180 messages in 3.012 seconds (59.76/sec), with all 30 buses and consecutive per-bus sequences. `npm run build --workspace=client` → Vite 8.3.4 transformed 17 modules and built successfully in 405ms. `git diff --check` → no whitespace errors (Git displayed LF-to-CRLF normalization notices).
**Verified:** Existing automated tests still pass and the client bundle builds. Source uses 30 stable IDs, computes the requested fields, and preserves the Step 3 reconnect sequence.
**Not verified:** I did not open a browser. Visual confirmation of all 30 rows, changing values, colored/text door labels, and an observed door change within about 30 seconds is pending the user's manual check.
**Known issues / limitations:** No sequence guard, requestAnimationFrame loop, or metrics panel was added, as requested; the 100 ms publisher is temporary for Steps 5/6.
**Deviations from spec:** None.
**Next step:** Ask the user to confirm the Step 4 browser view and door transition, then continue to Step 5.

### [2026-10-15 23:08] Step 3 follow-up — Manual browser check confirmed
**Prompt summary:** Record the user's Chrome/Edge confirmation of the Step 3 live feed, disconnect, and reconnect behavior, plus the harmless Vite proxy message; make no application changes.
**Files created:** none.
**Files modified:** `CHANGES_LOG.md` — recorded the manual browser confirmation, updated the Step Status note, and documented the reported proxy message.
**Files deleted:** none.
**What changed (plain English):** The user confirmed that `http://localhost:5173` showed connected status and scrolling raw messages, displayed disconnected after stopping only the server, and reconnected with messages resuming after the server restarted without a page refresh.
**Why / design reasoning:** This completes the manual browser check that was pending after the automated feed test and client build.
**Tests run & REAL results:** No commands or automated tests were run for this documentation-only task. Manual browser results were reported by the user, not independently observed in this session.
**Verified:** User-confirmed Chrome/Edge behavior: connected feed, server-only disconnect, and automatic reconnect after server restart without refresh.
**Not verified:** I did not independently reproduce the browser sequence.
**Known issues / limitations:** The user reported a Vite `ws proxy error: write ECONNABORTED` message when a browser WebSocket connection closed. The user described it as harmless; no impact was reported.
**Deviations from spec:** None.
**Next step:** Step 4 — React table (normal traffic).

### [2026-10-15 22:51] Step 3 — WebSocket server and minimal client
**Prompt summary:** Connect simulator updates to a real `/feed` WebSocket, build a temporary React message viewer with reconnect behavior, add a three-second feed test, and provide manual browser steps without claiming to have run them.
**Files created:** `server/feed.test.js` — node:test coverage for the live feed on an ephemeral port.
**Files modified:** `server/index.js` — HTTP/WebSocket server, simulator broadcast, client/error/count logging, per-second send totals, start handle, and signal shutdown; `client/vite.config.js` — `/feed` WebSocket proxy to the configured server port; `client/src/App.jsx` and `client/src/style.css` — temporary connection status and last-ten raw-message view with backoff reconnect and cleanup; `CHANGES_LOG.md` — recorded Step 3 and updated status.
**Files deleted:** none.
**What changed (plain English):** The server now broadcasts every simulator update as JSON to open WebSocket clients at `/feed`. The client shows connected/disconnected state and the last ten received messages, reconnecting after drops with 1s, 2s, 4s, then 5s delays. Vite proxies `/feed` to the server port from `PORT` (default 8080), so the browser uses the Vite origin.
**Why / design reasoning:** The Vite proxy keeps the debug client URL independent of the server host/port and works with the existing `npm start` setup. The feed server can also be launched by tests with a chosen port and closed through its returned handle.
**Tests run & REAL results:** `npm test` → 3 tests passed, 0 failed. The feed test received 180 JSON messages in 3.011 seconds (59.78/sec); server logs reported 58, 61, and 60 messages in successive seconds and client connect/disconnect counts of 1/0. It asserted all 30 bus IDs, the eight fields and types, and consecutive per-bus sequences. The simulator tests passed. `npm run build --workspace=client` → Vite 8.3.4 transformed 16 modules and built successfully in 894ms. `git diff --check` → no whitespace errors (Git displayed its LF-to-CRLF normalization notices).
**Verified:** Automated WebSocket feed behavior, message shape, bus coverage, per-bus sequence increments, approximate feed rate, test server closure, and client bundle compilation.
**Not verified:** I did not open a browser or manually stop/restart only the server; the visual connection status and automatic reconnect are pending the user's check. SIGINT/SIGTERM handlers were implemented but not independently exercised in this task.
**Known issues / limitations:** The client is intentionally a temporary raw-message debug view; normal dashboard rendering is for later steps.
**Deviations from spec:** None.
**Next step:** Ask the user to confirm the browser disconnect/reconnect behavior, then continue to Step 4.

### [2026-10-15 22:46] Step 2 — Telemetry simulator
**Prompt summary:** Implement the 30-bus Node simulator with per-bus sequence counters, plausible movement and door stops, staggered drift-resistant timers, a five-second raw-output script, and unit tests; verify the update rate and an OPEN→CLOSED transition before committing.
**Files created:** `server/simulator.js` — simulator class, stable bus state, per-process run ID, update callbacks, movement, stop cycles, staggered timers, and clean timer shutdown; `server/simulator.test.js` — node:test coverage for bus IDs, update shape/types, sequences, door values, and timer cleanup; `scripts/print-sim.js` — prints raw JSON updates for five seconds.
**Files modified:** `package.json` — replaced the placeholder test command with `node --test`; `CHANGES_LOG.md` — recorded Step 2 verification and updated its status.
**Files deleted:** none.
**What changed (plain English):** Added 30 buses (`BUS-01` through `BUS-30`) with independent state and sequences beginning at 1. The simulator emits plain telemetry objects, moves buses with smoothly changing speeds, schedules periodic stops with 1–3 second door-open periods, and spreads bus ticks across the normal interval. Each next tick is based on its intended time, and missed intervals are skipped rather than emitted as a catch-up burst. A per-bus rate multiplier is present for a later burst step.
**Why / design reasoning:** Independent bus timers provide staggered normal traffic and let a later burst change each bus's frequency without replacing simulator scheduling. Ticks advance from their intended schedule to limit drift; skipped late intervals avoid flooding consumers after a delayed callback.
**Tests run & REAL results:** `npm test` → 2 tests passed, 0 failed (`node --test`; 3.163 seconds total). `node scripts/print-sim.js` → ran for five seconds, printed 301 raw JSON updates plus `Stopped after 5 seconds.`; captured examples included BUS-01/02/03 with `seq: 1`, and bus start times were staggered. A separate 35-second run → elapsed 35.016 seconds, 2,101 updates, 60.00 updates/sec, 31 OPEN→CLOSED transitions (first observed on BUS-04 at seq 26), and `activeTimersAfterStop: 0`. `git diff --check` → no whitespace errors (Git only reported its configured LF-to-CRLF normalization notice for `package.json`).
**Verified:** Exactly 30 stable IDs; all eight update fields, plain-object shape, expected value types/ranges, valid door values, and consecutive per-bus sequences beginning at 1; stop clears timers and prevents later updates; five-second raw output; 35-second measured rate and OPEN→CLOSED transitions.
**Not verified:** No WebSocket integration or client rendering was attempted, as requested; the simulator was exercised directly in Node only.
**Known issues / limitations:** Burst delivery and out-of-order generation remain for Step 7. Timer scheduling and randomized driving behavior were observed in this session; rates can vary slightly under host load.
**Deviations from spec:** None.
**Next step:** Step 3 — WebSocket server and minimal client.

### [2026-10-15 22:38] Step 1 verification — Install and runtime check
**Prompt summary:** Resume Step 1 verification with manually installed Node LTS, use the system CA only in the current PowerShell process, install dependencies, verify startup and the local HTTP response, update README, and commit only if all checks pass.
**Files created:** `package-lock.json` — npm workspace lockfile generated by the successful install. `node_modules/` was generated and is ignored by Git.
**Files modified:** `README.md` — updated the Node prerequisite and added PowerShell TLS troubleshooting steps; `CHANGES_LOG.md` — marked Step 1 Done and recorded this verification.
**Files deleted:** none.
**What changed (plain English):** Used Node `v24.22.0` and npm `11.19.1`; set `NODE_USE_SYSTEM_CA=1` for the install and runtime processes only; installed dependencies; started the server and Vite client; verified the local HTTP response; then stopped the process and confirmed port 5173 was released.
**Why / design reasoning:** Node's system CA support resolved the registry certificate issue without weakening TLS verification or making a persistent environment change.
**Tests run & REAL results:** `Get-Location` → `C:\Users\adity\OneDrive\Desktop\busfleet`; `node -v` → `v24.22.0`; `npm -v` → `11.19.1`. `$env:NODE_USE_SYSTEM_CA = '1'; npm install` → `added 42 packages, and audited 45 packages in 31s`; `found 0 vulnerabilities`. `Test-Path package-lock.json` and `Test-Path node_modules` → `True`; `git check-ignore -v node_modules/example` → `.gitignore:1:node_modules/`. `npm ls --depth=0` resolved `concurrently@10.0.6`, `ws@8.22.0`, `react@19.3.1`, `react-dom@19.3.1`, `vite@8.3.4`, and `@vitejs/plugin-react@6.1.2`. `npm start` output included `[server] server starting`, `VITE v8.3.4 ready in 1248 ms`, and `Local: http://localhost:5173/`. `Invoke-WebRequest http://localhost:5173 -UseBasicParsing` → status 200; response contains `Live Fleet Board` and references `/src/main.jsx`. Ctrl+C stopped the background process; `Get-NetTCPConnection -LocalPort 5173 -State Listen` found no listener.
**Verified:** Node/npm versions; npm install and dependency tree; lockfile and ignored `node_modules`; both workspace commands started; server and Vite output; HTTP 200 and React entry reference; server stopped cleanly.
**Not verified:** I did not open a graphical browser to confirm the React placeholder is visibly rendered. User should open `http://localhost:5173` while running `npm start` to confirm the visual page.
**Known issues / limitations:** No application features were implemented. The raw HTTP HTML verifies the title and React entry, not the browser's final rendered view.
**Deviations from spec:** None.
**Next step:** Commit the verified Step 1 skeleton with `Step 1: project skeleton`.

### [2026-10-15 18:06] Step 1 follow-up — Node upgrade blocked by missing winget
**Prompt summary:** Finish Step 1 verification by upgrading Node with winget, installing dependencies, running the app, updating the README, and committing only if all checks pass.
**Files created:** none.
**Files modified:** `CHANGES_LOG.md` — recorded the winget availability check and kept Step 1 Blocked.
**Files deleted:** none.
**What changed (plain English):** Confirmed the workspace path and current Node version. `winget` was not available, so the requested stop condition was followed; no installer, npm install, application startup, README change, or commit was attempted.
**Why / design reasoning:** The user explicitly required stopping if winget is unavailable and forbade trying workarounds.
**Tests run & REAL results:** `Get-Location` → `C:\Users\adity\OneDrive\Desktop\busfleet`; `node -v` → `v23.1.0`; `winget --version` → exit code 1, PowerShell reported `The term 'winget' is not recognized as a name of a cmdlet, function, script file, or executable program.` No Node installation or npm command was run in this task.
**Verified:** Current workspace path and current Node version; winget is unavailable in this PowerShell session.
**Not verified:** Node 22.19+, dependency installation, package-lock/node_modules, runtime output, or browser response.
**Known issues / limitations:** Step 1 remains Blocked. README prerequisite/troubleshooting changes were not made because the explicit winget failure branch requires stopping. No commit was created.
**Deviations from spec:** None.
**Next step:** Install Node.js LTS 22.19+ manually from https://nodejs.org, then resume the specified install and runtime checks.

### [2026-10-15 17:52] Troubleshooting — npm install in the project directory
**Prompt summary:** Verify the active project path and manifests, run `npm install` only there, diagnose failures, and do not change application code or commit.
**Files created:** none.
**Files modified:** `CHANGES_LOG.md` — recorded the actual path, install attempt, TLS diagnosis, and remaining steps.
**Files deleted:** none.
**What changed (plain English):** Confirmed the shell was in `C:\Users\adity\OneDrive\Desktop\busfleet`, inspected the root and workspace manifests, and attempted installation there. No application code or package manifest was changed; no commit was made.
**Why / design reasoning:** The reported System32 working-directory mistake does not apply to this session; the active project path is correct. The remaining install failure is TLS trust in Node/npm, so changing dependency versions or disabling certificate verification would not be a safe fix.
**Tests run & REAL results:** `Get-Location` → `C:\Users\adity\OneDrive\Desktop\busfleet`; `Test-Path package.json` → `True`; `node -v` → `v23.1.0`; `npm -v` → `10.9.0`. Root scripts are `start`, `test`, and `load-test`; workspaces declare `concurrently`, `ws`, React, React DOM, Vite, and `@vitejs/plugin-react`. `npm install` in the project directory produced only an experimental-module warning and no progress; it was interrupted after remaining stalled. Bounded verbose retry (`npm install --fetch-retries=0 --fetch-timeout=15000 --loglevel=verbose`) exited 1: registry fetches reported `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, followed by `ETARGET No matching version found for concurrently@^10.0.6` using stale cache metadata. The npm package page lists `concurrently` 10.0.6 as published, so the manifest range is valid: https://www.npmjs.com/package/concurrently?activeTab=versions. `Invoke-WebRequest -Uri https://registry.npmjs.org/concurrently -Method Head` from PowerShell → HTTP 200. npm config reports the official registry, `strict-ssl=true`, no configured cafile or proxy; no `NODE_EXTRA_CA_CERTS`, system-CA, or proxy environment variables are set. Current Node 23.1 does not list `--use-system-ca` in `node --help`. After the failed install, `Test-Path package-lock.json` → `False` and `Test-Path node_modules` → `False`. `npm start` was not run because dependencies were not installed.
**Verified:** Correct project root and manifests; Windows PowerShell can reach the npm registry; Node/npm TLS validation fails; no lockfile or installed dependencies were produced; the root defines `npm start` for both workspaces.
**Not verified:** Application startup or browser rendering.
**Known issues / limitations:** npm cannot validate the registry certificate with Node `v23.1.0`; the stale cache then reports no matching `concurrently` version. No dependency or application-code changes were made, and no commit was created.
**Deviations from spec:** None.
**Next step:** Use a trusted CA configuration for Node/npm (for example, a Node 22.19+ installation with `NODE_USE_SYSTEM_CA=1`, supported per the [Node.js v22 CLI docs](https://nodejs.org/download/release/v22.23.3/docs/api/cli.html), or a trusted PEM via `NODE_EXTRA_CA_CERTS`), keep `strict-ssl=true`, then rerun `npm install` in this project and verify `npm start`.

### [2026-10-15 12:35] Step 1 follow-up — Record manual verification request
**Prompt summary:** User said they ran `npm install` and `npm start` in their own terminal, asked to mark Step 1 Done, add a sandbox network rule, and commit the project skeleton.
**Files created:** none.
**Files modified:** `AGENTS.md` — added the requested section 7 rule to have the user run network-dependent commands and wait for their result; `CHANGES_LOG.md` — recorded this follow-up and updated Step 1 notes based on the observed workspace state.
**Files deleted:** none.
**What changed (plain English):** Added the requested network-access instruction. Checked for install artifacts and the ignore rule. The Step 1 status remains Blocked because the prompt still contains `<paste what happened...>` rather than the actual runtime result, and neither `package-lock.json` nor `node_modules` exists in this workspace.
**Why / design reasoning:** The project rules require recording real results and prohibit claiming a check passed without seeing its output. The manual runtime outcome was not provided, so it cannot be recorded as successful or used to mark Step 1 Done yet.
**Tests run & REAL results:** `Test-Path package-lock.json` → `False`; `Test-Path node_modules` → `False`. `git check-ignore -v node_modules/example` → `.gitignore:1:node_modules/` (ignored). No npm command or browser check was run by Codex in this follow-up. The user's message contains no actual terminal output.
**Verified:** `node_modules` is ignored; this workspace currently has neither `package-lock.json` nor `node_modules`.
**Not verified:** Whether the user's local `npm install` succeeded, whether `npm start` started both workspaces, and whether the page rendered.
**Known issues / limitations:** Actual manual results are still needed before Step 1 can be marked Done. No commit was made pending that result.
**Deviations from spec:** None.
**Next step:** User provides the actual terminal result; then check the install artifacts, update the status accurately, and create the requested commit if verification succeeded.

### [2026-10-15 12:31] Step 1 — Project structure + README
**Prompt summary:** Create the npm workspace skeleton, minimal server configuration, Vite + React placeholder, and README; install and run the app for verification.
**Files created:** `package.json` — root npm workspaces/scripts; `server/package.json`, `server/index.js`, `server/config.js` — minimal server workspace and env-overridable constants; `client/package.json`, `client/index.html`, `client/vite.config.js`, `client/src/main.jsx`, `client/src/App.jsx`, `client/src/style.css` — Vite + React placeholder; `README.md` — project setup and commands; `docs/ai-transcript/step-01-project-skeleton-session-log.md` — session record.
**Files modified:** `CHANGES_LOG.md` — added this entry and marked Step 1 blocked after runtime verification was prevented by registry DNS failure. `.gitignore` was reviewed and left unchanged because it already ignores `node_modules/`, `dist/`, and `*.log`.
**Files deleted:** none.
**What changed (plain English):** Added the requested npm workspaces and scripts, a server entry point that only logs `server starting`, the requested config defaults with environment overrides, and a React placeholder page titled “Live Fleet Board.” No simulator, WebSocket behavior, or dashboard features were implemented.
**Why / design reasoning:** Establish the required project structure without building ahead of Step 1.
**Tests run & REAL results:** `node -v` → `v23.1.0`. `node server/index.js` → `server starting`. `node --check server/index.js` and `node --check server/config.js` exited 0. JSON parsing of all three package manifests passed. Direct config checks passed for all defaults (`8080`, `30`, `2`, `50`, `6000`, `45000`, `180000`) and for environment overrides. `git check-ignore -v node_modules/example dist/example logs/example.log` confirmed all three patterns. `npm install` could not resolve dependencies: npm reported `getaddrinfo ENOTFOUND registry.npmjs.org`; a bounded verbose retry confirmed this for the requested packages. `npm start` failed with `'concurrently' is not recognized as an internal or external command`. Browser navigation to `http://localhost:5173` returned `net::ERR_CONNECTION_REFUSED`.
**Verified:** Node is `v23.1.0`; server placeholder logs as specified; package JSON and server syntax are valid; config defaults and overrides work; `.gitignore` already covers the required paths.
**Not verified:** Dependency installation, both workspaces starting together, or the rendered placeholder page, because npm registry DNS resolution failed and `node_modules` could not be installed.
**Known issues / limitations:** No `node_modules` or `package-lock.json` was created. The app cannot be run until `registry.npmjs.org` is reachable. No Step 1 commit was made because the requested install/start/page verification did not succeed.
**Deviations from spec:** None in the project files; runtime verification is blocked by environment network resolution.
**Next step:** Restore npm registry access, run `npm install` and `npm start`, verify the page at `http://localhost:5173`, then mark Step 1 Done.

### [2026-10-15 12:21] Step 0 follow-up — Make busfleet the project root
**Prompt summary:** Copy the project setup into the active `busfleet` workspace, initialize Git if needed, verify the copies, and create the workspace-ready commit.
**Files created:** `AGENTS.md`, `.gitignore`, `docs/SOURCE_OF_TRUTH.docx`, and the copied `docs/ai-transcript/` session log.
**Files modified:** `CHANGES_LOG.md` — added this entry naming `C:\Users\adity\OneDrive\Desktop\busfleet` as the project root because the earlier Codex session was opened on this folder.
**Files deleted:** none.
**What changed (plain English):** Copied the project files from `C:\Users\adity\Projects\live-fleet-board` into the active workspace without moving or overwriting anything, initialized Git in `busfleet`, and prepared the first commit.
**Why / design reasoning:** Keep all project work in the folder that Codex is already using, avoiding a workspace mismatch.
**Tests run & REAL results:** No application tests (no app code written). `git init` succeeded and `git rev-parse --is-inside-work-tree` returned `true`. `Get-FileHash -Algorithm SHA256` matched the source for `AGENTS.md`, `CHANGES_LOG.md`, `.gitignore`, `docs/SOURCE_OF_TRUTH.docx`, and every file under `docs/ai-transcript/` before this entry was added. The copied `CHANGES_LOG.md` hash intentionally changes after this requested entry.
**Verified:** Required file paths exist; original files remain in the Projects source folder; no destination conflicts were present; Git author identity is configured.
**Not verified:** Application behavior (not implemented in this task).
**Known issues / limitations:** The workspace copy of `CHANGES_LOG.md` differs from the source copy because this new workspace-root entry was requested.
**Deviations from spec:** None.
**Next step:** Continue future work with `C:\Users\adity\OneDrive\Desktop\busfleet` as the project root.

### [2026-10-15 12:13] Step 0 follow-up — Isolate project files from Downloads
**Prompt summary:** Move the project instructions, changelog, and source document into a dedicated live-fleet-board folder, initialize Git, and leave application code untouched.
**Files created:** `.gitignore` — ignore dependencies, build outputs, logs, and local environment files; `docs/ai-transcript/step-00-workspace-relocation-session-log.md` — accurate session log.
**Files modified:** `CHANGES_LOG.md` — added this entry and refreshed Step 0 status notes.
**Files deleted:** none; three project files were moved from Downloads to the repository.
**What changed (plain English):** Created `C:\Users\adity\Projects\live-fleet-board`, moved `AGENTS.md` and `CHANGES_LOG.md` to its root, moved the source document to `docs/SOURCE_OF_TRUTH.docx`, created `.gitignore`, and ran `git init`.
**Why / design reasoning:** Keep the project separate from Downloads and make the intended repository root explicit.
**Tests run & REAL results:** No application tests (no application code exists). `git init` succeeded. SHA-256 before/after move matched for all three files; source document hash: `07BCB28A5443A68BBD27322A493E38CD5DD4719BEC A670F7FC8D96866362DC03` (line break in display omitted); Git reported no commits yet and the expected project files as untracked.
**Verified:** Project root and docs file paths exist; `.git` exists; the files match their pre-move hashes; Downloads source paths are no longer present.
**Not verified:** The current Codex session has not been reopened with the new folder as its workspace; no project commit was made.
**Known issues / limitations:** `CODEX_PROMPTS.md` remains in Downloads at `C:\Users\adity\Downloads\CODEX_PROMPTS.md`; the user can paste Prompt 1 from that copy after opening the new project folder. No app source or README has been created.
**Deviations from spec:** None; added the `.gitignore` required by the original setup instructions.
**Next step:** Reopen Codex with `C:\Users\adity\Projects\live-fleet-board` as the project folder, verify the three required files, then paste Prompt 1.

### [2026-10-15 12:08] Step 0 — Read project rules and source of truth
**Prompt summary:** Read AGENTS.md, CHANGES_LOG.md, and docs/SOURCE_OF_TRUTH.docx; summarize scope and risks; mark Step 0 Done.
**Files created:** none
**Files modified:** C:\Users\adity\Downloads\CHANGES_LOG.md — recorded this task and updated Step 0 status.
**Files deleted:** none
**What changed (plain English):** Read the project rules and change log, and reviewed the available Live Fleet Board specification. No application code was written.
**Why / design reasoning:** Followed the user's no-code instruction and recorded the completed kickoff review.
**Tests run & REAL results:** none (documentation review only). Path checks: the workspace project files and expected docs/SOURCE_OF_TRUTH.docx were absent; the source candidate's DOCX text extraction completed successfully.
**Verified:** AGENTS.md and CHANGES_LOG.md were read from Downloads; source document text was read from C:\Users\adity\Downloads\Live_Fleet_Board_Project_Source_of_Truth.docx; Step 0 status entry updated.
**Not verified:** The source file's identity as the intended original was not independently confirmed; it is not present at the expected project path `docs/SOURCE_OF_TRUTH.docx`.
**Known issues / limitations:** The project repository and expected source-document path do not exist in the workspace.
**Deviations from spec:** Read the matching source document from Downloads because the expected project path was absent; did not copy or modify it.
**Next step:** Confirm/place the original source document at the expected project path before starting Step 1.

### [Project start] Step 0 — Planning files created
**Prompt summary:** Created AGENTS.md, CHANGES_LOG.md, and CODEX_PROMPTS.md from the Source of Truth document.
**Files created:** AGENTS.md, CHANGES_LOG.md, CODEX_PROMPTS.md
**Tests run & REAL results:** none (documentation only)
**Next step:** Step 1 — project structure + README
