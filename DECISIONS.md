# Design decisions

## What I chose to run and why, versus the alternatives

I chose a React dashboard fed by a separate Node.js WebSocket server. The simulator sends timestamped updates; the browser accepts each bus's newest sequence into a latest-state map and publishes snapshots with `requestAnimationFrame`. That division keeps transport, freshness checks, and rendering separate. It also lets the server deliberately reorder some burst deliveries so the sequence guard can be exercised against the condition it is meant to prevent.

For the dashboard, I chose to overwrite intermediate updates in the latest-state map rather than queue them. For transport, I chose WebSocket push rather than polling. For the current state model, I chose a small plain-JavaScript store instead of a general state library. These choices fit a single-page, 30-bus simulation whose goal is current state, not a replayable movement history. The measured runs are evidence for this tested scope, not a capacity claim for a production fleet.

## Alternatives seriously considered and rejected

- **React `setState` for every message:** unsuitable here because it ties UI work to feed arrivals, including burst traffic, even though the display cannot present every intermediate update.
- **Queue every update:** unsuitable because it preserves the full motion history but can force the dashboard to replay old positions after the feed has moved on. That conflicts with the dispatcher's need to decide from current state.
- **Polling:** unsuitable for this continuous feed because it adds repeated request/response work and can leave the view between polls without the newest update.
- **Server-Sent Events:** unsuitable for the chosen transport boundary because the project already uses WebSocket and exercises that connection end to end. SSE could carry server-to-browser telemetry, but would replace rather than simplify the tested boundary.
- **Redux or another state library:** unsuitable for the current state shape: one latest update per bus and one snapshot publisher. It would add a dependency and concepts without a demonstrated need in this dashboard.
- **Arrival-order “last write wins”:** unsuitable because burst frames are deliberately delayed. An older sequence can arrive later and otherwise restore an old position or OPEN door state.
- **A Web Worker:** not added for the tested scope. The browser measurements show the application meeting the recorded freshness target while parsing on the main thread, but they do not measure JSON-parse CPU time or isolate parsing as a cost. The measured evidence and its limits are explained below; profiling would be required before deciding a worker is warranted.

## Setup time, operational complexity, and moving parts

The clean-clone check in `docs/TEST_RESULTS.md` installed 42 packages in 11 seconds. The documented setup is `npm install`, followed by the single user-facing startup command `npm start`. That command starts both the Node server and Vite client through `concurrently`; Vite proxies the browser's WebSocket feed and development burst request to the server.

The small setup has several runtime pieces: the simulator and its normal/burst schedulers, the HTTP/WebSocket server, Vite's development server and proxies, the browser's sequence-guarded store and render loop, and the React dashboard. Tests and the load-test harness add verification code. Operationally, the person running the demo needs the server and client available together; a server-only stop is useful for checking disconnect behavior. There is no database, authentication service, or deployment layer. The complexity cost is coordinating timestamps, per-bus sequence state, intentional out-of-order delivery, request errors, and cleanup across those pieces.

## Rejected Web Worker, based on measured evidence

In the user's browser recording, captured mid-burst, the incoming rate read 2,525 then 1,281 updates/sec, React commits read 78 then 70/sec, and browser animation-frame callbacks read 121/sec. Current maximum staleness read 201 then 481 ms, with a 10-second peak of 502 ms. Normal traffic later showed current maximum staleness of 470–497 ms and a 10-second peak of 502–508 ms. In the headless load test, the worst sampled per-bus maximum age in the latest recorded run was 432 ms, below the 1,000 ms limit. These figures are recorded in `docs/TEST_RESULTS.md`.

Those measurements show that freshness and render cadence met the recorded expectations in the tested setup; they do not establish that JSON parsing is free or prove that a larger fleet needs no worker. I rejected adding a worker now because the project has no measured parse-time or main-thread CPU evidence showing that a worker is needed. If profiling identifies parsing or store work as a bottleneck at a real target scale, a worker can be reconsidered with that evidence.

## Trade-off: freshness over complete motion

The explicit tension is **freshness over complete motion**. Choosing freshness costs the dashboard intermediate positions and makes it unsuitable as a full movement-history or replay view: if several updates arrive between paints, only the newest accepted state is shown. Choosing complete motion instead would mean queuing and rendering older updates after newer ones have already been produced; that costs freshness and can leave a dispatcher deciding from a position or door state that is no longer current.

For a dispatcher making a hold/no-hold decision, a current, sequence-validated snapshot is more useful than a faithful animation of every step that has already passed. The display still shows the latest accepted state and its age, and flags excessive staleness. The trade-off does not claim to preserve every event; a separate history or audit feature would need its own design if that becomes a requirement.

## Assumptions and what fails if wrong

- **Assumption: the browser and server share a machine clock in the tested setup.** What fails if wrong: clock skew distorts `now - ts`, so displayed age and the freshness threshold can be misleading.
- **Assumption: the feed is simulated telemetry with the documented fields and behavior.** What fails if wrong: this demo does not establish sensor validity, delivery guarantees, or operational safety for dispatch decisions using real vehicle data.
- **Assumption: each bus's `seq` increases monotonically within a `runId`, and a restart changes `runId`.** What fails if wrong: valid updates may be rejected as stale, or old updates may be accepted after a reset.
- **Assumption: the development page reaches one authoritative server through the Vite proxy.** What fails if wrong: clients connected to inconsistent instances may disagree on run IDs, sequence histories, or burst-control responses; multi-instance coordination is not implemented.

## Deviation from the named stack

There is **no deviation from the named React + Node.js WebSocket stack**. The implementation uses React with Vite, Node.js with the `ws` WebSocket library, npm workspaces, and `concurrently` for the one-command development startup. Vite proxies `/feed` and `/burst` to the server during development. `POST /burst` and the dashboard's **Trigger burst now** button are development controls for the existing burst mechanism; they do not replace the WebSocket telemetry path or alter its burst/out-of-order logic.

## What I would do next

First, complete the remaining human verification: confirm the Step 11 button in a browser, including the already-running and server-unavailable messages, and record the required demonstration video. The current test report distinguishes automated evidence from browser readings supplied by the user. I would keep that distinction in any final submission and avoid describing the development server as a production deployment.

If the target changes from this simulation to live vehicles or a larger deployment, I would profile the actual bottleneck before adding infrastructure. In particular, I would measure main-thread parse time, server fan-out, per-client backlog, and clock skew under the intended network and fleet size. I would preserve the freshness guard and only introduce a worker, batching, or multiple-server coordination when measurements and requirements justify the added complexity.

Next actions:

- Confirm the browser-triggered burst and request-error behavior.
- Record and deliver the 5–10 minute video using `DEMO_SCRIPT.md`.
- For any larger or live deployment, profile first, then select only the scaling changes supported by those measurements.

Hours spent:
