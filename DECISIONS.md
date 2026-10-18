# Live Fleet Board Decisions

## What I chose and why

I chose React with a Node.js WebSocket server because the brief names that stack. I built a 30-bus simulator, a per-bus sequence guard, a latest-state map, and a requestAnimationFrame publish loop. The client keeps the newest accepted update for each bus instead of replaying every position. That gives a dispatcher a current view for a hold/no-hold decision.

## Setup and complexity costs

Setup took troubleshooting. npm install on Node 23.1.0 failed certificate verification with UNABLE_TO_VERIFY_LEAF_SIGNATURE. I installed a newer Node LTS and set NODE_USE_SYSTEM_CA=1 for the install while keeping TLS verification enabled. Codex was first opened on the wrong folder, and I moved the project work into C:\Users\adity\OneDrive\Desktop\busfleet, which is inside OneDrive. My first two screen recordings were silent or captured the wrong tab, so I had to redo them. I did not track setup time separately; my total reported project time is 15 hours.

Measured in the clean-clone check: npm install added 42 packages in 11 seconds.

The normal launch is one command, npm start, which uses concurrently to run the server and Vite client. The moving parts are npm workspaces, the simulator and burst scheduler, the ws WebSocket server, Vite and its /feed and /burst proxies, the client store, the animation-frame loop, and the React dashboard. Testing disconnect behavior also takes separate terminals so I can stop only the server while leaving the browser client available.

## Alternatives I considered and rejected

I rejected React setState for every message because burst arrival rate would drive React work directly. In one browser recording, about 2,500 updates per second arrived while React committed 78 times per second and the browser offered 121 animation frames per second.

I rejected queueing every update and draining the queue per frame because it preserves intermediate positions that are already old and adds storage and processing. If I drain the queue but show only its last value, the queue still does work that the latest-state map avoids.

Server-side throttling to one update per vehicle per tick is a legitimate way to trade motion detail for freshness at the source. I did not make it the main correctness mechanism because out-of-order delivery is part of this feed. A server tick would not remove the need for the per-vehicle sequence guard, and the client must stay correct for whatever the server sends. Server-side coalescing would be a good complement at larger scale.

I did not add a Web Worker. With parsing on the main thread, the recorded browser staleness peaks were 502 ms for the captured burst, 502–508 ms during normal traffic, and 511 ms in a separate button-triggered burst report. Those observations stayed under about 560 ms, so I saw no sign that the main thread was limiting freshness in this setup. I did not measure JSON parse time, so I cannot claim parsing was cheap or prove a worker would not help. I would profile before adding one.

I rejected polling because repeated request/response cycles add work and can leave the display waiting for the next poll. Server-Sent Events could also carry one-way telemetry, but the brief specified WebSocket, so WebSocket was a requirement rather than a transport choice.

I did not add Redux or another state library because one latest value per bus and a sorted snapshot were enough for this scope. I rejected arrival-order last-write-wins because a delayed older message could arrive later and restore an old position or OPEN door. Per-bus sequence numbers determine which update is newer.

## The trade-off I chose

I chose freshness over complete motion. I lose intermediate positions when updates arrive faster than the browser publishes them, so the table is not a movement history or replay. In return, it shows the newest accepted state and avoids spending render work on stale intermediate positions. The client still validates and processes each message, but it does not queue each message for a future render.

For a dispatcher deciding whether to hold a bus, I prefer its newest sequence-validated position and door state over a smooth replay of where it has already been. The age and STALE indicators make the age of that current state visible.

## Assumptions and what fails if wrong

- I assume the browser and server share one machine clock, because age is calculated as now minus ts. If that is wrong, clock skew can make displayed age misleading.
- I assume each bus sequence increases within one runId and a server restart changes runId. If that is wrong, the client can reject valid updates or accept an update from an earlier run.
- I assume the feed is simulated telemetry with the documented fields. If that is wrong, these tests say nothing about the validity or safety of real vehicle sensors.
- I assume one authoritative server instance sits behind the Vite proxy. If that is wrong, instances can disagree about runId, sequence history, and burst responses; multi-instance coordination is not implemented.
- I assume the 1,000 ms budget means now minus the timestamp of the newest accepted update. At about two updates per second per bus, age naturally swings from 0 to about 500 ms even with a perfect pipeline. The recorded browser peaks were 502 ms for the captured burst, 502–508 ms in normal traffic, and 511 ms in a separate burst-button recording. Those readings show little added delay in this setup. If this assumption is wrong, a slower-reporting bus could show red even with an instant pipeline because feed cadence itself would count as staleness.

## Stack and implementation details

I kept the named React plus Node.js WebSocket stack. The implementation adds Vite, the ws library, concurrently, and npm workspaces. Vite proxies /feed and /burst to the Node server during development. The development-only POST /burst endpoint and Trigger burst now button control the existing burst generator. They do not replace the WebSocket telemetry path. These are implementation details around the requested stack, not a stack change.

## What breaks first at 10x — prediction, not measurement

At ten times the fleet size, 300 buses producing about 100 updates per second each during a burst would send about 30,000 messages per second. I predict the main-thread JSON parse and per-message guard, followed by the server's per-message fan-out, would be the first pressure points. I have not measured this scale. The store holds one entry per bus, so it does not retain an ever-growing render queue.

I would profile the target workload first. Per-vehicle server coalescing per tick and batching could reduce work while keeping the client sequence guard. I would consider per-client backpressure using ws.bufferedAmount and add a worker only if profiling shows parse or store work is a bottleneck.

## Deliberately left out

- History or replay: I chose current state rather than retaining every movement.
- Map view: Grid coordinates are enough to show the fleet table.
- Persistence: This demo uses in-memory simulated state.
- Authentication: The local development demo does not need user accounts.
- Multiple server instances: The project assumes one authoritative simulator.
- Styling beyond a minimal readable table: I prioritized correctness.
- A Web Worker: I would add one only if profiling justifies it.
- Server-side batching: I kept individual updates to exercise the client's ordering guard; batching remains a possible complement.

## What I would do next

If I extend this for a larger fleet, I would profile parsing, sequence validation, server fan-out, and per-client backlog at the intended traffic rate. I would choose coalescing, batching, or backpressure from those measurements, then compare the result against the current freshness behavior.

I would also test clock assumptions and decide whether dispatchers need event history in addition to the latest-state table. If they do, I would design history as a separate feature so replay does not weaken the live freshness guard.

Next, I would:

- Profile the client and server at the target fleet size.
- Measure coalescing, batching, and per-client backpressure.
- Reassess worker use, table virtualization, clock handling, and multi-instance coordination.

Hours spent: 15
