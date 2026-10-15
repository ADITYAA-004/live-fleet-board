import { useEffect, useState } from "react";
import { createRenderLoop } from "../lib/renderLoop.js";

const BUS_IDS = Array.from({ length: 30 }, (_, index) => (
  `BUS-${String(index + 1).padStart(2, "0")}`
));

const makeWaitingSnapshot = () => BUS_IDS.map((busId) => ({ busId, update: null }));

export function useFleetSnapshot(store, metrics) {
  const [view, setView] = useState(() => ({
    snapshot: makeWaitingSnapshot(),
    metrics: null,
  }));

  useEffect(() => {
    const loop = createRenderLoop({
      store,
      publish: (updates) => {
        const now = Date.now();
        const metricSnapshot = metrics.sample({
          totalReceived: store.totalReceived,
          totalAccepted: store.totalAccepted,
          totalRejectedStale: store.totalRejectedStale,
          totalRejectedInvalid: store.totalRejectedInvalid,
          snapshot: updates,
        }, now);
        const agesByBus = new Map(metricSnapshot.busAges.map((entry) => [entry.busId, entry]));
        const snapshot = BUS_IDS.map((busId) => {
          const update = updates.find((candidate) => candidate.busId === busId) ?? null;
          return {
            busId,
            update,
            freshness: update ? agesByBus.get(busId) : null,
          };
        });
        setView({ snapshot, metrics: metricSnapshot });
      },
      raf: (callback) => window.requestAnimationFrame((timestamp) => {
        metrics.recordRafCallback(Date.now());
        callback(timestamp);
      }),
      caf: (frameId) => window.cancelAnimationFrame(frameId),
      now: () => performance.now(),
    });

    loop.start();
    return () => loop.stop();
  }, [store, metrics]);

  return view;
}
