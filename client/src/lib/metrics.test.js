import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyStaleness, createMetrics } from "./metrics.js";

function createFakeClock() {
  let currentTime = 0;
  return {
    now: () => currentTime,
    set: (time) => { currentTime = time; },
  };
}

function sampleMetrics(metrics, values, time) {
  return metrics.sample({
    totalReceived: 0,
    totalAccepted: 0,
    totalRejectedStale: 0,
    totalRejectedInvalid: 0,
    snapshot: [],
    ...values,
  }, time);
}

test("incoming counter rate reflects a known one-second pattern and falls to zero", () => {
  const clock = createFakeClock();
  const metrics = createMetrics({ now: clock.now });
  sampleMetrics(metrics, { totalReceived: 0 }, 0);
  sampleMetrics(metrics, { totalReceived: 10 }, 250);
  sampleMetrics(metrics, { totalReceived: 20 }, 500);
  const oneSecond = sampleMetrics(metrics, { totalReceived: 40 }, 1000);
  assert.equal(oneSecond.incomingPerSecond, 40);

  clock.set(2100);
  const idle = sampleMetrics(metrics, { totalReceived: 40 }, clock.now());
  assert.equal(idle.incomingPerSecond, 0);
});

test("staleness thresholds classify normal, amber, and red STALE ages", () => {
  assert.deepEqual(classifyStaleness(499), { level: "normal", badge: null });
  assert.deepEqual(classifyStaleness(500), { level: "amber", badge: null });
  assert.deepEqual(classifyStaleness(1000), { level: "amber", badge: null });
  assert.deepEqual(classifyStaleness(1001), { level: "red", badge: "STALE" });
});

test("peak maximum staleness is held for ten seconds, then ages out", () => {
  const clock = createFakeClock();
  const metrics = createMetrics({ now: clock.now });
  const oneOldBus = (ts) => [{ runId: "r", busId: "BUS-01", seq: 1, ts }];

  const spike = sampleMetrics(metrics, { snapshot: oneOldBus(-5000) }, 0);
  assert.equal(spike.peakMaxStaleness10sMs, 5000);
  const held = sampleMetrics(metrics, { snapshot: oneOldBus(9000) }, 9000);
  assert.equal(held.peakMaxStaleness10sMs, 5000);
  const boundary = sampleMetrics(metrics, { snapshot: oneOldBus(10000) }, 10000);
  assert.equal(boundary.peakMaxStaleness10sMs, 5000);
  clock.set(10001);
  const expired = sampleMetrics(metrics, { snapshot: oneOldBus(clock.now()) }, clock.now());
  assert.equal(expired.peakMaxStaleness10sMs, 0);
});

test("maximum staleness ignores buses without accepted data", () => {
  const metrics = createMetrics({ now: () => 1000 });
  const waitingOnly = sampleMetrics(metrics, { snapshot: [null, null] }, 1000);
  assert.equal(waitingOnly.vehicleCount, 0);
  assert.equal(waitingOnly.currentMaxStalenessMs, null);
  assert.equal(waitingOnly.peakMaxStaleness10sMs, null);

  const oneBus = sampleMetrics(metrics, {
    snapshot: [null, { busId: "BUS-01", seq: 1, ts: 750 }],
  }, 1000);
  assert.equal(oneBus.vehicleCount, 1);
  assert.equal(oneBus.currentMaxStalenessMs, 250);
});

test("React commit counter reports commits in the rolling one-second window", () => {
  const clock = createFakeClock();
  const metrics = createMetrics({ now: clock.now });
  metrics.recordCommit();
  clock.set(100);
  metrics.recordCommit();
  clock.set(500);
  metrics.recordCommit();
  metrics.recordRafCallback();
  clock.set(800);
  metrics.recordRafCallback();

  const current = sampleMetrics(metrics, {}, 1000);
  assert.equal(current.reactCommitsPerSecond, 3);
  assert.equal(current.rafCallbacksPerSecond, 2);
  clock.set(1499);
  const rolled = sampleMetrics(metrics, {}, clock.now());
  assert.equal(rolled.reactCommitsPerSecond, 1);
});
