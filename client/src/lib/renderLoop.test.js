import assert from "node:assert/strict";
import { test } from "node:test";
import { createFleetStore } from "./fleetStore.js";
import { createRenderLoop } from "./renderLoop.js";

function makeUpdate(seq) {
  return {
    runId: "render-test",
    busId: "BUS-01",
    seq,
    ts: seq,
    x: seq,
    y: 0,
    speed: 10,
    door: "CLOSED",
  };
}

function createFakeRaf() {
  let nextId = 1;
  let currentTime = 0;
  const pending = new Map();
  const cancelled = [];
  let scheduledCount = 0;

  return {
    raf(callback) {
      const id = nextId++;
      pending.set(id, callback);
      scheduledCount += 1;
      return id;
    },
    caf(id) {
      cancelled.push(id);
      pending.delete(id);
    },
    now() {
      return currentTime;
    },
    step(time = currentTime + 1000 / 60) {
      currentTime = time;
      const entry = pending.entries().next().value;
      assert.ok(entry, "expected a pending animation frame");
      pending.delete(entry[0]);
      entry[1](time);
    },
    get pendingCount() {
      return pending.size;
    },
    get pendingId() {
      return pending.keys().next().value;
    },
    get pendingCallback() {
      return pending.values().next().value;
    },
    get cancelled() {
      return cancelled;
    },
    get scheduledCount() {
      return scheduledCount;
    },
  };
}

function createLoop(store, fake, publish) {
  return createRenderLoop({
    store,
    publish,
    raf: fake.raf,
    caf: fake.caf,
    now: fake.now,
  });
}

test("coalesces 1000 updates between frames and publishes only the latest state", () => {
  const store = createFleetStore();
  const fake = createFakeRaf();
  const published = [];
  const loop = createLoop(store, fake, (snapshot) => published.push(snapshot));
  loop.start();
  fake.step(0);
  published.length = 0;

  for (let seq = 1; seq <= 1000; seq += 1) store.accept(makeUpdate(seq));
  fake.step(1000 / 60);

  assert.equal(published.length, 1);
  assert.equal(published[0][0].seq, 1000);
  assert.equal(published[0][0].x, 1000);
  loop.stop();
});

test("120 clean frames publish for age refresh about every 100 ms, not every frame", () => {
  const store = createFleetStore();
  const fake = createFakeRaf();
  const publishTimes = [];
  const loop = createLoop(store, fake, () => publishTimes.push(fake.now()));
  loop.start();

  for (let frame = 0; frame < 120; frame += 1) {
    fake.step((frame * 1000) / 60);
  }

  assert.ok(publishTimes.length >= 18 && publishTimes.length <= 21);
  assert.ok(publishTimes.length < 120);
  for (let index = 1; index < publishTimes.length; index += 1) {
    assert.ok(publishTimes[index] - publishTimes[index - 1] >= 100 - 1e-8);
  }
  loop.stop();
});

test("stop cancels the pending frame and prevents further publishes", () => {
  const store = createFleetStore();
  const fake = createFakeRaf();
  let publishCount = 0;
  const loop = createLoop(store, fake, () => { publishCount += 1; });
  loop.start();
  fake.step(0);
  const pendingId = fake.pendingId;
  const cancelledCallback = fake.pendingCallback;

  loop.stop();
  assert.deepEqual(fake.cancelled, [pendingId]);
  assert.equal(fake.pendingCount, 0);
  cancelledCallback(1000);
  assert.equal(publishCount, 1);
  assert.equal(fake.pendingCount, 0);
});

test("calling start twice keeps exactly one animation loop", () => {
  const store = createFleetStore();
  const fake = createFakeRaf();
  let publishCount = 0;
  const loop = createLoop(store, fake, () => { publishCount += 1; });

  loop.start();
  loop.start();
  assert.equal(fake.scheduledCount, 1);
  assert.equal(fake.pendingCount, 1);
  fake.step(0);
  loop.start();
  assert.equal(fake.pendingCount, 1);
  assert.equal(publishCount, 1);
  loop.stop();
});

test("a resumed frame publishes only the latest state after a long hidden interval", () => {
  const store = createFleetStore();
  const fake = createFakeRaf();
  const published = [];
  const loop = createLoop(store, fake, (snapshot) => published.push(snapshot));
  loop.start();
  fake.step(0);
  published.length = 0;

  store.accept(makeUpdate(1));
  store.accept(makeUpdate(2));
  fake.step(5000);

  assert.equal(published.length, 1);
  assert.equal(published[0][0].seq, 2);
  loop.stop();
});
