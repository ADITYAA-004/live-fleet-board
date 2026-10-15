# Live Fleet Board

Live Fleet Board is a React dispatch dashboard backed by a Node.js service. It will monitor 30 simulated buses, with a focus on keeping displayed data fresh when updates arrive in bursts. This first step creates the project skeleton and a placeholder page; telemetry and dashboard behavior come later.

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

Open <http://localhost:5173> in a browser. The client currently displays a placeholder page, and the server currently logs `server starting`.

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
├── client/                 # Vite + React placeholder page
│   ├── index.html
│   └── src/
├── docs/                   # Project specification and session logs
├── server/                 # Node.js workspace and configuration
├── AGENTS.md               # Project rules
├── CHANGES_LOG.md          # Step-by-step change history
├── package.json            # npm workspaces and root scripts
└── README.md
```
