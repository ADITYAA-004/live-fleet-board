import { useEffect, useRef, useState } from "react";
import { FleetTable } from "./components/FleetTable.jsx";
import { createFleetStore } from "./lib/fleetStore.js";

const BUS_IDS = Array.from({ length: 30 }, (_, index) => (
  `BUS-${String(index + 1).padStart(2, "0")}`
));

const emptySnapshot = () => BUS_IDS.map((busId) => ({ busId, update: null, ageMs: null }));

export default function App() {
  const [status, setStatus] = useState("disconnected");
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const storeRef = useRef(null);
  if (storeRef.current === null) storeRef.current = createFleetStore();
  const store = storeRef.current;

  useEffect(() => {
    // TEMP – replaced by requestAnimationFrame in Step 6
    const snapshotTimer = setInterval(() => {
      const now = Date.now();
      const latestUpdates = store.getSnapshot();
      setSnapshot(BUS_IDS.map((busId) => {
        const update = latestUpdates.find((candidate) => candidate.busId === busId);
        return update
          ? { busId, update, ageMs: now - update.ts }
          : { busId, update: null, ageMs: null };
      }));
    }, 100);

    return () => clearInterval(snapshotTimer);
  }, [store]);

  useEffect(() => {
    let active = true;
    let socket;
    let reconnectTimer = null;
    let retryDelay = 1000;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/feed`;

    const scheduleReconnect = () => {
      if (!active || reconnectTimer !== null) return;
      const delay = retryDelay;
      retryDelay = Math.min(retryDelay * 2, 5000);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (!active) return;
      try {
        socket = new WebSocket(url);
      } catch {
        setStatus("disconnected");
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        if (!active) {
          socket.close();
          return;
        }
        retryDelay = 1000;
        setStatus("connected");
      };
      socket.onmessage = (event) => {
        try {
          store.accept(JSON.parse(event.data));
        } catch {
          store.accept(null);
        }
      };
      socket.onerror = () => {
        socket.close();
      };
      socket.onclose = () => {
        if (!active) return;
        setStatus("disconnected");
        scheduleReconnect();
      };
    };

    connect();
    return () => {
      active = false;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    };
  }, [store]);

  return (
    <main className="debug-view">
      <header className="board-header">
        <h1>Live Fleet Board</h1>
        <p className={`connection connection--${status}`}>
          WebSocket: <strong>{status}</strong>
        </p>
      </header>
      <FleetTable snapshot={snapshot} />
    </main>
  );
}
