import { spawn } from "child_process";
export class McpServerManager {
    servers = new Map();
    static instance;
    onStatus = null;
    static getInstance() {
        if (!McpServerManager.instance) {
            McpServerManager.instance = new McpServerManager();
        }
        return McpServerManager.instance;
    }
    async spawnServer(name, command, args, cwd) {
        if (this.servers.has(name))
            return;
        console.log(`🚀 [McpServerManager] Spawning sidecar: ${name}`);
        const proc = spawn(command, args, {
            stdio: ["pipe", "pipe", "pipe"],
            cwd,
            env: { ...process.env, ATHENA_SIDEKICK: "true" }
        });
        proc.stderr.on("data", (data) => {
            console.error(`[MCP:${name}] ${data.toString().trim()}`);
        });
        proc.on("close", (code) => {
            console.log(`🛑 [MCP:${name}] exited with code ${code}`);
            this.servers.delete(name);
            this.onStatus?.(name, 'stopped');
        });
        this.servers.set(name, proc);
        this.onStatus?.(name, 'started');
    }
    async callTool(serverName, toolName, args) {
        const proc = this.servers.get(serverName);
        if (!proc)
            throw new Error(`MCP Server ${serverName} not running`);
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            const request = JSON.stringify({
                jsonrpc: "2.0",
                method: "call_tool",
                params: { name: toolName, arguments: args },
                id
            }) + "\n";
            const onData = (data) => {
                try {
                    const lines = data.toString().split('\n');
                    for (const line of lines) {
                        if (!line.trim())
                            continue;
                        const response = JSON.parse(line);
                        if (response.id === id) {
                            proc.stdout.removeListener('data', onData);
                            if (response.error)
                                reject(new Error(response.error.message));
                            else
                                resolve(response.result);
                            return;
                        }
                    }
                }
                catch (e) { }
            };
            proc.stdout.on('data', onData);
            proc.stdin.write(request);
            // 15s timeout
            setTimeout(() => {
                proc.stdout.removeListener('data', onData);
                reject(new Error(`MCP Tool call ${toolName} timed out`));
            }, 15000);
        });
    }
    shutdown() {
        for (const [name, proc] of this.servers) {
            proc.kill();
        }
    }
}
export const mcpManager = McpServerManager.getInstance();
