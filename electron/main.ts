import { app, globalShortcut, ipcMain } from "electron";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import "dotenv/config";

import { getAvailablePort, startPythonServer, startTTSServer, shutdownAllServices } from "./services/serviceManager.js";
import { createWindow, getMainWindow, getWidgetWindow } from "./windows/windowManager.js";
import { registerAgentIpcHandlers } from "./ipc/agentIpc.js";
import { registerSystemIpcHandlers } from "./ipc/systemIpc.js";
import { mcpManager } from "../backend/services/mcpManager.js";

// Disable sandbox on Linux for Electron stability
if (process.platform === "linux") {
  app.commandLine.appendSwitch("no-sandbox");
}

// Bypass microphone permission prompts & enable speech API
app.commandLine.appendSwitch("use-fake-ui-for-media-stream");
app.commandLine.appendSwitch("enable-speech-dispatcher");

// Logger IPC for debugging renderer messages in terminal
ipcMain.on("logger:log", (_, ...args) => {
  console.log("\x1b[35m[Renderer]\x1b[0m", ...args);
});

app.whenReady().then(async () => {
  const sttPort = await getAvailablePort(9001);
  const ttsPort = await getAvailablePort(3001);
  const wsPort = await getAvailablePort(3000);

  // 1. Setup WebSocket Bridge for Agent Browser Stream
  const wss = new WebSocketServer({ port: wsPort });
  const wsClients = new Set<WebSocket>();

  wss.on('error', (err) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m WebSocket server error on port ${wsPort}:`, err);
  });

  wss.on('connection', (ws) => {
    console.log(`\n\x1b[36m[Main]\x1b[0m Stream Bridge WebSocket client connected on port ${wsPort}`);
    wsClients.add(ws);
    ws.on('close', () => wsClients.delete(ws));
  });

  // Listen to MCP Notifications
  mcpManager.onNotification = (name, method, params) => {
    if (name === "agent-browser" && params?.image) {
      const message = JSON.stringify({ type: 'snapshot', image: params.image });
      for (const client of wsClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      }
    }
  };

  process.env.STT_URL = `http://127.0.0.1:${sttPort}`;
  process.env.TTS_URL = `http://localhost:${ttsPort}`;

  // 2. Register IPC Handlers
  registerAgentIpcHandlers();
  registerSystemIpcHandlers();

  // 3. Start Child Microservices
  startPythonServer(sttPort);
  startTTSServer(ttsPort);

  // 4. Create Main Window
  createWindow();

  // 5. Global Shortcut for Wake / Push-to-Talk
  globalShortcut.register('Alt+Space', () => {
    console.log("\n\x1b[36m[Main]\x1b[0m Alt+Space pressed");
    const main = getMainWindow();
    const widget = getWidgetWindow();
    if (main && !main.isDestroyed()) main.webContents.send('shortcut:pressed');
    if (widget && !widget.isDestroyed()) widget.webContents.send('shortcut:pressed');
  });

  // 6. MCP Sidecar Status Listener & Spawners
  mcpManager.onStatus = (name, status) => {
    console.log(`\n\x1b[36m[Main]\x1b[0m Sidecar ${name} is ${status}`);
    const main = getMainWindow();
    const widget = getWidgetWindow();
    if (main && !main.isDestroyed()) main.webContents.send("agent:mcp-status", { name, status });
    if (widget && !widget.isDestroyed()) widget.webContents.send("agent:mcp-status", { name, status });
  };

  // Spawn PoC sidecars
  const sidecarPath = path.join(app.getAppPath(), "backend/agent/sidecars/time");
  mcpManager.spawnServer("time", "node", [path.join(sidecarPath, "index.js")], sidecarPath);

  // Spawn Agent Browser MCP with persistent authentication vault
  mcpManager.spawnServer(
    "agent-browser",
    "npx",
    ["-y", "agent-browser@latest", "mcp", "--tools", "all", "--session", "athena_vault"],
    app.getAppPath()
  );
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on("before-quit", async () => {
  await shutdownAllServices();
});
