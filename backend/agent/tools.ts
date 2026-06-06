import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ipcMain } from "electron";
import { mcpManager } from "./mcpManager.js";

/**
 * Weather Tool - Get current weather for a city
 */
export const weatherTool = tool(
  async ({ city }: { city: string }) => {
    console.log(`[WeatherTool] Fetching weather for ${city}`);

    // Note: API key should be configured in settings
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return "Weather tool is not configured. Please add an API Key in Settings.";
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
      );

      if (!response.ok) {
        if (response.status === 404) return `Could not find weather data for ${city}.`;
        if (response.status === 401) return `Weather API Error: Invalid API Key.`;
        return `Weather API error: ${response.statusText}`;
      }

      const data = await response.json();
      const weather = data.weather[0];
      const main = data.main;
      const timestamp = new Date().toLocaleTimeString();

      return `Current weather in ${data.name}: ${weather.main} (${weather.description}). Temperature: ${main.temp}°C. Humidity: ${main.humidity}%. [Source: OpenWeatherMap | ${timestamp}]`;
    } catch (error) {
      return `Failed to fetch weather: ${error}`;
    }
  },
  {
    name: "weather",
    description: "Get current weather for a specific city. Use this when user asks about weather, temperature, or climate conditions.",
    schema: z.object({
      city: z.string().describe("The name of the city to get weather for (e.g., 'London', 'Mumbai', 'New York')"),
    }),
  }
);

/**
 * Clock Tool - Get current date and time (Bridged to MCP)
 */
export const clockTool = tool(
  async ({ timezone }: { timezone?: string }) => {
    console.log(`[ClockTool] Calling MCP Time sidecar for timezone: ${timezone || 'local'}`);

    try {
      // Call the MCP sidecar via the manager
      const result = await mcpManager.callTool("time", "get_time", { timezone });
      return result;
    } catch (error: any) {
      console.error(`[ClockTool] MCP Error: ${error.message}`);
      return `Error getting time from MCP sidecar: ${error.message}`;
    }
  },
  {
    name: "clock",
    description: "Get the current date and time or check a specific timezone. Use this when user asks about time, date, or 'what time is it'.",
    schema: z.object({
      timezone: z.string().optional().describe("The timezone to check (e.g., 'UTC', 'America/New_York', 'Asia/Kolkata'). Optional, defaults to local time."),
    }),
  }
);

/**
 * Knowledge Search Tool - RAG integration
 */
export const knowledgeSearchTool = tool(
  async ({ query }: { query: string }) => {
    console.log(`[KnowledgeSearchTool] Searching for: ${query}`);

    // This will be integrated with the existing RAG service
    try {
      const { ragService } = await import('../rag.js');
      const result = await ragService.query(query);

      if (result && result.answer) {
        return result.answer;
      }

      return "No relevant information found in the knowledge base.";
    } catch (error) {
      console.error('[KnowledgeSearchTool] Error:', error);
      return "Knowledge base is not available or has not been initialized.";
    }
  },
  {
    name: "knowledge_search",
    description: "Search the internal knowledge base for information from uploaded documents. Use this when the user asks about specific information that might be in their documents.",
    schema: z.object({
      query: z.string().describe("The search query to find relevant information in the knowledge base"),
    }),
  }
);

/**
 * Timer Tool - Set a timer for specified seconds
 */
export const timerTool = tool(
  async ({ seconds, label }: { seconds: number, label?: string }) => {
    console.log(`[TimerTool] Setting timer for ${seconds} seconds`);

    // Broadcast to renderer via main process IPC
    ipcMain.emit('agent:add-timer', {}, { duration: seconds, unit: 'seconds', label });

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = minutes > 0
      ? `${minutes}m ${secs}s`
      : `${seconds}s`;

    return `I've set a timer for ${timeStr}. You should see a countdown appearing in your 3D view now!`;
  },
  {
    name: "timer",
    description: "Set a timer or reminder. Use this when the user asks to set a timer, alarm, or be reminded after some time.",
    schema: z.object({
      seconds: z.number().describe("Number of seconds for the timer"),
      label: z.string().optional().describe("Optional label for the timer"),
    }),
  }
);

/**
 * Web Search Tool - Search the internet for real-time information
 */
export const webSearchTool = tool(
  async ({ query }: { query: string }) => {
    console.log(`[WebSearchTool] Searching for: ${query}`);
    try {
      // DuckDuckGo Instant Answer API
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Search API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[WebSearchTool] Got response from DuckDuckGo`);

      if (data.AbstractText) {
        return `Best result for "${query}": ${data.AbstractText}\nSource: ${data.AbstractSource || 'DuckDuckGo'}`;
      }

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        // Filter out topics that don't have text
        const topics = data.RelatedTopics
          .filter((t: any) => t.Text)
          .slice(0, 3)
          .map((t: any) => `- ${t.Text}`)
          .join('\n');

        if (topics) {
          return `I found some related information for "${query}":\n${topics}\n(Source: DuckDuckGo Related Topics)`;
        }
      }

      return `I searched for "${query}" but couldn't find a definitive answer. Try rephrasing or being more specific.`;
    } catch (error: any) {
      console.error('[WebSearchTool] Error:', error);
      return `Search failed: ${error.message}. I'm currently having trouble reaching the search servers.`;
    }
  },
  {
    name: "web_search",
    description: "Search the internet for real-time information, facts, or documentation. Use this whenever you don't have the answer in your training data or for recent events.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

/**
 * Export all tools
 */
export const tools = [
  weatherTool,
  clockTool,
  knowledgeSearchTool,
  timerTool,
  webSearchTool,
];
