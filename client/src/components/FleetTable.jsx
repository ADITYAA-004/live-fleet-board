import { memo } from "react";

const FleetRow = memo(function FleetRow({ bus }) {
  const { busId, update, freshness } = bus;

  return (
    <tr>
      <th scope="row">{busId}</th>
      {update ? (
        <>
          <td>{update.x.toFixed(1)}, {update.y.toFixed(1)}</td>
          <td>{update.speed.toFixed(1)}</td>
          <td>
            <span className={`door door--${update.door.toLowerCase()}`}>
              {update.door}
            </span>
          </td>
          <td>{update.seq}</td>
          <td>
            <span className={`update-age update-age--${freshness.level}`}>
              {freshness.ageMs} ms
              {freshness.badge && <strong className="stale-badge">{freshness.badge}</strong>}
            </span>
          </td>
        </>
      ) : (
        <td colSpan="5" className="waiting">waiting…</td>
      )}
    </tr>
  );
}, (previous, next) => {
  const sameBus = previous.bus.busId === next.bus.busId;
  const sameSequence = previous.bus.update?.seq === next.bus.update?.seq;
  const sameRun = previous.bus.update?.runId === next.bus.update?.runId;
  // Compare runId because restart resets seq; returned per-frame ages must keep updating.
  const sameAge = previous.bus.freshness?.ageMs === next.bus.freshness?.ageMs;
  return sameBus && sameRun && sameSequence && sameAge;
});

export function FleetTable({ snapshot }) {
  const sortedBuses = [...snapshot].sort((left, right) => left.busId.localeCompare(right.busId));

  return (
    <div className="table-scroll">
      <table className="fleet-table">
        <thead>
          <tr>
            <th scope="col">Bus ID</th>
            <th scope="col">Position (x, y)</th>
            <th scope="col">Speed (km/h)</th>
            <th scope="col">Door</th>
            <th scope="col">Last seq</th>
            <th scope="col">Update age (ms)</th>
          </tr>
        </thead>
        <tbody>
          {sortedBuses.map((bus) => <FleetRow key={bus.busId} bus={bus} />)}
        </tbody>
      </table>
    </div>
  );
}
