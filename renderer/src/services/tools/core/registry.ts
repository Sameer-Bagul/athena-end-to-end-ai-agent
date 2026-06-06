import type { Tool } from "./types";
import { WeatherTool } from "../information/weather";
import { NewsTool } from "../information/news";
import { ClockTool } from "../utility/clock";
import { TimerTool } from "../utility/timer";
import { LaptopControlTool } from "../system/laptop";
import { FileManagerTool } from "../system/fileManager";
import { convertToLangChainTool } from "./langchainTools";

class ToolRegistryService {
    private tools: Tool[] = [];
    private initialized = false;

    constructor() {
        // Don't initialize tools immediately - do it lazily
        console.log('[ToolRegistry] ToolRegistry constructed (lazy init)');
    }

    private ensureInitialized() {
        if (this.initialized) return;

        console.log('[ToolRegistry] Initializing tool registry...');
        try {
            console.log('[ToolRegistry] Registering WeatherTool...');
            this.register(WeatherTool);

            console.log('[ToolRegistry] Registering NewsTool...');
            this.register(NewsTool);

            console.log('[ToolRegistry] Registering ClockTool...');
            this.register(ClockTool);

            console.log('[ToolRegistry] Registering TimerTool...');
            this.register(TimerTool);

            console.log('[ToolRegistry] Registering LaptopControlTool...');
            this.register(LaptopControlTool);

            console.log('[ToolRegistry] Registering FileManagerTool...');
            this.register(FileManagerTool);

            this.initialized = true;
            console.log(`[ToolRegistry] ✅ Registered ${this.tools.length} tools successfully`);
        } catch (error) {
            console.error('[ToolRegistry] ❌ Error during tool registration:', error);
            // Don't throw - just log and continue with empty tools
            this.initialized = true;
        }
    }

    register(tool: Tool) {
        this.tools.push(tool);
    }

    getAllTools(): Tool[] {
        this.ensureInitialized();
        return this.tools;
    }

    async getLangChainTools(): Promise<any[]> {
        this.ensureInitialized();
        console.log('[ToolRegistry] Converting tools to LangChain format...');
        try {
            // Since convertToLangChainTool is now async, we await all conversions
            const langchainTools = await Promise.all(
                this.tools.map(async tool => {
                    try {
                        return await convertToLangChainTool(tool);
                    } catch (error) {
                        console.error(`[ToolRegistry] Failed to convert ${tool.name}, skipping:`, error);
                        return null;
                    }
                })
            );

            // Filter out any failed conversions
            const validTools = langchainTools.filter(t => t !== null);
            console.log(`[ToolRegistry] Successfully converted ${validTools.length}/${this.tools.length} tools`);
            return validTools;
        } catch (error) {
            console.error('[ToolRegistry] Error converting tools to LangChain format:', error);
            return [];
        }
    }

    /**
     * Generates a stringified manifest for the LLM to understand available tools.
     */
    getToolManifest(): string {
        this.ensureInitialized();
        return this.tools.map(tool => {
            return `
### Tool: ${tool.name}
- **Category**: ${tool.category}
- **Description**: ${tool.description}
- **Parameters**: ${JSON.stringify(tool.parameters, null, 2)}
- **Keywords**: [${tool.keywords.join(', ')}]
`;
        }).join('\n---\n');
    }

    findTool(text: string): Tool | null {
        this.ensureInitialized();
        const lowerText = text.toLowerCase();
        console.log(`[ToolRegistry] Searching tool for text: "${lowerText}"`);

        for (const tool of this.tools) {
            for (const keyword of tool.keywords) {
                if (lowerText.includes(keyword)) {
                    console.log(`[ToolRegistry] Found tool "${tool.name}" via keyword "${keyword}"`);
                    return tool;
                }
            }
        }
        console.log(`[ToolRegistry] No tool found.`);
        return null;
    }

    async executeTool(tool: Tool, params: any): Promise<string> {
        console.log(`[ToolRegistry] Executing ${tool.name} with params:`, params);
        try {
            return await tool.execute(params);
        } catch (e) {
            console.error(`[ToolRegistry] Error executing ${tool.name}:`, e);
            return `Error executing tool ${tool.name}.`;
        }
    }
}

export const ToolRegistry = new ToolRegistryService();
