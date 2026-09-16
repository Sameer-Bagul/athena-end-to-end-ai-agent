import { Tool } from "./types.js";
import { mcpManager } from "../../services/mcpManager.js";
import { ipcMain } from "electron";

/**
 * Clock Tool - Get current date and time (Bridged to MCP)
 */
export const clockTool: Tool = {
  name: "clock",
  description: "Get the current date and time or check a specific timezone. Use this when user asks about time, date, or 'what time is it'.",
  schema: {
    type: "object",
    properties: {
      timezone: { type: "string", description: "The timezone to check (e.g., 'UTC', 'America/New_York', 'Asia/Kolkata'). Optional, defaults to local time." }
    }
  },
  invoke: async ({ timezone }: { timezone?: string }) => {
    console.log(`[ClockTool] Calling MCP Time sidecar for timezone: ${timezone || 'local'}`);
    try {
      const result = await mcpManager.callTool("time", "get_time", { timezone });
      return result as string;
    } catch (error: any) {
      console.error(`[ClockTool] MCP Error: ${error.message}`);
      return `Error getting time from MCP sidecar: ${error.message}`;
    }
  }
};

/**
 * Timer Tool - Set a timer for specified seconds
 */
export const timerTool: Tool = {
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
  invoke: async ({ seconds, label }: { seconds: number, label?: string }) => {
    console.log(`[TimerTool] Setting timer for ${seconds} seconds`);
    ipcMain.emit('agent:add-timer', {}, { duration: seconds, unit: 'seconds', label });

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = minutes > 0 ? `${minutes}m ${secs}s` : `${seconds}s`;

    return `I've set a timer for ${timeStr}. You should see a countdown appearing in your 3D view now!`;
  }
};
