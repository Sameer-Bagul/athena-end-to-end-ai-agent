
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import "dotenv/config";
import { chatWithLLM } from "../backend/llm";
import { speak } from "../backend/tts";

const isDev = process.env.NODE_ENV === "development";

// Disable sandbox on Linux
if (process.platform === "linux") {
  app.commandLine.appendSwitch("no-sandbox");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 900,
    backgroundColor: "#0b0b0b",
    icon: path.join(__dirname, isDev ? "../renderer/public/icon.png" : "../renderer/dist/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(
      path.join(__dirname, "../renderer/dist/index.html")
    );
  }
}

// IPC handlers for LLM and TTS
ipcMain.handle("llm:chat", async (_, messages) => {
  return await chatWithLLM(messages);
});

ipcMain.handle("tts:generate", async (_, { text, voiceStyle }) => {
  return await speak(text, voiceStyle);
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

app.whenReady().then(createWindow);
