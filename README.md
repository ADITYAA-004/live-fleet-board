# Live Fleet Board

Live Fleet Board is a React dispatch dashboard backed by a Node.js service over WebSocket. It shows 30 simulated buses and keeps the newest state for each bus when normal traffic or bursts arrive.

## Prerequisites

- Node.js 22.19 or newer (LTS)
- npm

If `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (for example, due to antivirus or network HTTPS inspection), use Node.js 22.19 or newer and set the system CA option in the current PowerShell session before installing:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm install
```

This setting applies only to the current PowerShell process.

## Run the project

Install dependencies:

```sh
npm install
```

Start the server workspace and client together with the single startup command:

```sh
npm start
```

Open <http://localhost:5173> in a browser. The server provides the WebSocket feed at `ws://localhost:8080/feed`.

## Burst controls

The first automatic burst begins about 45 seconds after the first browser client connects, then repeats every few minutes. During development, trigger one immediately from PowerShell with:

```powershell
Invoke-RestMethod -Method Post http://localhost:8080/burst
```

The Vite page is served on port 5173, while the Node server and `/burst` endpoint use port 8080. To start a burst as soon as the server starts, set this variable in the same PowerShell session before `npm start`:

```powershell
$env:BURST_ON_START = '1'
npm start
```

`POST /burst` is a development-only endpoint and returns JSON indicating whether a burst started.

## Checks

Run the test script:

```sh
npm test
```

Run the load-test / burst-check script:

```sh
npm run load-test
```

Both scripts are placeholders for now and print `not implemented yet`.

## Project structure

```text
live-fleet-board/
├── client/                 # Vite + React fleet dashboard
│   ├── index.html
│   └── src/
├── docs/                   # Project specification and session logs
├── server/                 # Node.js simulator, WebSocket feed, and configuration
├── AGENTS.md               # Project rules
├── CHANGES_LOG.md          # Step-by-step change history
├── package.json            # npm workspaces and root scripts
└── README.md
```
