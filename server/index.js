import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { WebSocket, WebSocketServer } from "ws";
import {
  BURST_INTERVAL_MS,
  BURST_ON_START,
  BUS_COUNT,
  FIRST_BURST_DELAY_MS,
  PORT,
} from "./config.js";
import { Simulator } from "./simulator.js";

const MIN_REORDER_DELAY_MS = 20;
const MAX_REORDER_DELAY_MS = 300;
const REORDER_PROBABILITY = 0.12;
const PENDING_TIMER_LIMIT = BUS_COUNT * 8;
const GUARANTEED_STALE_TIMER_RESERVE = 1;

export async function start(port = PORT, options = {}) {
  console.log("server starting");

  const devOnly = options.devOnly ?? process.env.NODE_ENV !== "production";
  const simulator = new Simulator(options.simulator ?? options);
  const firstBurstDelayMs = options.firstBurstDelayMs ?? FIRST_BURST_DELAY_MS;
  const burstIntervalMs = options.burstIntervalMs ?? BURST_INTERVAL_MS;
  const burstOnStart = options.burstOnStart ?? BURST_ON_START;
  const reorderProbability = options.reorderProbability ?? REORDER_PROBABILITY;
  const connectedClients = new Set();
  const deliveryTimers = new Map();
  const pendingDelayedByBus = new Map();
  const bypassDelayForNextByBus = new Set();
  const heldInjectionOpens = new Map();
  let sentInLastSecond = 0;
  let closing = false;
  let closePromise;
  let autoBurstTimer = null;
  let autoBurstArmed = false;
  let statsTimer = null;
  let forceCloseTimer = null;

  function sendUpdate(update) {
    if (closing) return;
    const message = JSON.stringify(update);
    for (const client of connectedClients) {
      if (client.readyState !== WebSocket.OPEN) continue;
      try {
        client.send(message, (error) => {
          if (error) {
            console.error(`WebSocket send error: ${error.message}`);
            client.terminate();
            return;
          }
          sentInLastSecond += 1;
        });
      } catch (error) {
        console.error(`WebSocket send error: ${error.message}`);
        client.terminate();
      }
    }
  }

  function scheduleDelayed(update, delayMs, guaranteed = false) {
    const timerLimit = PENDING_TIMER_LIMIT + (guaranteed ? GUARANTEED_STALE_TIMER_RESERVE : 0);
    if (deliveryTimers.size >= timerLimit) {
      sendUpdate(update);
      return false;
    }

    const timer = setTimeout(() => {
      deliveryTimers.delete(timer);
      const pendingForBus = (pendingDelayedByBus.get(update.busId) ?? 1) - 1;
      if (pendingForBus === 0) pendingDelayedByBus.delete(update.busId);
      else pendingDelayedByBus.set(update.busId, pendingForBus);
      sendUpdate(update);
    }, delayMs);
    deliveryTimers.set(timer, update.busId);
    pendingDelayedByBus.set(update.busId, (pendingDelayedByBus.get(update.busId) ?? 0) + 1);
    return true;
  }

  function clearDeliveryTimers() {
    for (const timer of deliveryTimers.keys()) clearTimeout(timer);
    deliveryTimers.clear();
    pendingDelayedByBus.clear();
    bypassDelayForNextByBus.clear();
    heldInjectionOpens.clear();
  }

  function deliver(update, metadata = {}) {
    if (closing) return;

    if (metadata.injectionRole === "open") {
      heldInjectionOpens.set(metadata.injectionId, update);
      return;
    }
    if (metadata.injectionRole === "closed") {
      // Send the newer CLOSED state first, then release the held OPEN as a guaranteed stale frame.
      sendUpdate(update);
      const olderOpen = heldInjectionOpens.get(metadata.injectionId);
      heldInjectionOpens.delete(metadata.injectionId);
      if (olderOpen) {
        console.log(
          `[burst] injected out-of-order: ${update.busId} seq ${update.seq} CLOSED delivered before seq ${olderOpen.seq} OPEN`,
        );
        scheduleDelayed(olderOpen, 100, true);
      }
      return;
    }

    if (!metadata.burst) {
      sendUpdate(update);
      return;
    }

    // Ensure each randomly delayed frame is overtaken by a later-produced frame for that same bus.
    if (bypassDelayForNextByBus.has(update.busId)) {
      bypassDelayForNextByBus.delete(update.busId);
      sendUpdate(update);
      return;
    }

    if (deliveryTimers.size < PENDING_TIMER_LIMIT && Math.random() < reorderProbability) {
      const delay = MIN_REORDER_DELAY_MS
        + Math.floor(Math.random() * (MAX_REORDER_DELAY_MS - MIN_REORDER_DELAY_MS + 1));
      if (scheduleDelayed(update, delay)) bypassDelayForNextByBus.add(update.busId);
      return;
    }
    sendUpdate(update);
  }

  const httpServer = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (request.method === "POST" && pathname === "/burst" && devOnly) {
      const started = simulator.triggerBurst();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: true, started }));
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });
  const webSocketServer = new WebSocketServer({ server: httpServer, path: "/feed" });

  webSocketServer.on("connection", (client) => {
    connectedClients.add(client);
    console.log(`client connected (clients: ${connectedClients.size})`);
    if (!autoBurstArmed) {
      autoBurstArmed = true;
      console.log(`[burst] first automatic burst scheduled in ${firstBurstDelayMs}ms after first client connection`);
      autoBurstTimer = setTimeout(function runAutomaticBurst() {
        autoBurstTimer = null;
        if (closing) return;
        simulator.triggerBurst();
        autoBurstTimer = setTimeout(runAutomaticBurst, burstIntervalMs);
      }, firstBurstDelayMs);
    }

    client.on("error", (error) => {
      console.error(`client WebSocket error: ${error.message}`);
    });
    client.on("close", () => {
      connectedClients.delete(client);
      console.log(`client disconnected (clients: ${connectedClients.size})`);
    });
  });

  webSocketServer.on("error", (error) => {
    console.error(`WebSocket server error: ${error.message}`);
  });

  const unsubscribeUpdate = simulator.onUpdate((update, metadata) => deliver(update, metadata));
  const unsubscribeBurst = simulator.onBurst((event) => {
    if (event.type === "start") {
      console.log(
        `[burst] started #${event.burstNumber}: ${event.durationMs}ms at `
        + `${simulator.normalHz * simulator.burstMultiplier} updates/sec/bus target`,
      );
    } else {
      const duration = event.endedAt - event.startedAt;
      console.log(`[burst] ended #${event.burstNumber} after ${duration}ms${event.interrupted ? " (interrupted)" : ""}`);
    }
  });

  statsTimer = setInterval(() => {
    console.log(`messages sent in the last second: ${sentInLastSecond}`);
    sentInLastSecond = 0;
  }, 1000);

  try {
    await new Promise((resolveListen, rejectListen) => {
      const onListenError = (error) => rejectListen(error);
      httpServer.once("error", onListenError);
      httpServer.listen(port, () => {
        httpServer.off("error", onListenError);
        resolveListen();
      });
    });
  } catch (error) {
    if (statsTimer !== null) clearInterval(statsTimer);
    statsTimer = null;
    unsubscribeUpdate();
    unsubscribeBurst();
    simulator.stop();
    webSocketServer.close();
    throw error;
  }

  httpServer.on("error", (error) => {
    console.error(`HTTP server error: ${error.message}`);
  });
  simulator.start();
  if (burstOnStart) simulator.triggerBurst();

  const handle = {
    get port() {
      return httpServer.address()?.port ?? port;
    },
    get simulator() {
      return simulator;
    },
    get activeTimerCount() {
      return simulator.activeTimerCount
        + deliveryTimers.size
        + (autoBurstTimer === null ? 0 : 1)
        + (statsTimer === null ? 0 : 1)
        + (forceCloseTimer === null ? 0 : 1);
    },
    close() {
      if (closePromise) return closePromise;

      closePromise = (async () => {
        closing = true;
        if (autoBurstTimer !== null) clearTimeout(autoBurstTimer);
        autoBurstTimer = null;
        if (statsTimer !== null) clearInterval(statsTimer);
        statsTimer = null;
        clearDeliveryTimers();
        simulator.stop();
        unsubscribeUpdate();
        unsubscribeBurst();

        const webSocketsClosed = new Promise((resolveClose) => {
          webSocketServer.close(resolveClose);
        });
        const httpClosed = new Promise((resolveClose, rejectClose) => {
          if (!httpServer.listening) {
            resolveClose();
            return;
          }
          httpServer.close((error) => {
            if (error) rejectClose(error);
            else resolveClose();
          });
        });

        for (const client of connectedClients) {
          if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
            client.close(1001, "server shutting down");
          }
        }

        forceCloseTimer = setTimeout(() => {
          for (const client of connectedClients) client.terminate();
        }, 2000);
        await Promise.all([webSocketsClosed, httpClosed]);
        clearTimeout(forceCloseTimer);
        forceCloseTimer = null;
      })();
      return closePromise;
    },
  };

  return handle;
}

const isMainModule = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMainModule) {
  start().then((serverHandle) => {
    console.log(`server listening on port ${serverHandle.port}`);
    let shuttingDown = false;
    const shutdown = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received; shutting down`);
      serverHandle.close().then(() => {
        console.log("server stopped");
      }).catch((error) => {
        console.error(`shutdown error: ${error.message}`);
        process.exitCode = 1;
      });
    };
    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  }).catch((error) => {
    console.error(`server startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}
