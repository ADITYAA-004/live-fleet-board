function showCount(value) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString() : "—";
}

function showMilliseconds(value) {
  return Number.isFinite(value) ? `${Math.round(value).toLocaleString()} ms` : "—";
}

function Metric({ label, value, detail, className = "" }) {
  return (
    <div className={`metric ${className}`.trim()}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function FleetMetrics({ metrics }) {
  const incomingRate = metrics?.incomingPerSecond;

  return (
    <section className="metrics-panel" aria-label="Measured fleet metrics">
      <h2>Measured metrics</h2>
      <dl className="metrics-grid">
        <Metric label="Vehicles with data" value={showCount(metrics?.vehicleCount)} />
        <Metric
          label="Incoming updates/sec"
          value={Number.isFinite(incomingRate) ? showCount(incomingRate) : "—"}
          className="metric--rate"
        />
        <Metric
          label="React commits/sec (FPS)"
          value={showCount(metrics?.reactCommitsPerSecond)}
          detail="Dashboard commits in the rolling second"
        />
        <Metric
          label="Browser rAF callbacks/sec"
          value={showCount(metrics?.rafCallbacksPerSecond)}
          detail="Frames offered by the browser"
        />
        <Metric label="Accepted updates" value={showCount(metrics?.totalAccepted)} />
        <Metric label="Rejected stale" value={showCount(metrics?.totalRejectedStale)} />
        <Metric label="Rejected invalid" value={showCount(metrics?.totalRejectedInvalid)} />
        <Metric label="Current max staleness" value={showMilliseconds(metrics?.currentMaxStalenessMs)} />
        <Metric label="Peak max staleness · 10 s" value={showMilliseconds(metrics?.peakMaxStaleness10sMs)} />
        <Metric
          label="Feed state"
          value={metrics ? metrics.burst : "—"}
          className={metrics?.burst === "BURST" ? "metric--burst" : "metric--normal"}
        />
      </dl>
    </section>
  );
}
