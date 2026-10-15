import { memo } from "react";

const FleetRow = memo(function FleetRow({ bus }) {
  const { busId, update, ageMs } = bus;

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
          <td>{ageMs}</td>
        </>
      ) : (
        <td colSpan="5" className="waiting">waiting…</td>
      )}
    </tr>
  );
}, (previous, next) => (
  previous.bus.busId === next.bus.busId
  && previous.bus.update?.seq === next.bus.update?.seq
  && previous.bus.ageMs === next.bus.ageMs
));

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
