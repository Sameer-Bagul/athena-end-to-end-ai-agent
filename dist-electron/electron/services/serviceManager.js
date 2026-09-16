import { app } from "electron";
import path from "path";
import fs from "fs";
import net from "net";
import { spawn } from "child_process";
export async function getAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                resolve(getAvailablePort(startPort + 1));
            }
            else {
                reject(e);
            }
        });
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => {
                resolve(port);
            });
        });
    });
}
let pythonServerProcess = null;
let ttsServerProcess = null;
export function startPythonServer(port) {
    const projectRoot = app.getAppPath();
    const pythonBin = path.join(projectRoot, "services", "stt-env", "bin", "python");
    const scriptPath = path.join(projectRoot, "services", "whisper-fast", "server.py");
    console.log(`\n\x1b[36m[Main]\x1b[0m Starting Python Server on port ${port}...`);
    console.log("   Bin:", pythonBin);
    console.log("   Script:", scriptPath);
    if (!fs.existsSync(pythonBin)) {
        console.error("\n\x1b[31m[ERROR]\x1b[0m Python executable not found at:", pythonBin);
        return;
    }
    if (!fs.existsSync(scriptPath)) {
        console.error("\n\x1b[31m[ERROR]\x1b[0m Python script not found at:", scriptPath);
        return;
    }
    pythonServerProcess = spawn(pythonBin, [scriptPath], {
        stdio: "pipe",
        cwd: path.join(projectRoot, "services"),
        env: {
            ...process.env,
            PORT: port.toString(),
            ATHENA_USER_DATA: app.getPath('userData')
        }
    });
    pythonServerProcess.stdout?.on("data", (data) => {
        console.log(`\x1b[32m[PythonSTT]\x1b[0m ${data.toString().trim()}`);
    });
    pythonServerProcess.stderr?.on("data", (data) => {
        const text = data.toString().trim();
        if (text.includes("INFO:")) {
            console.log(`\x1b[32m[PythonSTT]\x1b[0m ${text}`);
        }
        else {
            console.error(`\x1b[31m[ERROR]\x1b[0m \x1b[32m[PythonSTT]\x1b[0m ${text}`);
        }
    });
    pythonServerProcess.on("close", (code) => {
        console.log(`\n\x1b[36m[Main]\x1b[0m Python server exited with code ${code}`);
    });
    pythonServerProcess.on("error", (err) => {
        console.error("\n\x1b[31m[ERROR]\x1b[0m Failed to start Python server:", err);
    });
}
export function startTTSServer(port) {
    const projectRoot = app.getAppPath();
    const ttsServicePath = path.join(projectRoot, "services", "TTS-supertonic");
    const ttsScript = path.join(ttsServicePath, "src", "server.js");
    console.log(`\n\x1b[36m[Main]\x1b[0m Starting TTS Server on port ${port}...`);
    console.log("   Script:", ttsScript);
    if (!fs.existsSync(ttsScript)) {
        console.error("\n\x1b[31m[ERROR]\x1b[0m TTS script not found at:", ttsScript);
        return;
    }
    ttsServerProcess = spawn("node", [ttsScript], {
        stdio: "pipe",
        cwd: ttsServicePath,
        env: {
            ...process.env,
            PORT: port.toString(),
            ATHENA_USER_DATA: app.getPath('userData')
        },
        shell: false
    });
    ttsServerProcess.stdout?.on("data", (data) => {
        console.log(`\x1b[34m[NodeTTS]\x1b[0m ${data.toString().trim()}`);
    });
    ttsServerProcess.stderr?.on("data", (data) => {
        console.error(`\x1b[31m[ERROR]\x1b[0m \x1b[34m[NodeTTS]\x1b[0m ${data.toString().trim()}`);
    });
    ttsServerProcess.on("close", (code) => {
        console.log(`\n\x1b[36m[Main]\x1b[0m TTS server exited with code ${code}`);
    });
    ttsServerProcess.on("error", (err) => {
        console.error("\n\x1b[31m[ERROR]\x1b[0m Failed to start TTS server:", err);
    });
}
export async function shutdownAllServices() {
    console.log("\n\x1b[36m[Main]\x1b[0m Initiating graceful shutdown...");
    const shutdownService = (proc, name) => {
        return new Promise((resolve) => {
            if (!proc)
                return resolve();
            console.log(`[Electron] Shutting down ${name}...`);
            proc.on('exit', () => {
                console.log(`[Electron] ${name} exited`);
                resolve();
            });
            proc.kill('SIGTERM');
            setTimeout(() => {
                if (!proc.killed) {
                    console.log(`[Electron] Force killing ${name}...`);
                    proc.kill('SIGKILL');
                }
                resolve();
            }, 2000);
        });
    };
    await Promise.all([
        shutdownService(pythonServerProcess, 'Python STT Server'),
        shutdownService(ttsServerProcess, 'Node TTS Server')
    ]);
}
