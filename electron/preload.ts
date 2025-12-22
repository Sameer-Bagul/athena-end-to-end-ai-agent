import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("athena", {
  send: (channel: string, data?: any) =>
    ipcRenderer.send(channel, data),
  on: (channel: string, cb: (data: any) => void) =>
    ipcRenderer.on(channel, (_, data) => cb(data))
});
