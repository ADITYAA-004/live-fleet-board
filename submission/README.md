# Demo video submission

The required demonstration video has **not** been recorded yet. Do not create an empty or placeholder video.

## Planned file

Use `live-fleet-board-demo.mp4` as the filename. A local staging copy may be placed at:

```text
submission/live-fleet-board-demo.mp4
```

That exact MP4 path is ignored by Git to avoid committing a large binary. Upload the finished video through the assignment's required submission service or another approved delivery location; the project repository is not the recommended video host. If the submission requires a link, add that link to the final checklist after upload.

## Required topics

- What was chosen and why: simulator, WebSocket, latest-state map, per-bus sequence guard, and `requestAnimationFrame` publishing.
- Alternatives considered and rejected, including per-message state updates, queueing every update, workers, polling, SSE, Redux, and arrival-order last-write-wins.
- What is likely to break at 10× scale, with estimates clearly separated from measured results.
- The real Step 1 AI suggestion recorded in `CHANGES_LOG.md`, why its diagnosis was wrong, and how the TLS-preserving correction was made.
- Live normal traffic, the automatic burst if practical, a burst/out-of-order demonstration, stale protection, measured metrics, server-only disconnect behavior, and test commands.

See `../DEMO_SCRIPT.md` for the timed 5–10 minute recording outline and live checklist.
