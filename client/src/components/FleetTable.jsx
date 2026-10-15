import { memo } from "react";

const FleetRow = memo(function FleetRow({ bus, now }) {
  const { busId, update } = bus;

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
          <td>{now - update.ts}</td>
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
  // Compare runId because restart resets seq; populated rows compare frame time so ages stay fresh.
  const sameAge = previous.bus.update === null || previous.now === next.now;
  return sameBus && sameRun && sameSequence && sameAge;
});

export function FleetTable({ snapshot, now }) {
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
          {sortedBuses.map((bus) => <FleetRow key={bus.busId} bus={bus} now={now} />)}
        </tbody>
      </table>
    </div>
  );
}
