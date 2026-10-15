import { Profiler, useEffect, useRef, useState } from "react";
import { FleetMetrics } from "./components/FleetMetrics.jsx";
import { FleetTable } from "./components/FleetTable.jsx";
import { createFleetStore } from "./lib/fleetStore.js";
import { createMetrics } from "./lib/metrics.js";
import { useFleetSnapshot } from "./hooks/useFleetSnapshot.js";

export default function App() {
  const [status, setStatus] = useState("disconnected");
  const storeRef = useRef(null);
  if (storeRef.current === null) storeRef.current = createFleetStore();
  const store = storeRef.current;
  const metricsRef = useRef(null);
  if (metricsRef.current === null) metricsRef.current = createMetrics({ now: () => Date.now() });
  const metrics = metricsRef.current;
  const { snapshot, metrics: metricSnapshot } = useFleetSnapshot(store, metrics);

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
    <Profiler
      id="Live Fleet Board"
      onRender={() => metrics.recordCommit(Date.now())}
    >
      <main className="debug-view">
        <header className="board-header">
          <h1>Live Fleet Board</h1>
          <p className={`connection connection--${status}`}>
            WebSocket: <strong>{status}</strong>
          </p>
        </header>
        <FleetMetrics metrics={metricSnapshot} />
        <FleetTable snapshot={snapshot} />
      </main>
    </Profiler>
  );
}
