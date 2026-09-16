import { BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;
let widgetWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function getWidgetWindow(): BrowserWindow | null {
  return widgetWindow;
}

export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    backgroundColor: "#0b0b0b",
    icon: path.join(__dirname, isDev ? "../../../renderer/public/icon.png" : "../../../renderer/dist/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      sandbox: false
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../../../renderer/dist/index.html")
    );
  }

  // Broaden permission handler for audio/video media
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'audioCapture', 'videoCapture', 'camera', 'microphone'];
    if (allowed.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.close();
    }
  });

  // Auto-Open Widget on Minimize
  mainWindow.on('minimize', () => {
    createWidgetWindow();
  });

  // Auto-Close Widget on Restore
  mainWindow.on('restore', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.close();
    }
  });

  return mainWindow;
}

export function createWidgetWindow(): BrowserWindow {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.focus();
    return widgetWindow;
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
    icon: path.join(__dirname, isDev ? "../../../renderer/public/icon.png" : "../../../renderer/dist/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      sandbox: false
    }
  });

  if (isDev) {
    widgetWindow.loadURL("http://localhost:5173/#widget");
  } else {
    widgetWindow.loadFile(
      path.join(__dirname, "../../../renderer/dist/index.html"),
      { hash: 'widget' }
    );
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  widgetWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'audioCapture', 'videoCapture', 'camera', 'microphone'];
    if (allowed.includes(permission)) callback(true);
    else callback(false);
  });

  return widgetWindow;
}
