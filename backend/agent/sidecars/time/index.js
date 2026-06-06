/**
 * Simple PoC MCP Time Server
 * Communication via STDIO (JSON-RPC 2.0)
 */

process.stdin.on("data", (data) => {
    try {
        const lines = data.toString().split("\n");
        for (const line of lines) {
            if (!line.trim()) continue;
            const request = JSON.parse(line);

            if (request.method === "call_tool") {
                const { name, arguments: args } = request.params;
                let result = "";

                if (name === "get_time") {
                    const timezone = args.timezone || "local";
                    const now = new Date();
                    const timeStr = now.toLocaleString("en-US", {
                        timeZone: timezone === "local" ? undefined : timezone,
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    result = `The current time in ${timezone} is ${timeStr}.`;
                }

                const response = JSON.stringify({
                    jsonrpc: "2.0",
                    result,
                    id: request.id
                }) + "\n";

                process.stdout.write(response);
            }
        }
    } catch (e) {
        // Silently ignore malformed JSON
    }
});

// Signal readiness
console.error("Time MCP Sidecar Ready");
