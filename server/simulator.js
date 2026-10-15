import { randomUUID } from "node:crypto";
import { BUS_COUNT, NORMAL_HZ } from "./config.js";

const RUN_ID = randomUUID();
const GRID_MIN = 0;
const GRID_MAX = 1000;
const MAX_SPEED = 80;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function approach(value, target, maxChange) {
  if (value < target) return Math.min(value + maxChange, target);
  return Math.max(value - maxChange, target);
}

export class Simulator {
  constructor() {
    this.runId = RUN_ID;
    this.baseIntervalMs = 1000 / NORMAL_HZ;
    this.listeners = new Set();
    this.running = false;
    this.buses = Array.from({ length: BUS_COUNT }, (_, index) => ({
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
    }));
  }

  onUpdate(fn) {
    if (typeof fn !== "function") {
      throw new TypeError("onUpdate expects a function");
    }

    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  start() {
    if (this.running) return this;

    this.running = true;
    const startedAt = Date.now();
    this.buses.forEach((bus, index) => {
      // Spread each bus's first tick across one normal interval to avoid a synchronized burst.
      bus.nextTickAt = startedAt + (this.baseIntervalMs * index) / this.buses.length;
      this._schedule(bus);
    });
    return this;
  }

  stop() {
    this.running = false;
    for (const bus of this.buses) {
      if (bus.timer !== null) {
        clearTimeout(bus.timer);
        bus.timer = null;
      }
    }
  }

  get activeTimerCount() {
    return this.buses.reduce((count, bus) => count + (bus.timer === null ? 0 : 1), 0);
  }

  _intervalFor(bus) {
    // Keeping the multiplier per bus makes the later burst-rate change local to scheduling.
    return this.baseIntervalMs / bus.rateMultiplier;
  }

  _schedule(bus) {
    const delay = Math.max(0, bus.nextTickAt - Date.now());
    bus.timer = setTimeout(() => {
      bus.timer = null;
      if (!this.running) return;

      const intendedTickAt = bus.nextTickAt;
      this._produceUpdate(bus, Date.now());

      const interval = this._intervalFor(bus);
      bus.nextTickAt = intendedTickAt + interval;
      const afterWork = Date.now();
      if (bus.nextTickAt <= afterWork) {
        const missedIntervals = Math.floor((afterWork - bus.nextTickAt) / interval) + 1;
        bus.nextTickAt += missedIntervals * interval;
      }

      if (this.running) this._schedule(bus);
    }, delay);
  }

  _produceUpdate(bus, now) {
    const previousSpeed = bus.speed;
    const elapsedSeconds = bus.lastUpdateAt === null
      ? 0
      : Math.max(0, (now - bus.lastUpdateAt) / 1000);
    bus.lastUpdateAt = now;

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
      }
    }

    if (bus.door === "OPEN") {
      bus.speed = 0;
    }
    this._move(bus, ((previousSpeed + bus.speed) / 2) * elapsedSeconds);

    const update = {
      runId: this.runId,
      busId: bus.busId,
      seq: bus.seq++,
      ts: Date.now(),
      x: bus.x,
      y: bus.y,
      speed: bus.speed,
      door: bus.door,
    };
    for (const listener of this.listeners) listener(update);
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
