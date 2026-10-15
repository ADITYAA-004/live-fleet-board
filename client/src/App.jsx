import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("disconnected");
  const [messages, setMessages] = useState([]);

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
        if (!active) return;
        // TEMP DEBUG VIEW – replaced in Step 5/6
        setMessages((current) => [...current, String(event.data)].slice(-10));
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
  }, []);

  return (
    <main className="debug-view">
      <p className="eyebrow">TEMPORARY TELEMETRY DEBUG VIEW</p>
      <h1>Live Fleet Board</h1>
      <p className={`connection connection--${status}`}>
        WebSocket: <strong>{status}</strong>
      </p>
      <section aria-labelledby="messages-heading">
        <h2 id="messages-heading">Last 10 raw messages</h2>
        <ol className="message-list">
          {messages.map((message, index) => (
            <li key={`${index}-${message}`}><pre>{message}</pre></li>
          ))}
        </ol>
        {messages.length === 0 && <p className="empty-state">Waiting for telemetry…</p>}
      </section>
    </main>
  );
}
