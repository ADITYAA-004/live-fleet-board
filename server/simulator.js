import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  BUS_COUNT,
  BURST_DURATION_MS,
  BURST_MULTIPLIER,
  NORMAL_HZ,
} from "./config.js";

const RUN_ID = randomUUID();
const GRID_MIN = 0;
const GRID_MAX = 1000;
const MAX_SPEED = 80;
const BURST_SCHEDULER_TICK_MS = 5;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function approach(value, target, maxChange) {
  if (value < target) return Math.min(value + maxChange, target);
  return Math.max(value - maxChange, target);
}

export class Simulator {
  constructor(options = {}) {
    this.runId = RUN_ID;
    this.busCount = options.busCount ?? BUS_COUNT;
    this.normalHz = options.normalHz ?? NORMAL_HZ;
    this.burstMultiplier = options.burstMultiplier ?? BURST_MULTIPLIER;
    this.burstDurationMs = options.burstDurationMs ?? BURST_DURATION_MS;
    this.baseIntervalMs = 1000 / this.normalHz;
    this.listeners = new Set();
    this.burstListeners = new Set();
    this.running = false;
    this.burstActive = false;
    this.burstTimer = null;
    this.burstNumber = 0;
    this.burstStartedAt = null;
    this.burstStartedMonotonic = null;
    this.burstEndsMonotonic = null;
    this.buses = Array.from({ length: this.busCount }, (_, index) => ({
      busId: `BUS-${String(index + 1).padStart(2, "0")}`,
      x: randomBetween(100, 900),
      y: randomBetween(100, 900),
      speed: randomBetween(30, 60),
      targetSpeed: randomBetween(35, 65),
      door: "CLOSED",
      seq: 1,
      heading: randomBetween(0, Math.PI * 2),
      phase: "driving",
      nextStopAt: null,
      stopUntil: null,
      nextSpeedChangeAt: null,
      lastUpdateAt: null,
      nextTickAt: null,
      rateMultiplier: 1,
      timer: null,
      burstInjectionId: null,
    }));
  }

  onUpdate(fn) {
    if (typeof fn !== "function") throw new TypeError("onUpdate expects a function");
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onBurst(fn) {
    if (typeof fn !== "function") throw new TypeError("onBurst expects a function");
    this.burstListeners.add(fn);
    return () => this.burstListeners.delete(fn);
  }

  start() {
    if (this.running) return this;
    this.running = true;
    this._scheduleNormal(Date.now());
    return this;
  }

  triggerBurst() {
    if (!this.running || this.burstActive) return false;

    this.burstActive = true;
    this.burstNumber += 1;
    this.burstStartedAt = Date.now();
    this.burstStartedMonotonic = performance.now();
    this.burstEndsMonotonic = this.burstStartedMonotonic + this.burstDurationMs;
    const intervalMs = this.baseIntervalMs / this.burstMultiplier;

    for (const bus of this.buses) {
      if (bus.timer !== null) clearTimeout(bus.timer);
      bus.timer = null;
      bus.rateMultiplier = this.burstMultiplier;
      // Stagger initial burst deadlines too; elapsed-time catch-up handles slow Windows timers.
      bus.nextTickAt = this.burstStartedMonotonic + intervalMs * (this.buses.indexOf(bus) / this.buses.length);
    }

    const injectionBus = this.buses.find((bus) => bus.busId === "BUS-07") ?? this.buses[0];
    if (injectionBus) {
      const injectionId = `${this.runId}-${this.burstNumber}`;
      // Put one bus into a genuine stopped/dwell state, then let its next burst tick close the door.
      // This deliberately short test dwell gives the delivery layer an adjacent OPEN/CLOSED pair.
      injectionBus.speed = 0;
      injectionBus.targetSpeed = 0;
      injectionBus.door = "OPEN";
      injectionBus.phase = "dwell";
      injectionBus.stopUntil = Date.now() + intervalMs;
      injectionBus.burstInjectionId = injectionId;
      this._produceUpdate(injectionBus, Date.now(), {
        burst: true,
        injectionId,
        injectionRole: "open",
      });
      injectionBus.nextTickAt = this.burstStartedMonotonic + intervalMs;
    }

    this._emitBurst({
      type: "start",
      burstNumber: this.burstNumber,
      startedAt: this.burstStartedAt,
      durationMs: this.burstDurationMs,
      intervalMs,
    });
    this._scheduleBurstTick();
    return true;
  }

  stop() {
    this.running = false;
    for (const bus of this.buses) {
      if (bus.timer !== null) clearTimeout(bus.timer);
      bus.timer = null;
    }
    if (this.burstTimer !== null) clearTimeout(this.burstTimer);
    this.burstTimer = null;

    if (this.burstActive) {
      this.burstActive = false;
      this._emitBurst({
        type: "end",
        burstNumber: this.burstNumber,
        startedAt: this.burstStartedAt,
        endedAt: Date.now(),
        interrupted: true,
      });
    }
  }

  get activeTimerCount() {
    return this.buses.reduce((count, bus) => count + (bus.timer === null ? 0 : 1), 0)
      + (this.burstTimer === null ? 0 : 1);
  }

  _scheduleNormal(startedAt) {
    if (!this.running || this.burstActive) return;
    this.buses.forEach((bus, index) => {
      bus.rateMultiplier = 1;
      bus.nextTickAt = startedAt + (this.baseIntervalMs * index) / this.buses.length;
      this._scheduleNormalBus(bus);
    });
  }

  _scheduleNormalBus(bus) {
    if (!this.running || this.burstActive) return;
    const delay = Math.max(0, bus.nextTickAt - Date.now());
    bus.timer = setTimeout(() => {
      bus.timer = null;
      if (!this.running || this.burstActive) return;

      const intendedTickAt = bus.nextTickAt;
      this._produceUpdate(bus, Date.now(), { burst: false });
      bus.nextTickAt = intendedTickAt + this.baseIntervalMs;
      const afterWork = Date.now();
      if (bus.nextTickAt <= afterWork) {
        const missedIntervals = Math.floor((afterWork - bus.nextTickAt) / this.baseIntervalMs) + 1;
        bus.nextTickAt += missedIntervals * this.baseIntervalMs;
      }

      this._scheduleNormalBus(bus);
    }, delay);
  }

  _scheduleBurstTick() {
    if (!this.running || !this.burstActive || this.burstTimer !== null) return;
    this.burstTimer = setTimeout(() => this._runBurstTick(), BURST_SCHEDULER_TICK_MS);
  }

  _runBurstTick() {
    this.burstTimer = null;
    if (!this.running || !this.burstActive) return;

    const nowMonotonic = performance.now();
    const burstEnd = this.burstEndsMonotonic;
    const intervalMs = this.baseIntervalMs / this.burstMultiplier;

    for (const bus of this.buses) {
      while (bus.nextTickAt <= nowMonotonic && bus.nextTickAt <= burstEnd) {
        this._produceUpdate(bus, Date.now(), { burst: true });
        bus.nextTickAt += intervalMs;
      }
    }

    if (nowMonotonic >= burstEnd) {
      this._finishBurst();
      return;
    }
    this._scheduleBurstTick();
  }

  _finishBurst() {
    this.burstActive = false;
    const event = {
      type: "end",
      burstNumber: this.burstNumber,
      startedAt: this.burstStartedAt,
      endedAt: Date.now(),
      interrupted: false,
    };
    this._emitBurst(event);
    if (this.running && !this.burstActive) this._scheduleNormal(Date.now());
  }

  _produceUpdate(bus, now, delivery = {}) {
    const previousSpeed = bus.speed;
    const elapsedSeconds = bus.lastUpdateAt === null
      ? 0
      : Math.max(0, (now - bus.lastUpdateAt) / 1000);
    bus.lastUpdateAt = now;

    let deliveryInfo = delivery;
    if (bus.phase === "driving") {
      if (bus.nextStopAt === null) {
        bus.nextStopAt = now + randomBetween(8000, 12000);
        bus.nextSpeedChangeAt = now + randomBetween(5000, 9000);
      }
      if (now >= bus.nextStopAt) {
        bus.phase = "braking";
        bus.targetSpeed = 0;
      } else if (now >= bus.nextSpeedChangeAt) {
        bus.targetSpeed = randomBetween(30, 70);
        bus.nextSpeedChangeAt = now + randomBetween(5000, 9000);
      }
    }

    if (bus.phase === "driving") {
      bus.speed = approach(bus.speed, bus.targetSpeed, 12 * elapsedSeconds);
    } else if (bus.phase === "braking") {
      bus.speed = approach(bus.speed, 0, 18 * elapsedSeconds);
      if (bus.speed <= 0.5) {
        bus.speed = 0;
        bus.door = "OPEN";
        bus.phase = "dwell";
        bus.stopUntil = now + randomBetween(1000, 3000);
      }
    } else {
      bus.speed = 0;
      if (now >= bus.stopUntil) {
        bus.door = "CLOSED";
        bus.phase = "driving";
        bus.targetSpeed = randomBetween(35, 65);
        bus.nextStopAt = now + randomBetween(15000, 30000);
        bus.nextSpeedChangeAt = now + randomBetween(5000, 9000);
        if (bus.burstInjectionId) {
          deliveryInfo = {
            burst: true,
            injectionId: bus.burstInjectionId,
            injectionRole: "closed",
          };
          bus.burstInjectionId = null;
        }
      }
    }

    if (bus.door === "OPEN") bus.speed = 0;
    this._move(bus, ((previousSpeed + bus.speed) / 2) * elapsedSeconds);

    const update = {
      runId: this.runId,
      busId: bus.busId,
      seq: bus.seq++,
      ts: Date.now(),
      x: bus.x,
      y: bus.y,
      speed: Math.min(MAX_SPEED, bus.speed),
      door: bus.door,
    };
    for (const listener of this.listeners) listener(update, deliveryInfo);
  }

  _emitBurst(event) {
    for (const listener of this.burstListeners) listener(event);
  }

  _move(bus, speedDistance) {
    // The scale converts km/h into a modest grid displacement per second.
    const distance = (speedDistance / 3.6) * 0.05;
    bus.x += Math.cos(bus.heading) * distance;
    bus.y += Math.sin(bus.heading) * distance;

    if (bus.x < GRID_MIN || bus.x > GRID_MAX) {
      bus.x = Math.max(GRID_MIN, Math.min(GRID_MAX, bus.x));
      bus.heading = Math.PI - bus.heading;
    }
    if (bus.y < GRID_MIN || bus.y > GRID_MAX) {
      bus.y = Math.max(GRID_MIN, Math.min(GRID_MAX, bus.y));
      bus.heading = -bus.heading;
    }
  }
}

export default Simulator;
