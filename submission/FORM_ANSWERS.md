# Live Fleet Board Submission Form Answers

## Assumptions

- The browser and server share a machine clock. If wrong, clock skew makes displayed age misleading.
- Each bus sequence increases within one runId, and a server restart changes runId. If wrong, valid updates may be rejected or old-run updates may be accepted.
- The feed is simulated telemetry with the documented fields. If wrong, these checks do not validate real vehicle sensors or their operational safety.
- One authoritative server sits behind the Vite proxy. If wrong, instances can disagree about sequence history and runId.

## Anything else

I would next profile parsing, sequence validation, server fan-out, and per-client backlog at the intended fleet size, then choose coalescing, batching, or backpressure based on those measurements. I would add a worker only if profiling showed it was needed. I ran out of time for the final edit and export of my recorded demo and its upload. I also do not have the separate planning-assistant chat transcript in the project folder; I will add the original if the submission requires it. I report 15 hours for the project.
