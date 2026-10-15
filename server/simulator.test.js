import assert from "node:assert/strict";
import { test } from "node:test";
import { BUS_COUNT } from "./config.js";
import { Simulator } from "./simulator.js";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test("emits well-formed updates for 30 distinct buses with consecutive per-bus sequences", async () => {
  const simulator = new Simulator();
  const updates = [];
  simulator.onUpdate((update) => updates.push(update));
  simulator.start();
  await wait(2200);
  simulator.stop();

  const busIds = new Set(updates.map((update) => update.busId));
  assert.equal(BUS_COUNT, 30);
  assert.equal(busIds.size, 30);
  assert.deepEqual(
    [...busIds].sort(),
    Array.from({ length: 30 }, (_, index) => `BUS-${String(index + 1).padStart(2, "0")}`),
  );
  assert.ok(updates.length > 0);

  const fields = ["runId", "busId", "seq", "ts", "x", "y", "speed", "door"];
  const updatesByBus = new Map();
  for (const update of updates) {
    assert.equal(Object.getPrototypeOf(update), Object.prototype);
    assert.deepEqual(Object.keys(update), fields);
    assert.equal(typeof update.runId, "string");
    assert.equal(typeof update.busId, "string");
    assert.equal(typeof update.seq, "number");
    assert.ok(Number.isInteger(update.seq));
    assert.equal(typeof update.ts, "number");
    assert.equal(typeof update.x, "number");
    assert.equal(typeof update.y, "number");
    assert.equal(typeof update.speed, "number");
    assert.ok(update.x >= 0 && update.x <= 1000);
    assert.ok(update.y >= 0 && update.y <= 1000);
    assert.ok(update.speed >= 0 && update.speed <= 80);
    assert.ok(update.door === "OPEN" || update.door === "CLOSED");
    const busUpdates = updatesByBus.get(update.busId) ?? [];
    busUpdates.push(update.seq);
    updatesByBus.set(update.busId, busUpdates);
  }

  assert.equal(updatesByBus.size, BUS_COUNT);
  for (const sequences of updatesByBus.values()) {
    assert.equal(sequences[0], 1);
    for (let index = 1; index < sequences.length; index += 1) {
      assert.equal(sequences[index], sequences[index - 1] + 1);
    }
  }
});

test("stop clears every timer and prevents later updates", async () => {
  const simulator = new Simulator();
  let updateCount = 0;
  simulator.onUpdate(() => { updateCount += 1; });
  simulator.start();
  await wait(100);
  simulator.stop();

  assert.equal(simulator.activeTimerCount, 0);
  const countAfterStop = updateCount;
  await wait(600);
  assert.equal(updateCount, countAfterStop);
  simulator.stop();
  assert.equal(simulator.activeTimerCount, 0);
});
