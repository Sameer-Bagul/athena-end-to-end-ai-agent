"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const isDev = process.env.NODE_ENV === "development";
// Disable sandbox on Linux
if (process.platform === "linux") {
    electron_1.app.commandLine.appendSwitch("no-sandbox");
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1000,
        height: 900,
        backgroundColor: "#0b0b0b",
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            sandbox: false
        }
    });
    if (isDev) {
        win.loadURL("http://localhost:5173");
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path_1.default.join(__dirname, "../renderer/dist/index.html"));
    }
}
electron_1.app.whenReady().then(createWindow);
