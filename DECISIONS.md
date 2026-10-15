# Design decisions

## What was chosen and why

- **A Node.js simulator and a real WebSocket boundary.** The simulator produces timestamped updates with a stable bus ID and a per-bus sequence; the browser receives the same JSON feed a separate client would use.
- **A latest-state map with a per-bus sequence guard.** Only an update newer than the accepted sequence can replace that bus's state. During bursts, arrival order is deliberately unreliable, so sequence order is the evidence of freshness. The store overwrites intermediate states instead of building a queue.
- **A `requestAnimationFrame` publisher.** Incoming WebSocket messages update the plain JavaScript store. The render loop publishes at most one snapshot per frame, and React renders that snapshot. This coalesces traffic to the browser's available repaint cadence.
- **Measured metrics and a headless load test.** The dashboard shows measured feed, render, frame, and age values; the load test exercises the same store guard and reports state-store age separately from browser paint.
- **The requested npm workspace stack.** The server uses `ws`; the client uses React and Vite; `npm start` starts both together. The Vite development proxy forwards `/feed` to the server.

The Step 9 run measured a normal feed of 60.10 updates/sec and burst averages of 2,997.84, 2,995.34, and 2,995.34 messages/sec. The three bursts produced 5,826 stale rejections and zero displayed state regressions or door resurrections. These are measurements from the headless client, not browser paint timings.

## Alternatives considered and rejected

- **`setState` for every message:** rejected because UI work would be tied to feed arrival and could overwhelm rendering during a burst.
- **Queue every update:** rejected because it preserves intermediate motion at the cost of replaying old states and increasing lag and memory use. Freshness is the priority.
- **A Web Worker:** rejected for this measured scope. Parsing happens on the main thread, but the project has not measured it as a bottleneck that justifies worker complexity.
- **Polling:** rejected because it adds repeated request/response overhead and does not provide the continuous push feed required here.
- **Server-Sent Events:** rejected because the project uses a bidirectional-capable WebSocket transport and already tests it end to end.
- **A state library such as Redux:** rejected because one latest-state map and one snapshot publisher meet the current state needs without another dependency or state abstraction.
- **Arrival-order “last write wins”:** rejected because the server intentionally delays some burst messages. An older sequence can arrive after a newer one and otherwise restore stale state, including an old OPEN door state.

## Setup and complexity costs

The project has two npm workspaces, server and client, plus root scripts for startup, unit tests, and the load test. `npm install` installs the workspace dependencies; `npm start` runs the server and Vite client together. A clean clone of the Step 9 tree installed 42 packages in 11 seconds. No database, authentication service, or deployment layer is required for this simulation.

The main complexity is coordinating simulator production time, burst delivery order, client freshness checks, and rendering without retaining a backlog. This is covered by direct store tests, fake-clock/fake-rAF tests, WebSocket integration tests, and the load test. The load test took three bursts through one store and observed a 1,134 KiB heap increase, within its documented 12,288 KiB allowance; that is evidence for this test run, not a general memory guarantee.

## Trade-offs

We intentionally lose intermediate motion detail. If several updates for one bus arrive between browser paints, only the latest accepted state is displayed. That keeps the displayed fleet fresh and prevents a queue of old positions from replaying after a burst. A 60 Hz display is an upper repaint cadence, not a promise that every update will be shown.

## Assumptions

- The browser and server use one machine clock in the tested setup; age is `now - ts`. Clock skew can affect ages if they run on different machines.
- Telemetry is simulated, not a live vehicle feed.
- `x` and `y` are simple grid coordinates.
- `runId` is included in each message so a client can recognize a simulator restart and reset its per-bus sequence state.
- Vite proxies the `/feed` WebSocket path to the configured server port during development.
- The automatic burst timer starts when the first WebSocket client connects; a later client does not restart it.

## What breaks at 10x scale

The current measured burst rate is about 3,000 messages/sec for 30 buses. A linear 10x projection is about 300 buses and 30,000 messages/sec; that is an estimate, not a measurement from this project. At that scale, likely pressure points are JSON parsing on the main thread, server fan-out, and per-client socket backlog. The first responses to measure would be:

- Server-side batching or coalescing, if profiling shows serialization or fan-out is limiting.
- Per-client backpressure using `ws.bufferedAmount`, so a slow socket cannot accumulate unbounded pending data.
- A Web Worker only if measured main-thread JSON parsing or store work is a bottleneck.
- Table virtualization if rendering the larger fleet becomes expensive.
- Clock-skew handling if producers and browsers run on different machines.
- Explicit coordination and run identity if the service runs as multiple server instances.

These are scale-up investigation points, not features already implemented or measured.

## Next steps

- Record the demo video using `DEMO_SCRIPT.md` and capture real browser metric values rather than placeholders.
- Add the full AI chat transcript used during development; the current transcript folder contains only two setup session notes.
- Choose a real logged AI suggestion for the video. The AI Suggestions Log is empty today, so this document does not attribute an observed harness issue to an AI suggestion.
- If the deployment target changes to multiple machines or a much larger fleet, measure clock skew, feed processing, and per-client backpressure before adding complexity such as a worker or a state library.
