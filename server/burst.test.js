import assert from "node:assert/strict";
import { test } from "node:test";
import WebSocket from "ws";
import { FleetStore } from "../client/src/lib/fleetStore.js";
import { start } from "./index.js";

const expectedBusIds = Array.from({ length: 30 }, (_, index) => (
  `BUS-${String(index + 1).padStart(2, "0")}`
));
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function connect(url) {
  const socket = new WebSocket(url);
  socket.on("error", () => {});
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.terminate();
      reject(new Error("WebSocket connection timed out"));
    }, 5000);
    socket.once("open", () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

test("burst feed reaches target rate, reorders updates, and stale OPEN cannot resurrect", async () => {
  const server = await start(0, {
    burstDurationMs: 2000,
    firstBurstDelayMs: 60000,
    burstIntervalMs: 180000,
    burstMultiplier: 50,
  });
  let socket;
  let unsubscribeProduced;
  let unsubscribeBurst;
  const updatesReceived = [];
  const produced = [];
  const store = new FleetStore();
  const lastArrivedByBus = new Map();
  let normalOutOfOrder = 0;
  let burstOutOfOrder = 0;
  let burstStart;
  let burstEnd;
  let phase = "normal";
  let resolveBurstEnd;
  const burstEnded = new Promise((resolve) => { resolveBurstEnd = resolve; });

  try {
    socket = await connect(`ws://127.0.0.1:${server.port}/feed`);
    socket.on("message", (data) => {
      const update = JSON.parse(data.toString());
      updatesReceived.push(update);
      const previousSeq = lastArrivedByBus.get(update.busId);
      const inBurstWindow = burstStart
        && update.ts >= burstStart.startedAt
        && (!burstEnd || update.ts <= burstEnd.endedAt);
      if (previousSeq !== undefined && update.seq <= previousSeq) {
        if (inBurstWindow || phase === "burst") burstOutOfOrder += 1;
        else if (phase === "normal") normalOutOfOrder += 1;
      }
      lastArrivedByBus.set(update.busId, Math.max(previousSeq ?? 0, update.seq));
      store.accept(update);
    });

    unsubscribeProduced = server.simulator.onUpdate((update) => produced.push(update));
    unsubscribeBurst = server.simulator.onBurst((event) => {
      if (event.type === "start") {
        burstStart = event;
        phase = "burst";
      } else if (!event.interrupted) {
        burstEnd = event;
        server.simulator.stop();
        phase = "draining";
        resolveBurstEnd(event);
      }
    });

    await wait(1000);
    const normalMessages = updatesReceived.filter((update) => update.ts < Date.now());
    assert.deepEqual([...new Set(normalMessages.map((update) => update.busId))].sort(), expectedBusIds);
    assert.equal(normalOutOfOrder, 0, "normal mode must preserve strict per-bus order");

    phase = "burst";
    const response = await fetch(`http://127.0.0.1:${server.port}/burst`, { method: "POST" });
    assert.equal(response.status, 200);
    const responseBody = await response.json();
    assert.equal(responseBody.ok, true);
    assert.equal(responseBody.started, true);

    await Promise.race([
      burstEnded,
      wait(8000).then(() => { throw new Error("burst did not finish within 8 seconds"); }),
    ]);
    await wait(350); // Drain every bounded 20–300 ms delivery timer before checking final state.

    const burstUpdates = updatesReceived.filter((update) => (
      update.ts >= burstStart.startedAt && update.ts <= burstEnd.endedAt
    ));
    const elapsedSeconds = (burstEnd.endedAt - burstStart.startedAt) / 1000;
    const messagesPerSecond = burstUpdates.length / elapsedSeconds;
    const burstBusIds = new Set(burstUpdates.map((update) => update.busId));
    assert.deepEqual([...burstBusIds].sort(), expectedBusIds);
    assert.ok(
      messagesPerSecond >= 2500 && messagesPerSecond <= 3500,
      `expected roughly 3000 burst messages/sec, got ${messagesPerSecond.toFixed(2)}`,
    );
    assert.ok(burstOutOfOrder > 0, "burst traffic must arrive out of per-bus sequence order");

    const producedByBus = new Map();
    for (const update of produced) {
      const busUpdates = producedByBus.get(update.busId) ?? [];
      busUpdates.push(update);
      producedByBus.set(update.busId, busUpdates);
    }
    assert.equal(producedByBus.size, 30);
    for (const busUpdates of producedByBus.values()) {
      for (let index = 1; index < busUpdates.length; index += 1) {
        assert.equal(busUpdates[index].seq, busUpdates[index - 1].seq + 1, "produced seq must have no gaps");
        assert.ok(busUpdates[index].ts >= busUpdates[index - 1].ts, "produced timestamps must be non-decreasing");
      }
    }

    const burstHighestByBus = new Map();
    for (const update of produced) {
      if (update.ts >= burstStart.startedAt && update.ts <= burstEnd.endedAt) {
        burstHighestByBus.set(update.busId, Math.max(burstHighestByBus.get(update.busId) ?? 0, update.seq));
      }
    }
    const snapshot = new Map(store.getSnapshot().map((update) => [update.busId, update]));
    assert.ok(store.totalRejectedStale > 0, "the real fleet store must reject at least one delayed stale frame");
    for (const busId of expectedBusIds) {
      assert.equal(snapshot.get(busId)?.seq, burstHighestByBus.get(busId), `${busId} should finish at its highest produced seq`);
    }
    assert.equal(snapshot.get("BUS-07")?.door, "CLOSED", "the injected stale OPEN must not replace CLOSED");

    console.log(
      `burst test: ${burstUpdates.length} WebSocket messages in ${elapsedSeconds.toFixed(3)}s `
      + `(${messagesPerSecond.toFixed(2)} msgs/sec); out-of-order frames ${burstOutOfOrder}; `
      + `fleetStore stale rejects ${store.totalRejectedStale}`,
    );
  } finally {
    unsubscribeProduced?.();
    unsubscribeBurst?.();
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      await new Promise((resolve) => {
        if (socket.readyState === WebSocket.CLOSING) socket.once("close", resolve);
        else {
          socket.once("close", resolve);
          socket.close(1000, "burst test complete");
        }
      });
    }
    await server.close();
    assert.equal(server.activeTimerCount, 0, "shutdown must clear simulator, auto-burst, stats, and delivery timers");
    assert.equal(server.simulator.activeTimerCount, 0, "shutdown must clear every simulator timer");
  }
});
