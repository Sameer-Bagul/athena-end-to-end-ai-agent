import { ipcMain } from "electron";
import { mcpManager } from "../services/mcpManager.js";
/**
 * Weather Tool - Get current weather for a city
 */
export const weatherTool = {
    name: "weather",
    description: "Get current weather for a specific city. Use this when user asks about weather, temperature, or climate conditions.",
    schema: {
        type: "object",
        properties: {
            city: { type: "string", description: "The name of the city to get weather for (e.g., 'London', 'Mumbai', 'New York')" }
        },
        required: ["city"]
    },
    invoke: async ({ city }) => {
        console.log(`[WeatherTool] Fetching weather for ${city}`);
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            return "Weather tool is not configured. Please add an API Key in Settings.";
        }
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
            if (!response.ok) {
                if (response.status === 404)
                    return `Could not find weather data for ${city}.`;
                if (response.status === 401)
                    return `Weather API Error: Invalid API Key.`;
                return `Weather API error: ${response.statusText}`;
            }
            const data = await response.json();
            const weather = data.weather[0];
            const main = data.main;
            const timestamp = new Date().toLocaleTimeString();
            return `Current weather in ${data.name}: ${weather.main} (${weather.description}). Temperature: ${main.temp}°C. Humidity: ${main.humidity}%. [Source: OpenWeatherMap | ${timestamp}]`;
        }
        catch (error) {
            return `Failed to fetch weather: ${error}`;
        }
    }
};
/**
 * Clock Tool - Get current date and time (Bridged to MCP)
 */
export const clockTool = {
    name: "clock",
    description: "Get the current date and time or check a specific timezone. Use this when user asks about time, date, or 'what time is it'.",
    schema: {
        type: "object",
        properties: {
            timezone: { type: "string", description: "The timezone to check (e.g., 'UTC', 'America/New_York', 'Asia/Kolkata'). Optional, defaults to local time." }
        }
    },
    invoke: async ({ timezone }) => {
        console.log(`[ClockTool] Calling MCP Time sidecar for timezone: ${timezone || 'local'}`);
        try {
            const result = await mcpManager.callTool("time", "get_time", { timezone });
            return result;
        }
        catch (error) {
            console.error(`[ClockTool] MCP Error: ${error.message}`);
            return `Error getting time from MCP sidecar: ${error.message}`;
        }
    }
};
/**
 * Knowledge Search Tool - RAG integration
 */
export const knowledgeSearchTool = {
    name: "knowledge_search",
    description: "Search the internal knowledge base for information from uploaded documents. Use this when the user asks about specific information that might be in their documents.",
    schema: {
        type: "object",
        properties: {
            query: { type: "string", description: "The search query to find relevant information in the knowledge base" }
        },
        required: ["query"]
    },
    invoke: async ({ query }) => {
        console.log(`[KnowledgeSearchTool] Searching for: ${query}`);
        try {
            const { ragService } = await import('../services/rag.js');
            const result = await ragService.query(query);
            if (result && result.answer) {
                return result.answer;
            }
            return "No relevant information found in the knowledge base.";
        }
        catch (error) {
            console.error('[KnowledgeSearchTool] Error:', error);
            return "Knowledge base is not available or has not been initialized.";
        }
    }
};
/**
 * Timer Tool - Set a timer for specified seconds
 */
export const timerTool = {
    name: "timer",
    description: "Set a timer or reminder. Use this when the user asks to set a timer, alarm, or be reminded after some time.",
    schema: {
        type: "object",
        properties: {
            seconds: { type: "number", description: "Number of seconds for the timer" },
            label: { type: "string", description: "Optional label for the timer" }
        },
        required: ["seconds"]
    },
    invoke: async ({ seconds, label }) => {
        console.log(`[TimerTool] Setting timer for ${seconds} seconds`);
        ipcMain.emit('agent:add-timer', {}, { duration: seconds, unit: 'seconds', label });
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${secs}s` : `${seconds}s`;
        return `I've set a timer for ${timeStr}. You should see a countdown appearing in your 3D view now!`;
    }
};
/**
 * Web Search Tool - Search the internet for real-time information
 */
export const webSearchTool = {
    name: "web_search",
    description: "Search the internet for real-time information, facts, or documentation. Use this whenever you don't have the answer in your training data or for recent events.",
    schema: {
        type: "object",
        properties: {
            query: { type: "string", description: "The search query" }
        },
        required: ["query"]
    },
    invoke: async ({ query }) => {
        console.log(`[WebSearchTool] Searching for: ${query}`);
        try {
            const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (!response.ok)
                throw new Error(`Search API error: ${response.status}`);
            const html = await response.text();
            const snippets = [...html.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g)]
                .map(m => m[1].replace(/<\/?[^>]+(>|$)/g, "").trim())
                .slice(0, 3);
            if (snippets.length > 0) {
                return `I found the following web results for "${query}":\n\n` + snippets.map(s => `- ${s}`).join('\n\n') + '\n\n(Source: DuckDuckGo)';
            }
            return `I searched for "${query}" but couldn't find a definitive answer. Try rephrasing or being more specific.`;
        }
        catch (error) {
            console.error('[WebSearchTool] Error:', error);
            return `Search failed: ${error.message}. I'm currently having trouble reaching the search servers.`;
        }
    }
};
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
export const tools = [
    weatherTool,
    clockTool,
    knowledgeSearchTool,
    timerTool,
    webSearchTool,
    browserOpenTool,
    browserSnapshotTool,
    browserClickTool,
    browserFillTool,
];
