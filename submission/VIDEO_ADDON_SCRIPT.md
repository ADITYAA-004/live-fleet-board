# Live Fleet Board Video Add-on Script

Cue: Show the Alternatives section of DECISIONS.md.

I considered updating React state for every message and keeping a queue of every update until the next frame. I chose the latest-state map because it keeps one accepted value per bus and avoids rendering intermediate positions that are already old. Server-side coalescing is also a reasonable way to trade movement detail for freshness, and I would consider it at larger scale. It cannot replace the client sequence guard because this feed deliberately delivers updates out of order. I did not add a Web Worker because I have not measured JSON parsing time. My recorded browser ages stayed below about 560 milliseconds, but that does not prove parsing will never become a bottleneck. I would profile first.

Cue: Show the What breaks first at 10x section of DECISIONS.md.

At ten times the fleet size, 300 buses sending about 100 burst updates per second each would produce about 30,000 messages per second. That is a prediction, not a measurement. I expect main-thread parsing and sequence checks, and then the server's per-message fan-out, to need attention first. I would measure those parts under the target workload. Then I would test per-vehicle coalescing, batching, and per-client backpressure. I would add a worker only if the profile showed that main-thread parsing or store work was limiting freshness.

Cue: Show both rows in the AI Suggestions Log in CHANGES_LOG.md.

I handled two inaccurate suggestions. The first planning assistant blamed the npm install failure on missing sandbox network access. My PC reached the registry; Node 23.1.0 was rejecting the certificate. I upgraded Node and used NODE_USE_SYSTEM_CA=1 without turning off TLS verification. The second suggestion treated about 60 React commits per second as a hard limit. My display offered about 121 animation frames per second, so I corrected the criterion to the browser's offered frame rate. In the recording, 78 commits per second remained below 121 frame callbacks while about 2,500 updates per second arrived.
