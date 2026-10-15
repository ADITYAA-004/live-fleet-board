const MIN_PUBLISH_INTERVAL_MS = 100;

export function createRenderLoop({ store, publish, raf, caf, now }) {
  let running = false;
  let frameId = null;
  let lastPublishAt = null;

  const renderFrame = () => {
    frameId = null;
    if (!running) return;

    try {
      const currentTime = now();
      const dirty = store.consumeDirty();
      if (
        dirty
        || lastPublishAt === null
        || currentTime - lastPublishAt >= MIN_PUBLISH_INTERVAL_MS
      ) {
        lastPublishAt = currentTime;
        // 60 Hz is a maximum repaint cadence, not a guarantee every update is shown; intermediate motion is intentionally dropped to stay fresh.
        publish(store.getSnapshot());
      }
    } finally {
      if (running) frameId = raf(renderFrame);
    }
  };

  return {
    start() {
      if (running) return;
      running = true;
      lastPublishAt = null;
      frameId = raf(renderFrame);
    },
    stop() {
      running = false;
      if (frameId !== null) {
        caf(frameId);
        frameId = null;
      }
    },
  };
}
