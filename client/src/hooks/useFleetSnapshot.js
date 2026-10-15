import { useEffect, useRef, useState } from "react";
import { createRenderLoop } from "../lib/renderLoop.js";

const BUS_IDS = Array.from({ length: 30 }, (_, index) => (
  `BUS-${String(index + 1).padStart(2, "0")}`
));

const makeWaitingSnapshot = () => BUS_IDS.map((busId) => ({ busId, update: null }));

export function useFleetSnapshot(store) {
  const [view, setView] = useState(() => ({ snapshot: makeWaitingSnapshot(), now: Date.now() }));
  const publishCountRef = useRef(0);

  useEffect(() => {
    const loop = createRenderLoop({
      store,
      publish: (updates) => {
        const now = Date.now();
        const snapshot = BUS_IDS.map((busId) => ({
          busId,
          update: updates.find((candidate) => candidate.busId === busId) ?? null,
        }));
        publishCountRef.current += 1;
        setView({ snapshot, now });
      },
      raf: (callback) => window.requestAnimationFrame(callback),
      caf: (frameId) => window.cancelAnimationFrame(frameId),
      now: () => performance.now(),
    });

    loop.start();
    return () => loop.stop();
  }, [store]);

  return { ...view, publishCountRef };
}
