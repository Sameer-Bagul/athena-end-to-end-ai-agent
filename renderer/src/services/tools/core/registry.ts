
import type { Tool } from "./types";
import { WeatherTool } from "../information/weather";
import { NewsTool } from "../information/news";

class ToolRegistryService {
    private tools: Tool[] = [];

    constructor() {
        this.register(WeatherTool);
        this.register(NewsTool);
    }

    register(tool: Tool) {
        this.tools.push(tool);
    }

    findTool(text: string): Tool | null {
        const lowerText = text.toLowerCase();

        // Simple preference: First tool that matches any keyword
        // Improvement: Use LLM to classify intent if we want to get fancy, 
        // but for now explicit keywords work best for "News" and "Weather".

        for (const tool of this.tools) {
            for (const keyword of tool.keywords) {
                if (lowerText.includes(keyword)) {
                    return tool;
                }
            }
        }
        return null;
    }

    async executeTool(tool: Tool, text: string): Promise<string> {
        console.log(`[ToolRegistry] Executing ${tool.name} with params: ${text}`);
        try {
            return await tool.execute(text);
        } catch (e) {
            console.error(`[ToolRegistry] Error executing ${tool.name}:`, e);
            return `Error executing tool ${tool.name}.`;
        }
    }
}

export const ToolRegistry = new ToolRegistryService();
