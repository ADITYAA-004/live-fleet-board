const RATE_WINDOW_MS = 1000;
const PEAK_WINDOW_MS = 10_000;
const BURST_RATE_THRESHOLD = 500;

export function classifyStaleness(ageMs) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return { level: "normal", badge: null };
  if (ageMs > 1000) return { level: "red", badge: "STALE" };
  if (ageMs >= 500) return { level: "amber", badge: null };
  return { level: "normal", badge: null };
}

function calculateBusAges(snapshot, now) {
  return snapshot
    .filter((update) => update && Number.isFinite(update.ts))
    .map((update) => {
      const ageMs = Math.max(0, now - update.ts);
      const freshness = classifyStaleness(ageMs);
      return {
        busId: update.busId,
        ageMs,
        level: freshness.level,
        badge: freshness.badge,
      };
    });
}

function counterAt(samples, time) {
  const first = samples[0];
  if (time <= first.at) return { at: first.at, count: first.count };

  for (let index = 1; index < samples.length; index += 1) {
    const right = samples[index];
    if (right.at < time) continue;
    const left = samples[index - 1];
    const duration = right.at - left.at;
    if (duration <= 0) return { at: right.at, count: right.count };
    const progress = (time - left.at) / duration;
    return {
      at: time,
      count: left.count + (right.count - left.count) * progress,
    };
  }

  const last = samples[samples.length - 1];
  return { at: last.at, count: last.count };
}

function countRecent(events, now) {
  const cutoff = now - RATE_WINDOW_MS;
  while (events.length > 0 && events[0] < cutoff) events.shift();
  return events.length;
}

export function createMetrics({ now = () => Date.now() } = {}) {
  const receivedSamples = [];
  const commitTimes = [];
  const frameTimes = [];
  const stalenessSamples = [];

  function recordEvent(events, at) {
    const timestamp = at ?? now();
    const last = events[events.length - 1];
    events.push(last === undefined ? timestamp : Math.max(timestamp, last));
  }

  function sampleReceivedRate(totalReceived, sampledAt) {
    const previous = receivedSamples[receivedSamples.length - 1];
    if (previous && previous.at === sampledAt) {
      previous.count = totalReceived;
    } else {
      receivedSamples.push({ at: sampledAt, count: totalReceived });
    }

    const cutoff = sampledAt - RATE_WINDOW_MS;
    const baseline = counterAt(receivedSamples, cutoff);
    const elapsed = sampledAt - baseline.at;
    const rate = elapsed > 0 ? ((totalReceived - baseline.count) * 1000) / elapsed : 0;

    // Keep one sample on each side of the rolling-window boundary for interpolation.
    while (receivedSamples.length > 2 && receivedSamples[1].at < cutoff) {
      receivedSamples.shift();
    }
    return Math.max(0, rate);
  }

  function sample({
    totalReceived,
    totalAccepted,
    totalRejectedStale,
    totalRejectedInvalid,
    snapshot,
  }, sampledAt = now()) {
    const busAges = calculateBusAges(snapshot, sampledAt);
    const currentMaxStalenessMs = busAges.length === 0
      ? null
      : Math.max(...busAges.map((entry) => entry.ageMs));
    if (currentMaxStalenessMs !== null) {
      stalenessSamples.push({ at: sampledAt, value: currentMaxStalenessMs });
    }
    const peakCutoff = sampledAt - PEAK_WINDOW_MS;
    while (stalenessSamples.length > 0 && stalenessSamples[0].at < peakCutoff) {
      stalenessSamples.shift();
    }

    const incomingPerSecond = sampleReceivedRate(totalReceived, sampledAt);
    const peakMaxStaleness10sMs = stalenessSamples.length === 0
      ? null
      : Math.max(...stalenessSamples.map((entry) => entry.value));

    return {
      vehicleCount: snapshot.filter(Boolean).length,
      busAges,
      incomingPerSecond,
      reactCommitsPerSecond: countRecent(commitTimes, sampledAt),
      rafCallbacksPerSecond: countRecent(frameTimes, sampledAt),
      totalAccepted,
      totalRejectedStale,
      totalRejectedInvalid,
      currentMaxStalenessMs,
      peakMaxStaleness10sMs,
      burst: incomingPerSecond > BURST_RATE_THRESHOLD ? "BURST" : "normal",
    };
  }

  return {
    recordCommit(at) {
      recordEvent(commitTimes, at);
    },
    recordRafCallback(at) {
      recordEvent(frameTimes, at);
    },
    sample,
  };
}
