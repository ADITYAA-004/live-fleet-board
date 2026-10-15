import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import WebSocket from "ws";
import { FleetStore } from "../client/src/lib/fleetStore.js";
import { BUS_COUNT, BURST_DURATION_MS, NORMAL_HZ } from "../server/config.js";
import { start } from "../server/index.js";

const BASELINE_MS = 10_000;
const BURST_COUNT = 3;
const DELIVERY_DRAIN_MS = 400;
const AGE_SAMPLE_MS = 50;
const EXPECTED_AUTO_DELAY_MS = 45_000;
const AUTO_SECOND_CLIENT_AT_MS = 20_000;
const AUTO_DELAY_MIN_MS = 40_000;
const AUTO_DELAY_MAX_MS = 60_000;
const MEMORY_GROWTH_TOLERANCE_BYTES = 12 * 1024 * 1024;
const expectedBusIds = Array.from({ length: BUS_COUNT }, (_, index) => (
  `BUS-${String(index + 1).padStart(2, "0")}`
));
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

function normalizeLoadTestUrl(value) {
  const supplied = new URL(value);
  const isWebSocket = supplied.protocol === "ws:" || supplied.protocol === "wss:";
  const isSecure = supplied.protocol === "https:" || supplied.protocol === "wss:";
  assert.ok(isWebSocket || supplied.protocol === "http:" || supplied.protocol === "https:",
    "LOAD_TEST_URL must use http(s):// or ws(s)://");
  const httpOrigin = `${isSecure ? "https:" : "http:"}//${supplied.host}`;
  const feedUrl = isWebSocket
    ? supplied.href
    : `${isSecure ? "wss:" : "ws:"}//${supplied.host}/feed`;
  return { httpOrigin, feedUrl };
}

function connect(url) {
  const socket = new WebSocket(url);
  socket.on("error", () => {});
  return withTimeout(new Promise((resolve, reject) => {
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  }), 5000, `WebSocket connection timed out: ${url}`);
}

async function closeSocket(socket) {
  if (!socket || socket.readyState === WebSocket.CLOSED) return;
  await withTimeout(new Promise((resolve) => {
    socket.once("close", resolve);
    if (socket.readyState === WebSocket.CLOSING) return;
    socket.close(1000, "load test complete");
  }), 2500, "WebSocket did not close cleanly").catch(() => socket.terminate());
}

function percentile(values, fraction) {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.ceil(fraction * ordered.length) - 1)];
}

function makeBurstContext(label) {
  let resolveStarted;
  let resolveEnded;
  return {
    label,
    startWall: null,
    endWall: null,
    startMono: null,
    endMono: null,
    deliveredCount: 0,
    outOfOrder: 0,
    buckets: new Map(),
    maxAgeByBus: new Map(),
    ageObservations: [],
    ageSamples: 0,
    producedMaxByBus: new Map(),
    started: new Promise((resolve) => { resolveStarted = resolve; }),
    ended: new Promise((resolve) => { resolveEnded = resolve; }),
    markStarted(event) {
      if (this.startWall !== null) return;
      this.startWall = event?.startedAt ?? Date.now();
      this.startMono = performance.now();
      resolveStarted(event);
    },
    markEnded(event) {
      if (this.endWall !== null) return;
      this.endWall = event?.endedAt ?? Date.now();
      this.endMono = performance.now();
      resolveEnded(event);
    },
  };
}

function createFeedObserver(socket, { server = null, sampleTimers }) {
  const store = new FleetStore();
  const seenBusIds = new Set();
  const highestArrivedSeqByBus = new Map();
  const previousDisplayedByBus = new Map();
  const highestProducedSeqByBus = new Map();
  const lastProducedTsByBus = new Map();
  const producerErrors = [];
  let phase = "idle";
  let baselineMessages = 0;
  let normalOutOfOrder = 0;
  let burstOutOfOrder = 0;
  let resurrectionCount = 0;
  let parseErrors = 0;
  let activeBurst = null;

  if (server) {
    // The server starts its staggered normal timers before start() returns; seed from its current counters.
    for (const bus of server.simulator.buses) {
      highestProducedSeqByBus.set(bus.busId, bus.seq - 1);
      if (bus.lastUpdateAt !== null) lastProducedTsByBus.set(bus.busId, bus.lastUpdateAt);
    }
  }

  function assertDisplayDidNotRegress(busId) {
    const current = store.latestByBus.get(busId);
    if (!current) return;
    const previous = previousDisplayedByBus.get(busId);
    if (previous) {
      if (current.seq < previous.seq) resurrectionCount += 1;
      if (previous.door === "CLOSED" && current.door === "OPEN" && current.seq <= previous.seq) {
        resurrectionCount += 1;
      }
    }
    previousDisplayedByBus.set(busId, { seq: current.seq, door: current.door });
  }

  function sampleBurstAge(context) {
    if (!context || context.startWall === null || context.endWall !== null) return;
    const snapshot = store.getSnapshot();
    const now = Date.now();
    context.ageSamples += 1;
    for (const update of snapshot) {
      const age = now - update.ts;
      context.ageObservations.push(age);
      const oldMaximum = context.maxAgeByBus.get(update.busId) ?? Number.NEGATIVE_INFINITY;
      if (age > oldMaximum) context.maxAgeByBus.set(update.busId, age);
      assertDisplayDidNotRegress(update.busId);
    }
  }

  const sampleTimer = setInterval(() => sampleBurstAge(activeBurst), AGE_SAMPLE_MS);
  sampleTimers.add(sampleTimer);

  socket.on("message", (raw) => {
    let update;
    try {
      update = JSON.parse(raw.toString());
    } catch {
      parseErrors += 1;
      return;
    }
    if (!update || typeof update.busId !== "string" || !Number.isFinite(update.seq)) {
      store.accept(update);
      return;
    }

    seenBusIds.add(update.busId);
    if (phase === "baseline") baselineMessages += 1;

    const previousArrived = highestArrivedSeqByBus.get(update.busId);
    const isBurstUpdate = activeBurst
      && activeBurst.startWall !== null
      && update.ts >= activeBurst.startWall
      && (activeBurst.endWall === null || update.ts <= activeBurst.endWall);
    if (previousArrived !== undefined && update.seq < previousArrived) {
      if (isBurstUpdate) {
        activeBurst.outOfOrder += 1;
        burstOutOfOrder += 1;
      } else if (phase === "baseline") {
        normalOutOfOrder += 1;
      }
    }
    highestArrivedSeqByBus.set(update.busId, Math.max(previousArrived ?? 0, update.seq));

    if (isBurstUpdate) {
      activeBurst.deliveredCount += 1;
      const bucket = Math.floor((performance.now() - activeBurst.startMono) / 1000);
      if (bucket >= 0 && bucket < Math.ceil(BURST_DURATION_MS / 1000)) {
        activeBurst.buckets.set(bucket, (activeBurst.buckets.get(bucket) ?? 0) + 1);
      }
    }

    store.accept(update);
    assertDisplayDidNotRegress(update.busId);
  });

  if (server) {
    server.simulator.onUpdate((update) => {
      const previousSeq = highestProducedSeqByBus.get(update.busId);
      const previousTs = lastProducedTsByBus.get(update.busId);
      const expectedSeq = previousSeq === undefined ? 1 : previousSeq + 1;
      if (update.seq !== expectedSeq) {
        producerErrors.push(`${update.busId} produced seq ${update.seq}, expected ${expectedSeq}`);
      }
      if (previousTs !== undefined && update.ts < previousTs) {
        producerErrors.push(`${update.busId} production timestamp moved backwards`);
      }
      highestProducedSeqByBus.set(update.busId, update.seq);
      lastProducedTsByBus.set(update.busId, update.ts);
      if (
        activeBurst
        && activeBurst.startWall !== null
        && update.ts >= activeBurst.startWall
        && (activeBurst.endWall === null || update.ts <= activeBurst.endWall)
      ) {
        activeBurst.producedMaxByBus.set(update.busId, update.seq);
      }
    });

    server.simulator.onBurst((event) => {
      if (event.type === "start" && activeBurst) activeBurst.markStarted(event);
      if (event.type === "end" && activeBurst) activeBurst.markEnded(event);
    });
  }

  function createBurst(label) {
    assert.equal(activeBurst, null, "previous burst must be drained before starting another");
    activeBurst = makeBurstContext(label);
    return activeBurst;
  }

  function finishBurst(context) {
    assert.equal(activeBurst, context);
    activeBurst = null;
    const peakMsgsPerSec = Math.max(0, ...context.buckets.values());
    const durationSeconds = ((context.endWall ?? Date.now()) - context.startWall) / 1000;
    return {
      ...context,
      peakMsgsPerSec,
      averageMsgsPerSec: context.deliveredCount / (durationSeconds || 1),
      durationSeconds,
    };
  }

  function compareAcceptedWithProduced(context) {
    const snapshot = new Map(store.getSnapshot().map((update) => [update.busId, update]));
    const produced = server ? highestProducedSeqByBus : highestArrivedSeqByBus;
    for (const busId of expectedBusIds) {
      assert.equal(snapshot.get(busId)?.seq, produced.get(busId),
        `${busId}: accepted seq must equal ${server ? "highest produced" : "highest received"} seq after delivery drain`);
    }
    assert.equal(snapshot.size, BUS_COUNT, "store must contain exactly 30 latest entries");
    return snapshot;
  }

  return {
    store,
    seenBusIds,
    producerErrors,
    sampleTimer,
    createBurst,
    finishBurst,
    compareAcceptedWithProduced,
    get baselineMessages() { return baselineMessages; },
    get normalOutOfOrder() { return normalOutOfOrder; },
    get burstOutOfOrder() { return burstOutOfOrder; },
    get resurrectionCount() { return resurrectionCount; },
    get parseErrors() { return parseErrors; },
    get highestProducedSeqByBus() { return highestProducedSeqByBus; },
    get activeBurst() { return activeBurst; },
    set phase(value) { phase = value; },
  };
}

async function triggerBurst(context, httpOrigin, isLocal) {
  const response = await fetch(`${httpOrigin}/burst`, { method: "POST" });
  assert.equal(response.status, 200, `POST /burst returned HTTP ${response.status}`);
  const body = await response.json();
  assert.equal(body.ok, true, "POST /burst response must be successful");
  assert.equal(body.started, true, "server did not start the requested burst");

  if (isLocal) {
    await withTimeout(context.started, BURST_DURATION_MS + 3000, "local burst did not start");
    await withTimeout(context.ended, BURST_DURATION_MS + 5000, "local burst did not end");
  } else {
    context.markStarted({ startedAt: Date.now() });
    context.endWall = context.startWall + BURST_DURATION_MS;
    context.endMono = context.startMono + BURST_DURATION_MS;
    await wait(BURST_DURATION_MS);
    context.markEnded({ endedAt: context.endWall });
  }
  await wait(DELIVERY_DRAIN_MS);
}

function memorySample() {
  if (typeof global.gc === "function") global.gc();
  return process.memoryUsage().heapUsed;
}

async function waitForStateConvergence(observer, timeoutMs = 2000) {
  const expected = observer.highestProducedSeqByBus;
  const startedAt = performance.now();
  let mismatch = "";
  while (performance.now() - startedAt < timeoutMs) {
    mismatch = "";
    for (const busId of expectedBusIds) {
      const accepted = observer.store.latestByBus.get(busId)?.seq;
      const produced = expected.get(busId);
      if (accepted !== produced) {
        mismatch = `${busId}: accepted ${accepted ?? "none"}, produced ${produced ?? "none"}`;
        break;
      }
    }
    if (!mismatch) return performance.now() - startedAt;
    await wait(25);
  }
  assert.fail(`latest-state convergence timed out after ${timeoutMs}ms (${mismatch})`);
}

async function runAutomaticBurstTimingCheck() {
  const server = await start(0, {
    firstBurstDelayMs: EXPECTED_AUTO_DELAY_MS,
    burstIntervalMs: 180_000,
    burstOnStart: false,
  });
  let firstSocket;
  let secondSocket;
  let firstConnectedAt;
  let secondConnectedAt;
  let resolveAutomaticStart;
  const automaticStart = new Promise((resolve) => { resolveAutomaticStart = resolve; });
  const unsubscribe = server.simulator.onBurst((event) => {
    if (event.type === "start") resolveAutomaticStart(performance.now());
  });

  try {
    firstSocket = await connect(`ws://127.0.0.1:${server.port}/feed`);
    firstConnectedAt = performance.now();
    await wait(AUTO_SECOND_CLIENT_AT_MS);
    secondSocket = await connect(`ws://127.0.0.1:${server.port}/feed`);
    secondConnectedAt = performance.now();
    const startedAt = await withTimeout(automaticStart, 70_000, "first automatic burst did not start within 70 seconds");
    const secondsAfterFirst = (startedAt - firstConnectedAt) / 1000;
    const secondsAfterSecond = (startedAt - secondConnectedAt) / 1000;
    assert.ok(secondsAfterFirst * 1000 >= AUTO_DELAY_MIN_MS,
      `automatic burst started too early (${secondsAfterFirst.toFixed(2)}s)`);
    assert.ok(secondsAfterFirst * 1000 <= AUTO_DELAY_MAX_MS,
      `automatic burst started too late (${secondsAfterFirst.toFixed(2)}s)`);
    assert.ok(secondsAfterSecond < 35,
      `second client appears to have restarted the timer (${secondsAfterSecond.toFixed(2)}s after its connection)`);
    assert.equal(server.simulator.burstNumber, 1, "one first-client timer should have started exactly one burst");
    console.log(
      `PASS automatic timing: burst started ${secondsAfterFirst.toFixed(2)}s after client 1; `
      + `client 2 connected ${((secondConnectedAt - firstConnectedAt) / 1000).toFixed(2)}s after client 1; `
      + `burst started ${secondsAfterSecond.toFixed(2)}s after client 2 (timer was not reset)`,
    );
  } finally {
    unsubscribe();
    await closeSocket(firstSocket);
    await closeSocket(secondSocket);
    await server.close();
    assert.equal(server.activeTimerCount, 0, "automatic timer check must clean up every server timer");
  }
}

async function main() {
  assert.equal(BUS_COUNT, 30, "load-test acceptance requires exactly 30 configured buses");
  console.log(`Step 9 load test: ${BUS_COUNT} buses, ${NORMAL_HZ} Hz normal, ${BURST_DURATION_MS} ms bursts`);
  console.log("Age measures newest accepted state in the headless FleetStore, not browser paint; the browser honesty panel measures repaint behavior.");

  const external = Boolean(process.env.LOAD_TEST_URL);
  let localServer = null;
  let socket;
  let observer;
  const sampleTimers = new Set();
  let burstResults = [];

  try {
    let endpoints;
    if (external) {
      endpoints = normalizeLoadTestUrl(process.env.LOAD_TEST_URL);
      console.log(`Using running server: ${endpoints.httpOrigin}`);
    } else {
      localServer = await start(0, {
        firstBurstDelayMs: 180_000,
        burstIntervalMs: 180_000,
        burstOnStart: false,
        simulator: { burstDurationMs: BURST_DURATION_MS },
      });
      endpoints = {
        httpOrigin: `http://127.0.0.1:${localServer.port}`,
        feedUrl: `ws://127.0.0.1:${localServer.port}/feed`,
      };
      console.log(`Started isolated test server on port ${localServer.port}`);
    }

    socket = await connect(endpoints.feedUrl);
    observer = createFeedObserver(socket, { server: localServer, sampleTimers });

    observer.phase = "baseline";
    const baselineStartedAt = performance.now();
    await wait(BASELINE_MS);
    observer.phase = "idle";
    const baselineSeconds = (performance.now() - baselineStartedAt) / 1000;
    const baselineRate = observer.baselineMessages / baselineSeconds;
    assert.ok(observer.seenBusIds.size === BUS_COUNT,
      `baseline saw ${observer.seenBusIds.size} buses, expected ${BUS_COUNT}`);
    assert.ok(baselineRate >= 45 && baselineRate <= 75,
      `normal feed expected roughly 60 msgs/sec; got ${baselineRate.toFixed(2)}`);
    assert.equal(observer.normalOutOfOrder, 0, "normal mode must not reorder per-bus messages");
    console.log(
      `PASS baseline: ${observer.baselineMessages} messages / ${baselineSeconds.toFixed(2)}s `
      + `= ${baselineRate.toFixed(2)} msgs/sec; ${observer.seenBusIds.size} distinct buses; `
      + `${observer.normalOutOfOrder} normal out-of-order arrivals`,
    );

    const heapBefore = memorySample();
    const staleBeforeAllBursts = observer.store.totalRejectedStale;
    for (let index = 0; index < BURST_COUNT; index += 1) {
      const staleBeforeThisBurst = observer.store.totalRejectedStale;
      const context = observer.createBurst(`burst ${index + 1}`);
      await triggerBurst(context, endpoints.httpOrigin, Boolean(localServer));
      const convergenceMs = localServer ? await waitForStateConvergence(observer) : 0;
      const result = observer.finishBurst(context);
      burstResults.push(result);

      const snapshot = observer.compareAcceptedWithProduced();
      const maxAge = Math.max(...result.maxAgeByBus.values());
      assert.equal(result.maxAgeByBus.size, BUS_COUNT,
        `${context.label}: must sample state age for all buses`);
      for (const busId of expectedBusIds) {
        assert.ok(result.maxAgeByBus.has(busId), `${context.label}: missing age sample for ${busId}`);
        assert.ok(result.maxAgeByBus.get(busId) <= 1000,
          `${context.label}: ${busId} maximum accepted-state age was ${result.maxAgeByBus.get(busId)}ms`);
      }
      assert.ok(result.averageMsgsPerSec >= 2500 && result.averageMsgsPerSec <= 3500,
        `${context.label}: average rate ${result.averageMsgsPerSec.toFixed(2)} msgs/sec outside target range`);
      assert.ok(result.peakMsgsPerSec >= 2500 && result.peakMsgsPerSec <= 3500,
        `${context.label}: peak one-second bucket ${result.peakMsgsPerSec} msgs/sec outside target range`);
      assert.ok(result.outOfOrder > 0, `${context.label}: expected out-of-order burst arrivals`);
      assert.equal(snapshot.get("BUS-07")?.door, "CLOSED",
        `${context.label}: delayed BUS-07 OPEN must not resurrect after CLOSED`);
      assert.ok(observer.store.totalRejectedStale > staleBeforeThisBurst,
        `${context.label}: FleetStore must reject stale frames during the burst`);

      console.log(
        `PASS ${context.label}: ${result.deliveredCount} messages / ${result.durationSeconds.toFixed(3)}s `
        + `(avg ${result.averageMsgsPerSec.toFixed(2)}, peak ${result.peakMsgsPerSec}/sec); `
        + `out-of-order ${result.outOfOrder}; stale rejects ${observer.store.totalRejectedStale - staleBeforeThisBurst}; `
        + `age samples ${result.ageSamples}, worst ${maxAge.toFixed(1)}ms; store ${snapshot.size}/30`
        + (localServer ? `; producer convergence ${convergenceMs.toFixed(1)}ms` : ""),
      );
      if (localServer) {
        console.log(`  produced BUS-07 seq ${localServer.simulator.buses.find((bus) => bus.busId === "BUS-07").seq - 1}; door ${snapshot.get("BUS-07").door}`);
      } else {
        console.log("  External-server mode compares accepted seq with the highest seq received on this WebSocket; producer internals are not exposed.");
      }
    }

    assert.ok(observer.store.totalRejectedStale - staleBeforeAllBursts > 0,
      "at least one stale update must be rejected during the three bursts");
    assert.equal(observer.resurrectionCount, 0, "displayed state must never regress or resurrect CLOSED to stale OPEN");
    assert.equal(observer.parseErrors, 0, "all feed messages must be valid JSON");
    if (localServer) assert.deepEqual(observer.producerErrors, [], "simulator production seq/timestamps must remain valid");

    const finalSnapshot = observer.compareAcceptedWithProduced();
    assert.deepEqual([...observer.seenBusIds].sort(), expectedBusIds,
      "the load-test client must see exactly the expected 30 bus IDs");
    const maxAgeByBus = new Map(expectedBusIds.map((busId) => [busId, 0]));
    for (const burst of burstResults) {
      for (const [busId, age] of burst.maxAgeByBus) {
        maxAgeByBus.set(busId, Math.max(maxAgeByBus.get(busId), age));
      }
    }
    const ageRows = [...maxAgeByBus].sort((left, right) => right[1] - left[1]);
    const worstAge = ageRows[0];
    const p99Age = percentile(burstResults.flatMap((burst) => burst.ageObservations), 0.99);
    assert.ok(ageRows.every(([, age]) => age <= 1000), "every bus must remain at or under the 1000 ms freshness limit");
    assert.equal(finalSnapshot.size, BUS_COUNT, "final fleet store must have one entry per bus");
    assert.equal(finalSnapshot.get("BUS-07")?.door, "CLOSED", "final BUS-07 door state must be CLOSED");

    const heapAfter = memorySample();
    const heapGrowth = heapAfter - heapBefore;
    const memoryTolerance = Math.max(MEMORY_GROWTH_TOLERANCE_BYTES, heapBefore * 0.25);
    assert.ok(heapGrowth <= memoryTolerance,
      `heap grew ${heapGrowth} bytes, exceeding bounded-growth tolerance ${memoryTolerance}`);

    console.log(`PASS freshness over ${BURST_COUNT} bursts: worst per-bus maximum ${worstAge[1].toFixed(1)}ms on ${worstAge[0]}; p99 of all 50ms bus-age samples ${p99Age.toFixed(1)}ms.`);
    console.log("Per-bus maximum displayed-state age across all bursts (50 ms samples):");
    for (const [busId, age] of [...maxAgeByBus].sort((left, right) => left[0].localeCompare(right[0]))) {
      console.log(`  ${busId}: ${age.toFixed(1)} ms`);
    }
    console.log(`PASS no resurrection: ${observer.resurrectionCount}; BUS-07 final ${finalSnapshot.get("BUS-07").door} seq ${finalSnapshot.get("BUS-07").seq}.`);
    console.log(`PASS fleet coverage and final seq: ${observer.seenBusIds.size} distinct IDs; ${finalSnapshot.size} store entries; each accepted seq matched the ${localServer ? "highest produced" : "highest received"} seq after drain.`);
    console.log(
      `PASS bounded soak: heap used ${Math.round(heapBefore / 1024)} KiB before -> `
      + `${Math.round(heapAfter / 1024)} KiB after (growth ${Math.round(heapGrowth / 1024)} KiB; `
      + `allowed ${Math.round(memoryTolerance / 1024)} KiB); store entries ${observer.store.latestByBus.size}. `
      + "Heap samples forced GC; the tolerance permits runtime noise while checking for unbounded retained growth.",
    );

    if (localServer) {
      await closeSocket(socket);
      socket = null;
      await localServer.close();
      assert.equal(localServer.activeTimerCount, 0, "server shutdown must clear normal, stats, auto-burst, and delivery timers");
      localServer = null;
      console.log("PASS shutdown cleanup: all local server and simulator timers cleared.");
    }

    await runAutomaticBurstTimingCheck();
    console.log("PASS headless load test: every check passed.");
  } finally {
    for (const timer of sampleTimers) clearInterval(timer);
    await closeSocket(socket);
    if (localServer) await localServer.close();
  }
}

main().catch((error) => {
  console.error(`FAIL headless load test: ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
