import { app, BrowserWindow } from "electron";
import path from "path";
import "dotenv/config";

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

app.whenReady().then(createWindow);
