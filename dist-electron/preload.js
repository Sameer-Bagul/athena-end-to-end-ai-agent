"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("athena", {
    send: (channel, data) => electron_1.ipcRenderer.send(channel, data),
    on: (channel, cb) => electron_1.ipcRenderer.on(channel, (_, data) => cb(data))
});
