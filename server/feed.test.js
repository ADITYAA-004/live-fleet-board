import assert from "node:assert/strict";
import { test } from "node:test";
import WebSocket from "ws";
import { start } from "./index.js";

const expectedBusIds = Array.from({ length: 30 }, (_, index) => (
  `BUS-${String(index + 1).padStart(2, "0")}`
));

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

test("/feed streams valid updates from all buses at about 60 messages per second", async () => {
  const server = await start(0);
  let socket;
  const updates = [];
  const fields = ["runId", "busId", "seq", "ts", "x", "y", "speed", "door"];

  try {
    socket = await connect(`ws://127.0.0.1:${server.port}/feed`);
    socket.on("message", (data) => {
      updates.push(JSON.parse(data.toString()));
    });

    const startedAt = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    const rate = updates.length / elapsedSeconds;

    assert.ok(updates.length > 0);
    const busIds = new Set(updates.map((update) => update.busId));
    assert.deepEqual([...busIds].sort(), expectedBusIds);

    const sequencesByBus = new Map();
    for (const update of updates) {
      assert.deepEqual(Object.keys(update), fields);
      assert.equal(typeof update.runId, "string");
      assert.equal(typeof update.busId, "string");
      assert.ok(Number.isInteger(update.seq));
      assert.equal(typeof update.ts, "number");
      assert.equal(typeof update.x, "number");
      assert.equal(typeof update.y, "number");
      assert.equal(typeof update.speed, "number");
      assert.ok(update.door === "OPEN" || update.door === "CLOSED");

      const sequences = sequencesByBus.get(update.busId) ?? [];
      sequences.push(update.seq);
      sequencesByBus.set(update.busId, sequences);
    }
    for (const sequences of sequencesByBus.values()) {
      for (let index = 1; index < sequences.length; index += 1) {
        assert.equal(sequences[index], sequences[index - 1] + 1);
      }
    }

    assert.ok(rate >= 45 && rate <= 75, `expected ~60 messages/sec, got ${rate.toFixed(2)}`);
    console.log(`feed test: ${updates.length} messages in ${elapsedSeconds.toFixed(3)}s (${rate.toFixed(2)}/sec)`);
  } finally {
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      await new Promise((resolve) => {
        socket.once("close", resolve);
        socket.close(1000, "test complete");
      });
    }
    await server.close();
  }
});
