# Guide: Converting a Web App to an Electron App

This guide provides a comprehensive, advanced-level walkthrough for converting any web application (such as the one in the `renderer` folder) into an Electron desktop application. It covers development and production setup, packaging, optimization, and best practices for maintainability and performance.

---

## 1. Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- Familiarity with your web app's build system (Vite, Webpack, etc.)
- Basic knowledge of Electron

---

## 2. Project Structure

Typical structure after conversion:

```
my-app/
  electron/           # Electron main & preload scripts
    main.ts           # Main process entry
    preload.ts        # Preload script for renderer
  renderer/           # Your web app (React, Vue, etc.)
    src/
    public/
    ...
  package.json        # Root package.json
  tsconfig.json       # TypeScript config (if using TS)
  ...
```

---

## 3. Setting Up Electron

### a. Install Electron

```bash
npm install --save-dev electron
```

### b. Create Electron Entry Points

- **main.ts**: Main process (window creation, app lifecycle)
- **preload.ts**: Secure bridge between main and renderer

Example `main.ts`:
```ts
import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
}

app.whenReady().then(createWindow);
```

### c. Preload Script (Security)

Example `preload.ts`:
```ts
import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
```

---

## 4. Development Workflow

### a. Live Reload (Hot Reload)

- Use [electron-reload](https://www.npmjs.com/package/electron-reload) or [electronmon](https://www.npmjs.com/package/electronmon) for main process reloads.
- For renderer, run your web app dev server (e.g., Vite) and point Electron to its URL:

```ts
win.loadURL('http://localhost:5173');
```

### b. Scripts

Add to `package.json`:
```json
"scripts": {
  "dev:web": "cd renderer && npm run dev",
  "dev:electron": "tsc -p electron && electron .",
  "dev": "concurrently \"npm run dev:web\" \"npm run dev:electron\""
}
```

---

## 5. Production Build & Packaging

### a. Build Renderer

```bash
cd renderer
npm run build
```

### b. Build Electron

- Compile TypeScript (if used):
  ```bash
  tsc -p electron
  ```
- Use [electron-builder](https://www.electron.build/) or [electron-forge](https://www.electronforge.io/) for packaging:
  ```bash
  npm install --save-dev electron-builder
  npx electron-builder
  ```

### c. Package.json for Electron

```json
"main": "dist-electron/main.js",
"build": {
  "appId": "com.example.myapp",
  "files": [
    "dist-electron/**",
    "renderer/dist/**"
  ],
  "directories": {
    "buildResources": "assets"
  }
}
```

---

## 6. Advanced Features & Optimization

### a. Security Best Practices
- Use `contextIsolation: true` and `nodeIntegration: false`.
- Only expose safe APIs via preload.
- Validate all IPC messages.

### b. Performance
- Lazy-load heavy modules.
- Minimize renderer bundle size (tree-shaking, code splitting).
- Use hardware acceleration only if needed.

### c. Native Integrations
- Use Electron APIs for file system, notifications, etc. via IPC.
- Avoid direct Node.js access in renderer.

### d. Auto Updates
- Integrate [electron-updater](https://www.electron.build/auto-update) for seamless updates.

### e. Cross-Platform Packaging
- Test builds on Windows, macOS, and Linux.
- Use platform-specific icons and resources.

### f. Source Maps & Debugging
- Generate source maps for both renderer and main process.
- Use [devtron](https://github.com/electron/devtron) for Electron debugging.

---

## 7. Common Pitfalls

- **Path Issues**: Use `path.join` and `__dirname` for file paths.
- **Environment Variables**: Use `process.env.NODE_ENV` to distinguish dev/production.
- **Large Assets**: Bundle only necessary files; use CDN for large assets if possible.
- **Native Modules**: Rebuild native modules for Electron using `electron-rebuild`.

---

## 8. Example: Converting a Vite React App

1. Move your web app to `renderer/`.
2. Create `electron/main.ts` and `electron/preload.ts`.
3. Configure build scripts and Electron entry in `package.json`.
4. Use Vite for dev server, Electron for desktop shell.
5. Build renderer, then package Electron for production.

---

## 9. References & Further Reading

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-builder](https://www.electron.build/)
- [electron-forge](https://www.electronforge.io/)
- [Vite + Electron Template](https://github.com/cawa-93/vite-electron-builder)

---

## 10. Template Repositories

- [vite-electron-builder](https://github.com/cawa-93/vite-electron-builder)
- [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

---

## 11. Checklist for Production

- [ ] Security hardening
- [ ] Bundle optimization
- [ ] Cross-platform testing
- [ ] Auto-update integration
- [ ] Native module rebuilds
- [ ] Proper error handling

---

## 12. Final Notes

This guide is designed to be reusable for converting any modern web app to an Electron desktop application. Adapt paths, scripts, and configurations as needed for your specific stack and requirements.

---

**For questions or advanced scenarios, consult the official Electron documentation and community resources.**
