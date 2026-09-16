import { mcpManager } from "../../services/mcpManager.js";
/**
 * Browser Open Tool
 */
export const browserOpenTool = {
    name: "browser_open",
    description: "Navigate the browser to a specific URL. Use this to open a webpage.",
    schema: {
        type: "object",
        properties: {
            url: { type: "string", description: "The full URL to navigate to (e.g., 'https://example.com')" }
        },
        required: ["url"]
    },
    invoke: async ({ url }) => {
        console.log(`[BrowserOpenTool] Navigating to: ${url}`);
        try {
            const result = await mcpManager.callTool("agent-browser", "agent_browser_open", { url });
            return JSON.stringify(result);
        }
        catch (error) {
            console.error(`[BrowserOpenTool] MCP Error: ${error.message}`);
            return `Error navigating to URL: ${error.message}`;
        }
    }
};
/**
 * Browser Snapshot Tool
 */
export const browserSnapshotTool = {
    name: "browser_snapshot",
    description: "Get a text-based snapshot of the current webpage's interactive elements and their [ref] IDs.",
    schema: { type: "object", properties: {} },
    invoke: async () => {
        console.log(`[BrowserSnapshotTool] Capturing snapshot`);
        try {
            const result = await mcpManager.callTool("agent-browser", "agent_browser_snapshot", { compact: true });
            let jsonResult = JSON.stringify(result);
            if (jsonResult.length > 50000) {
                console.warn(`[BrowserSnapshotTool] Warning: Snapshot is huge (${jsonResult.length} chars). Trimming to fit LLM window.`);
                jsonResult = jsonResult.substring(0, 50000) + '\n\n... [TRUNCATED]';
            }
            return jsonResult;
        }
        catch (error) {
            console.error(`[BrowserSnapshotTool] MCP Error: ${error.message}`);
            return `Error capturing snapshot: ${error.message}`;
        }
    }
};
/**
 * Browser Click Tool
 */
export const browserClickTool = {
    name: "browser_click",
    description: "Click an interactive element on the webpage using its reference ID.",
    schema: {
        type: "object",
        properties: {
            ref: { type: "string", description: "The reference ID of the element to click (e.g., '@e1')" }
        },
        required: ["ref"]
    },
    invoke: async ({ ref }) => {
        console.log(`[BrowserClickTool] Clicking ref: ${ref}`);
        try {
            const result = await mcpManager.callTool("agent-browser", "agent_browser_click", { selector: ref });
            return JSON.stringify(result);
        }
        catch (error) {
            console.error(`[BrowserClickTool] MCP Error: ${error.message}`);
            return `Error clicking element: ${error.message}`;
        }
    }
};
/**
 * Browser Fill Tool
 */
export const browserFillTool = {
    name: "browser_fill",
    description: "Fill an input field on the webpage using its reference ID.",
    schema: {
        type: "object",
        properties: {
            ref: { type: "string", description: "The reference ID of the input element (e.g., '@e2')" },
            value: { type: "string", description: "The text to type into the input field" }
        },
        required: ["ref", "value"]
    },
    invoke: async ({ ref, value }) => {
        console.log(`[BrowserFillTool] Filling ref: ${ref} with value: ${value}`);
        try {
            const result = await mcpManager.callTool("agent-browser", "agent_browser_fill", { selector: ref, text: value });
            return JSON.stringify(result);
        }
        catch (error) {
            console.error(`[BrowserFillTool] MCP Error: ${error.message}`);
            return `Error filling element: ${error.message}`;
        }
    }
};
