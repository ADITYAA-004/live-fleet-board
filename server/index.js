import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { WebSocket, WebSocketServer } from "ws";
import { PORT } from "./config.js";
import { Simulator } from "./simulator.js";

export async function start(port = PORT) {
  console.log("server starting");

  const httpServer = createServer((_request, response) => {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  });
  const webSocketServer = new WebSocketServer({ server: httpServer, path: "/feed" });
  const simulator = new Simulator();
  const connectedClients = new Set();
  let sentInLastSecond = 0;
  let closing = false;
  let closePromise;

  webSocketServer.on("connection", (client) => {
    connectedClients.add(client);
    console.log(`client connected (clients: ${connectedClients.size})`);

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

  const unsubscribe = simulator.onUpdate((update) => {
    if (closing) return;
    const message = JSON.stringify(update);
    for (const client of webSocketServer.clients) {
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
  });

  const statsTimer = setInterval(() => {
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
    clearInterval(statsTimer);
    unsubscribe();
    simulator.stop();
    webSocketServer.close();
    throw error;
  }

  httpServer.on("error", (error) => {
    console.error(`HTTP server error: ${error.message}`);
  });
  simulator.start();

  const handle = {
    get port() {
      return httpServer.address()?.port ?? port;
    },
    close() {
      if (closePromise) return closePromise;

      closePromise = (async () => {
        closing = true;
        simulator.stop();
        unsubscribe();
        clearInterval(statsTimer);

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

        const forceCloseTimer = setTimeout(() => {
          for (const client of connectedClients) client.terminate();
        }, 2000);
        await Promise.all([webSocketsClosed, httpClosed]);
        clearTimeout(forceCloseTimer);
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
