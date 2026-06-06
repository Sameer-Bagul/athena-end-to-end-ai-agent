
import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { spawn } from "child_process";
import "dotenv/config";
import { chatWithLLM } from "../backend/llm.js";
import { speak } from "../backend/tts.js";
import { transcribe } from "../backend/stt.js";
import { ragService } from "../backend/rag.js";
import { downloadFile } from "../backend/downloader.js";
import { NON_OLLAMA_MODELS, getLocalModelDir, isModelInstalled, deleteModel } from "../backend/modelRegistry.js";
import { systemService } from "../backend/system.js";
import { dialog } from "electron";
import { mcpManager } from "../backend/agent/mcpManager.js";


// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

// Hack to try and unblock Google Speech API in Electron
process.env.GOOGLE_API_KEY = "ignore";

// Disable sandbox on Linux
if (process.platform === "linux") {
  app.commandLine.appendSwitch("no-sandbox");
}

let pythonServerProcess: any = null;

function startPythonServer() {
  const projectRoot = app.getAppPath();
  const pythonBin = path.join(projectRoot, "services", "stt-env", "bin", "python");
  const scriptPath = path.join(projectRoot, "services", "whisper-fast", "server.py");

  console.log("🚀 [Electron] Starting Python Server...");
  console.log("   Bin:", pythonBin);
  console.log("   Script:", scriptPath);

  if (!fs.existsSync(pythonBin)) {
    console.error("❌ [Electron] Python executable not found at:", pythonBin);
    return;
  }
  if (!fs.existsSync(scriptPath)) {
    console.error("❌ [Electron] Python script not found at:", scriptPath);
    return;
  }

  pythonServerProcess = spawn(pythonBin, [scriptPath], {
    stdio: "pipe",
    cwd: path.join(projectRoot, "services"),
    env: {
      ...process.env,
      ATHENA_USER_DATA: app.getPath('userData')
    }
  });

  pythonServerProcess.stdout.on("data", (data: any) => {
    console.log(`🐍 [Python] ${data.toString().trim()}`);
  });

  pythonServerProcess.stderr.on("data", (data: any) => {
    console.error(`🐍 [Python ERROR] ${data.toString().trim()}`);
  });

  pythonServerProcess.on("close", (code: any) => {
    console.log(`🛑 [Electron] Python server exited with code ${code}`);
  });

  pythonServerProcess.on("error", (err: any) => {
    console.error("❌ [Electron] Failed to start Python server:", err);
  });
}

let ttsServerProcess: any = null;

function startTTSServer() {
  const projectRoot = app.getAppPath();
  // TTS Service Path
  const ttsServicePath = path.join(projectRoot, "services", "TTS-supertonic");
  const ttsScript = path.join(ttsServicePath, "src", "server.js");

  console.log("🚀 [Electron] Starting TTS Server...");
  console.log("   Script:", ttsScript);

  if (!fs.existsSync(ttsScript)) {
    console.error("❌ [Electron] TTS script not found at:", ttsScript);
    return;
  }

  // We use the same 'node' binary that runs Electron? 
  // No, Electron's node might differ. Safer to assume system 'node' or try to find one.
  // For standard user install, 'node' in path is best bet.
  // OR we can rely on `process.execPath` if it wasn't packaged? 
  // Let's use simple 'node' for now, assuming dev env. 

  ttsServerProcess = spawn("node", [ttsScript], {
    stdio: "pipe",
    cwd: ttsServicePath, // Critical for relative imports/models in TTS
    env: {
      ...process.env,
      ATHENA_USER_DATA: app.getPath('userData')
    }
  });

  ttsServerProcess.stdout.on("data", (data: any) => {
    console.log(`🗣️ [TTS] ${data.toString().trim()}`);
  });

  ttsServerProcess.stderr.on("data", (data: any) => {
    console.error(`🗣️ [TTS ERROR] ${data.toString().trim()}`);
  });

  ttsServerProcess.on("close", (code: any) => {
    console.log(`🛑 [Electron] TTS server exited with code ${code}`);
  });

  ttsServerProcess.on("error", (err: any) => {
    console.error("❌ [Electron] Failed to start TTS server:", err);
  });
}


// Main Window Reference
let mainWindow: BrowserWindow | null = null;
let widgetWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    backgroundColor: "#0b0b0b",
    icon: path.join(__dirname, isDev ? "../../renderer/public/icon.png" : "../../renderer/dist/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../../renderer/dist/index.html")
    );
  }

  // Broaden permission handler
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'audioCapture', 'videoCapture', 'camera', 'microphone'];
    if (allowed.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Logging IPC for debugging renderer in terminal
  ipcMain.on("logger:log", (event, ...args) => {
    console.log("🖥️ [Renderer]", ...args);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // If main window closes, close widget too? Usually yes for this app.
    if (widgetWindow) {
      widgetWindow.close();
    }
  });

  // Auto-Open Widget on Minimize
  mainWindow.on('minimize', () => {
    createWidgetWindow();
  });

  // Auto-Close Widget on Restore (Optional, but good UX for "Companion Mode")
  mainWindow.on('restore', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.close();
    }
  });
}

function createWidgetWindow() {
  if (widgetWindow) {
    widgetWindow.focus();
    return;
  }

  widgetWindow = new BrowserWindow({
    width: 300,
    height: 300,
    minWidth: 200,
    minHeight: 200,
    backgroundColor: "#00000000",
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    icon: path.join(__dirname, isDev ? "../../renderer/public/icon.png" : "../../renderer/dist/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false
    }
  });

  // Load same URL but with hash
  if (isDev) {
    widgetWindow.loadURL("http://localhost:5173/#widget");
  } else {
    widgetWindow.loadFile(
      path.join(__dirname, "../../renderer/dist/index.html"),
      { hash: 'widget' }
    );
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  // Grant permissions
  widgetWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'audioCapture', 'videoCapture', 'camera', 'microphone'];
    if (allowed.includes(permission)) callback(true);
    else callback(false);
  });
}

ipcMain.handle("widget:open", () => {
  createWidgetWindow();
});

// Receiver (Widget) -> forwards to Main
ipcMain.handle("widget:resize", (event, { width, height }) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.setSize(width, height);
  }
});

ipcMain.handle("widget:close", () => {
  if (widgetWindow) {
    widgetWindow.close();
  }
});

// IPC Handler for Sync Broadcasting
// Receiver (Main) -> forwards to Widget
ipcMain.on("sync:broadcast", (event, data) => {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send("sync:receive", data);
  }
});

// Receiver (Widget) -> forwards to Main
ipcMain.on("widget:input", (event, data) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("widget:receive-input", data);
  }
});

// Window Controls (Legacy/Shared)
ipcMain.handle("window:minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
});
ipcMain.handle("window:maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win?.isMaximized()) win.unmaximize();
  else win?.maximize();
});
ipcMain.handle("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.close();
});

// IPC handlers for LLM and TTS
ipcMain.handle("llm:chat", async (_, messages) => {
  console.log(`[IPC] 💬 Request: llm:chat (${messages.length} messages)`);
  return await chatWithLLM(messages);
});

// RAG Handlers
ipcMain.handle("rag:upload-document", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { error: "No window found" };

  const result: any = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['pdf', 'txt', 'md'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) return { canceled: true };

  try {
    const uploadResult = await ragService.loadDocument(result.filePaths[0]);
    return uploadResult;
  } catch (error: any) {
    console.error("❌ [Electron] RAG Upload Error:", error);
    return { error: error.message };
  }
});

ipcMain.handle("rag:status", async () => {
  return ragService.getStatus();
});

ipcMain.handle("rag:clear", async () => {
  ragService.clearContext();
  return { success: true };
});

ipcMain.handle("rag:get-context", async (_, input) => {
  return await ragService.getRelevantContext(input);
});

// LangGraph Agent Handler
ipcMain.handle("agent:query", async (_, { query, systemPrompt, modelName }) => {
  console.log(`[IPC] 🤖 Request: agent:query`);
  try {
    const { runAgent } = await import("../backend/agent/graph.js");
    const response = await runAgent(query, systemPrompt, modelName);
    return { success: true, response };
  } catch (error: any) {
    console.error("❌ [Electron] Agent Error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.on("agent:query-stream", async (event, { queryId, query, systemPrompt, modelName }) => {
  console.log(`[IPC] 🤖 Request: agent:query-stream (${queryId})`);
  try {
    const { runAgent } = await import("../backend/agent/graph.js");
    const response = await runAgent(
      query,
      systemPrompt,
      modelName,
      (msg) => {
        event.sender.send(`agent:progress-${queryId}`, msg);
      },
      (token) => {
        event.sender.send(`agent:token-${queryId}`, token);
      }
    );
    event.sender.send(`agent:complete-${queryId}`, { success: true, response });
  } catch (error: any) {
    console.error("❌ [Electron] Agent Error:", error);
    event.sender.send(`agent:complete-${queryId}`, { success: false, error: error.message });
  }
});

ipcMain.handle("tts:generate", async (_, { text, voiceStyle }) => {
  console.log(`[IPC] 🗣️ Request: tts:generate (${text.substring(0, 30)}...)`);
  return await speak(text, voiceStyle);
});

ipcMain.handle("stt:transcribe", async (_, buffer: Buffer) => {
  console.log(`[IPC] 👂 Request: stt:transcribe (${buffer.byteLength} bytes)`);
  return await transcribe(buffer);
});

// Tool Proxy Handlers
ipcMain.handle("tool:news", async (_, url: string) => {
  try {
    console.log(`📰 [Electron] Proxying News Request: ${url}`);

    // Check if URL is valid newsapi.org URL to allow-list (security)
    if (!url.startsWith("https://newsapi.org/")) {
      throw new Error("Unauthorized URL");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error("❌ [Electron] News request failed:", error);
    return { error: error.message };
  }
});

// Chat History Persistence
const CHAT_FILE = path.join(app.getPath("userData"), "chat-history.json");
console.log("Chat History Path:", CHAT_FILE);

ipcMain.handle("chat:save-history", async (_, history) => {
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save chat history:", error);
    return false;
  }
});

ipcMain.handle("chat:load-history", async () => {
  try {
    if (fs.existsSync(CHAT_FILE)) {
      const data = fs.readFileSync(CHAT_FILE, "utf-8");
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return null;
  }
});

// --- Agent Tool Bridging (Backend -> Renderer) ---
ipcMain.on("agent:add-timer", (event, { duration, unit, label }) => {
  console.log(`⏰ [Main] Bridging agent:add-timer: ${duration} ${unit} (${label || 'No label'})`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("athena:add-timer-ipc", { duration, unit, label });
  }
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send("athena:add-timer-ipc", { duration, unit, label });
  }
});

ipcMain.on("agent:remove-timer", (event, { id }) => {
  console.log(`⏰ [Main] Bridging agent:remove-timer: ${id}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("athena:remove-timer-ipc", { id });
  }
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send("athena:remove-timer-ipc", { id });
  }
});

// --- MCP Bridging ---
ipcMain.handle("agent:call-mcp", async (_, { serverName, toolName, args }) => {
  console.log(`🔌 [Main] Routing MCP call to ${serverName}.${toolName}`);
  try {
    return await mcpManager.callTool(serverName, toolName, args);
  } catch (error: any) {
    console.error(`❌ [Main] MCP call ${serverName}.${toolName} failed:`, error);
    return { error: error.message };
  }
});

// --- System Control Handlers ---
ipcMain.handle("system:get-volume", async () => {
  return await systemService.getVolume();
});

ipcMain.handle("system:set-volume", async (_, percent: number) => {
  return await systemService.setVolume(percent);
});

ipcMain.handle("system:set-brightness", async (_, percent: number) => {
  return await systemService.setBrightness(percent);
});

ipcMain.handle("system:get-battery", async () => {
  return await systemService.getBatteryInfo();
});

ipcMain.handle("system:list-files", async (_, targetPath: string) => {
  return await systemService.listFiles(targetPath);
});

ipcMain.handle("system:read-file", async (_, targetPath: string) => {
  return await systemService.readFile(targetPath);
});

ipcMain.handle("system:file-stats", async (_, targetPath: string) => {
  return await systemService.getFileStats(targetPath);
});
ipcMain.handle("ollama:check-status", async () => {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    return { ok: res.ok };
  } catch (e) {
    return { ok: false };
  }
});

ipcMain.handle("ollama:list-models", async () => {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    if (!res.ok) throw new Error("Failed to fetch models");
    const data = await res.json();
    return data.models || [];
  } catch (e: any) {
    return { error: e.message };
  }
});

ipcMain.handle("ollama:delete-model", async (_, modelName) => {
  try {
    const res = await fetch("http://localhost:11434/api/delete", {
      method: "DELETE",
      body: JSON.stringify({ name: modelName })
    });
    return { ok: res.ok };
  } catch (e: any) {
    return { error: e.message };
  }
});

// We handle pull as an event-based stream since it takes time
ipcMain.on("ollama:pull-model", async (event, modelName) => {
  try {
    const response = await fetch("http://localhost:11434/api/pull", {
      method: "POST",
      body: JSON.stringify({ name: modelName, stream: true })
    });

    if (!response.ok || !response.body) {
      event.sender.send("ollama:pull-progress", { model: modelName, status: "error", error: "Connection failed" });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          event.sender.send("ollama:pull-progress", { model: modelName, ...json });
        } catch (e) {
          // Fragmented JSON
        }
      }
    }
  } catch (err: any) {
    event.sender.send("ollama:pull-progress", { model: modelName, status: "error", error: err.message });
  }
});

// --- General Model Management (Whisper/TTS) ---
ipcMain.handle("model:check-status", async (_, modelId) => {
  return { isInstalled: isModelInstalled(modelId) };
});

ipcMain.on("model:pull", async (event, modelId) => {
  const modelDef = NON_OLLAMA_MODELS[modelId];
  if (!modelDef) {
    event.sender.send("model:pull-progress", { model: modelId, status: "error", error: "Model not found in registry" });
    return;
  }

  const modelDir = getLocalModelDir(modelDef.category, modelId);

  try {
    for (const file of modelDef.files) {
      const destPath = path.join(modelDir, file.name);

      // Skip if already exists (basic check)
      if (fs.existsSync(destPath)) continue;

      event.sender.send("model:pull-progress", {
        model: modelId,
        status: "downloading",
        detail: `Downloading ${file.name}...`
      });

      await downloadFile(file.url, destPath, (progress) => {
        // We could send per-file progress, but let's keep it simple for now or aggregate
        event.sender.send("model:pull-progress", {
          model: modelId,
          status: "downloading",
          completed: progress.completed,
          total: progress.total
        });
      });
    }

    event.sender.send("model:pull-progress", { model: modelId, status: "success" });
  } catch (err: any) {
    console.error(`❌ [Electron] Failed to download model ${modelId}:`, err);
    event.sender.send("model:pull-progress", { model: modelId, status: "error", error: err.message });
  }
});

ipcMain.handle("model:delete", async (_, modelId) => {
  try {
    return { success: deleteModel(modelId) };
  } catch (err: any) {
    return { error: err.message };
  }
});

// Bypass microphone permission prompts and enable speech API
app.commandLine.appendSwitch("use-fake-ui-for-media-stream");
app.commandLine.appendSwitch("enable-speech-dispatcher");

app.whenReady().then(() => {
  startPythonServer();
  startTTSServer();
  createWindow();

  // Global Shortcut for Wake / PTT
  globalShortcut.register('Alt+Space', () => {
    console.log("⚡ [Electron] Alt+Space pressed");
    // Broadcast to all windows
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('shortcut:pressed');
    if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.webContents.send('shortcut:pressed');

    // If widget is active, we might want to ensure it has focus to capture 'keyup'?
    // But forcing focus might be annoying if user is typing elsewhere. 
    // For now, let's just send the event.
  });

  // MCP Sidecar Status listener
  mcpManager.onStatus = (name, status) => {
    console.log(`🔌 [Main] Sidecar ${name} is ${status}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("agent:mcp-status", { name, status });
    }
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.webContents.send("agent:mcp-status", { name, status });
    }
  };

  // Spawn PoC sidecars
  const sidecarPath = path.join(app.getAppPath(), "backend/agent/sidecars/time");
  mcpManager.spawnServer("time", "node", [path.join(sidecarPath, "index.js")], sidecarPath);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on("before-quit", async () => {
  console.log("🛑 [Electron] Initiating graceful shutdown...");

  // Graceful shutdown helper
  const shutdownService = (proc: any, name: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!proc) return resolve();

      console.log(`[Electron] Shutting down ${name}...`);
      proc.on('exit', () => {
        console.log(`[Electron] ${name} exited`);
        resolve();
      });

      proc.kill('SIGTERM'); // Graceful

      setTimeout(() => {
        if (!proc.killed) {
          console.warn(`[Electron] Force killing ${name}`);
          proc.kill('SIGKILL');
          resolve();
        }
      }, 5000); // Force after 5s
    });
  };

  await Promise.all([
    shutdownService(pythonServerProcess, 'Python STT'),
    shutdownService(ttsServerProcess, 'TTS')
  ]);

  mcpManager.shutdown();

  console.log("✅ [Electron] Graceful shutdown complete");
});
