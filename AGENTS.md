# AGENTS.md — Live Fleet Board

> Place this file in the ROOT of the repo. Codex reads it at the start of every session,
> so these rules apply to every prompt without needing to be repeated.

## 1. What we are building

A React dispatch dashboard for **30 simulated buses**, fed by a **real Node.js server over WebSocket**.
Under sudden data bursts the UI must stay **fresh** and must **never let an older update overwrite a newer one**.
Full spec: `docs/SOURCE_OF_TRUTH.docx` (read it if anything below is unclear).

**Core design decision (never violate):**
Freshness over complete motion — accept only newer updates per bus, coalesce them into a
latest-state map, and render that map on the browser's animation frame.

## 2. Non-negotiable requirements

- Exactly 30 buses, stable IDs (`BUS-01` … `BUS-30`).
- Every update has: `runId`, `busId`, `seq` (per-bus, strictly increasing), `ts` (production time, ms epoch),
  `x`, `y` (simple grid coordinates are fine), `speed`, `door` (`"OPEN"` | `"CLOSED"`).
- Normal feed: ~2 updates/sec per bus (~60 msgs/sec total).
- Burst feed: all buses emit ~50× normal rate for several seconds. First burst must start automatically
  **within 1–2 minutes of the page being opened**; then repeat every few minutes.
- During bursts, the generator sometimes delivers updates for the same bus **out of order**,
  and includes OPEN→CLOSED door transitions so a stale OPEN could expose a bug.
- Displayed state for each bus must be **≤ 1000 ms behind** the newest state the simulator produced.
- **No resurrection:** a stale update (seq <= newest accepted seq for that bus) is rejected. Old OPEN must never undo newer CLOSED.
- **Honesty panel** with MEASURED values (never hard-coded): incoming feed rate, actual UI repaint rate (FPS),
  per-bus displayed-state age in ms, plus max/current staleness. Excessive staleness must be visibly flagged. No permanent "LIVE" label.
- Header shows project name + WebSocket status (connected/disconnected).
- Fleet table shows: bus ID, position, speed, door state (obvious OPEN/CLOSED), last accepted seq, age in ms.

## 3. Architecture (keep these boundaries)

1. Node.js simulator (`server/simulator.js`) — creates buses, produces telemetry.
2. WebSocket server (`server/index.js`, `ws` library) — separate server/client boundary.
3. Freshness guard + latest-state store (`client/src/lib/fleetStore.js`) — pure JS, no React imports, unit-testable.
4. Controlled render loop — `requestAnimationFrame` publishes the latest snapshot to React at most once per frame.
   **NEVER call a React state setter per WebSocket message.** WebSocket handler only: parse → guard → write to Map → bump counters (refs/plain variables).
5. React dashboard — renders 30 rows + honesty panel.

## 4. Stack (do NOT silently change)

- Node.js 20+, `ws` for WebSocket, React + Vite for the client, `concurrently` to start everything.
- npm workspaces. Plain JavaScript (no TypeScript) unless the user asks.
- No database, auth, deployment tooling, Web Worker, state-management library, or unrelated features.
- If you believe a deviation is needed: STOP, explain why, and log it in `CHANGES_LOG.md` under **Deviations** and in `DECISIONS.md`.

## 5. Repo layout

    live-fleet-board/
      AGENTS.md  README.md  DECISIONS.md  CHANGES_LOG.md  package.json
      docs/        SOURCE_OF_TRUTH.docx  TEST_RESULTS.md  ai-transcript/
      server/      index.js  simulator.js  config.js
      client/      (Vite + React)  src/lib/fleetStore.js  src/components/...
      scripts/     load-test.js

Root npm scripts (keep these names): `npm start` (server + client together), `npm test` (unit tests),
`npm run load-test` (headless burst test against the running server).

## 6. MANDATORY: change tracking

After **every task** (every prompt the user gives you), before you reply, update `CHANGES_LOG.md`:

1. Append a new entry at the TOP of the "Change Log" section using the template inside that file.
2. Update the **Step Status** table (status + date).
3. Record: files created / modified / deleted, what changed and **why**, tests run with actual results,
   known issues, and any deviation from this file or the spec.
4. If the user rejects or you correct a bad suggestion, add a row to **AI Suggestions Log**.
5. Never rewrite or delete old entries. Append only. Never claim a test passed unless you actually ran it and saw it pass.

## 7. Working rules

- Work on ONE step at a time. Do only what the current prompt asks. Do not build ahead.
- Correctness over polish. Do not spend time on beautiful design.
- Before finishing a step: run what you built, show the real output, and state what is verified vs not verified.
- Keep code small and readable. Comment WHY on the freshness guard, the rAF loop, and the burst/out-of-order logic.
- Do not add dependencies without saying why. Pin nothing exotic.
- End every reply with: (a) what changed, (b) how to verify it, (c) known limitations, (d) confirmation that `CHANGES_LOG.md` was updated.
- If the spec and your instinct disagree, follow the spec and tell the user.
