const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

export class FleetStore {
  constructor() {
    this.latestByBus = new Map();
    this.runId = null;
    this.totalReceived = 0;
    this.totalAccepted = 0;
    this.totalRejectedStale = 0;
    this.totalRejectedInvalid = 0;
    this.dirty = false;
  }

  accept(update) {
    this.totalReceived += 1;

    let candidate;
    try {
      if (update === null || typeof update !== "object" || Array.isArray(update)) {
        return this._rejectInvalid();
      }
      const { runId, busId, seq, ts, x, y, speed, door } = update;
      if (
        typeof runId !== "string"
        || typeof busId !== "string"
        || !isFiniteNumber(seq)
        || !isFiniteNumber(ts)
        || !isFiniteNumber(x)
        || !isFiniteNumber(y)
        || !isFiniteNumber(speed)
        || (door !== "OPEN" && door !== "CLOSED")
      ) {
        return this._rejectInvalid();
      }
      candidate = { runId, busId, seq, ts, x, y, speed, door };
    } catch {
      return this._rejectInvalid();
    }

    if (candidate.runId !== this.runId) {
      // A restarted server has a new runId and resets seq; clear old maxima so its updates are accepted.
      this.latestByBus.clear();
      this.runId = candidate.runId;
    }

    const newest = this.latestByBus.get(candidate.busId);
    if (newest && candidate.seq <= newest.seq) {
      // Arrival order isn't truth; the per-bus seq is, so stale frames cannot undo newer state.
      this.totalRejectedStale += 1;
      return "stale";
    }

    this.latestByBus.set(candidate.busId, candidate);
    this.totalAccepted += 1;
    this.dirty = true;
    return "accepted";
  }

  _rejectInvalid() {
    this.totalRejectedInvalid += 1;
    return "invalid";
  }

  getSnapshot() {
    return [...this.latestByBus.values()]
      .map((update) => ({ ...update }))
      .sort((left, right) => left.busId.localeCompare(right.busId));
  }

  consumeDirty() {
    const wasDirty = this.dirty;
    this.dirty = false;
    return wasDirty;
  }
}

export function createFleetStore() {
  return new FleetStore();
}

export default createFleetStore;
