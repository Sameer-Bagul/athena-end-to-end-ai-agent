import { spawn } from "child_process";

export class McpServerManager {
    private servers: Map<string, any> = new Map();
    private static instance: McpServerManager;
    public onStatus: ((name: string, status: 'started' | 'stopped') => void) | null = null;

    public onNotification: ((serverName: string, method: string, params: any) => void) | null = null;
    private pendingRequests: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }> = new Map();

    public static getInstance(): McpServerManager {
        if (!McpServerManager.instance) {
            McpServerManager.instance = new McpServerManager();
        }
        return McpServerManager.instance;
    }

    async spawnServer(name: string, command: string, args: string[], cwd: string) {
        if (this.servers.has(name)) return;

        console.log(`\n\x1b[36m[MCP]\x1b[0m Spawning sidecar: \x1b[33m${name}\x1b[0m`);
        const proc = spawn(command, args, {
            stdio: ["pipe", "pipe", "pipe"],
            cwd,
            env: { ...process.env, ATHENA_SIDEKICK: "true" },
            shell: true
        });

        proc.on("error", (err) => {
            console.error(`\x1b[31m[ERROR]\x1b[0m Failed to spawn sidecar ${name}:`, err);
        });

        proc.stderr.on("data", (data) => {
            console.error(`[MCP:${name}] ${data.toString().trim()}`);
        });

        // Global stdout listener for responses and notifications
        let buffer = "";
        proc.stdout.on("data", (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || ""; // Keep the incomplete line in the buffer
            
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const message = JSON.parse(line);
                    if (message.id && this.pendingRequests.has(message.id.toString())) {
                        const { resolve, reject } = this.pendingRequests.get(message.id.toString())!;
                        this.pendingRequests.delete(message.id.toString());
                        if (message.error) reject(new Error(message.error.message));
                        else resolve(message.result);
                    } else if (message.method) {
                        // This is a notification
                        this.onNotification?.(name, message.method, message.params);
                    }
                } catch (e) {
                    // Ignore parsing errors for partial/malformed JSON
                }
            }
        });

        proc.on("close", (code) => {
            console.log(`\n\x1b[31m[MCP]\x1b[0m Sidecar \x1b[33m${name}\x1b[0m exited with code ${code}`);
            this.servers.delete(name);
            this.onStatus?.(name, 'stopped');
        });

        this.servers.set(name, proc);
        this.onStatus?.(name, 'started');
    }

    async callTool(serverName: string, toolName: string, args: any): Promise<any> {
        const proc = this.servers.get(serverName);
        if (!proc) throw new Error(`MCP Server ${serverName} not running`);

        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            const request = JSON.stringify({
                jsonrpc: "2.0",
                method: "tools/call",
                params: { name: toolName, arguments: args },
                id
            }) + "\n";

            this.pendingRequests.set(id, { resolve, reject });
            proc.stdin.write(request);

            // 15s timeout
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`MCP Tool call ${toolName} timed out`));
                }
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
