import assert from "node:assert/strict";
import { test } from "node:test";
import { createFleetStore } from "./fleetStore.js";

const update = (overrides = {}) => ({
  runId: "run-a",
  busId: "BUS-01",
  seq: 1,
  ts: 1000,
  x: 10,
  y: 20,
  speed: 30,
  door: "CLOSED",
  ...overrides,
});

test("accepts increasing sequences and tracks counters and dirty state", () => {
  const store = createFleetStore();
  assert.equal(store.accept(update({ seq: 1 })), "accepted");
  assert.equal(store.accept(update({ seq: 2 })), "accepted");
  assert.deepEqual(
    [store.totalReceived, store.totalAccepted, store.totalRejectedStale, store.totalRejectedInvalid],
    [2, 2, 0, 0],
  );
  assert.equal(store.consumeDirty(), true);
  assert.equal(store.consumeDirty(), false);
});

test("rejects an equal sequence without changing the stored update", () => {
  const store = createFleetStore();
  store.accept(update({ seq: 7 }));
  assert.equal(store.accept(update({ seq: 7, x: 999 })), "stale");
  assert.equal(store.getSnapshot()[0].x, 10);
  assert.equal(store.totalRejectedStale, 1);
});

test("rejects an older sequence and retains the newest update", () => {
  const store = createFleetStore();
  store.accept(update({ seq: 205, x: 205 }));
  assert.equal(store.accept(update({ seq: 204, x: 204 })), "stale");
  assert.equal(store.getSnapshot()[0].seq, 205);
  assert.equal(store.getSnapshot()[0].x, 205);
});

test("a stale OPEN update cannot undo a newer CLOSED update", () => {
  const store = createFleetStore();
  store.accept(update({ seq: 10, door: "CLOSED" }));
  assert.equal(store.accept(update({ seq: 9, door: "OPEN" })), "stale");
  assert.equal(store.getSnapshot()[0].door, "CLOSED");
  assert.equal(store.getSnapshot()[0].seq, 10);
});

test("rejects invalid payloads without throwing and counts each rejection", () => {
  const store = createFleetStore();
  const invalidPayloads = [
    { runId: "run-a", busId: "BUS-01" },
    update({ busId: 1 }),
    update({ seq: "2" }),
    update({ ts: Number.NaN }),
    update({ x: Number.NaN }),
    update({ y: Infinity }),
    update({ speed: "30" }),
    update({ door: "open" }),
    update({ runId: undefined }),
    null,
  ];

  for (const payload of invalidPayloads) {
    let result;
    assert.doesNotThrow(() => { result = store.accept(payload); });
    assert.equal(result, "invalid");
  }
  assert.equal(store.totalRejectedInvalid, invalidPayloads.length);
  assert.equal(store.getSnapshot().length, 0);
});

test("a different runId clears old buses and accepts a reset sequence", () => {
  const store = createFleetStore();
  store.accept(update({ seq: 205 }));
  store.accept(update({ busId: "BUS-02", seq: 40 }));

  assert.equal(store.accept(update({ runId: "run-b", seq: 1 })), "accepted");
  assert.equal(store.runId, "run-b");
  assert.deepEqual(store.getSnapshot().map((item) => [item.busId, item.seq]), [["BUS-01", 1]]);
});

test("different buses have independent sequence tracking", () => {
  const store = createFleetStore();
  store.accept(update({ seq: 5 }));
  assert.equal(store.accept(update({ busId: "BUS-02", seq: 1 })), "accepted");
  assert.equal(store.accept(update({ seq: 4 })), "stale");
  assert.equal(store.accept(update({ busId: "BUS-02", seq: 2 })), "accepted");
  assert.deepEqual(store.getSnapshot().map((item) => [item.busId, item.seq]), [
    ["BUS-01", 5],
    ["BUS-02", 2],
  ]);
});

test("shuffled updates and duplicates converge on sequence 500", () => {
  const store = createFleetStore();
  const shuffled = [];
  for (let seq = 1; seq <= 500; seq += 1) {
    const item = update({ seq, x: seq });
    shuffled.push(item);
    if (seq % 3 === 0) shuffled.push({ ...item });
  }

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  for (const item of shuffled) store.accept(item);

  const [latest] = store.getSnapshot();
  assert.equal(latest.seq, 500);
  assert.equal(latest.x, 500);
});

test("snapshot is sorted and contains only one latest update per bus", () => {
  const store = createFleetStore();
  store.accept(update({ busId: "BUS-03", seq: 1 }));
  store.accept(update({ busId: "BUS-01", seq: 1 }));
  store.accept(update({ busId: "BUS-03", seq: 2 }));
  store.accept(update({ busId: "BUS-02", seq: 1 }));

  const snapshot = store.getSnapshot();
  assert.deepEqual(snapshot.map((item) => item.busId), ["BUS-01", "BUS-02", "BUS-03"]);
  assert.equal(snapshot.length, 3);
  assert.equal(snapshot[2].seq, 2);
});

test("invalid and stale updates do not mark a clean store dirty", () => {
  const store = createFleetStore();
  assert.equal(store.accept(null), "invalid");
  assert.equal(store.consumeDirty(), false);
  store.accept(update({ seq: 2 }));
  store.consumeDirty();
  assert.equal(store.accept(update({ seq: 1 })), "stale");
  assert.equal(store.consumeDirty(), false);
});
