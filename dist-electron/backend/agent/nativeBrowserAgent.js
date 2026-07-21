import { mcpManager } from "../services/mcpManager.js";
import { getModelForRole } from "../providers/modelRouter.js";
import { getAIProvider } from "../providers/providerLayer.js";
const BROWSER_SYSTEM_PROMPT = `You are a specialized Browser Agent. Your goal is to navigate the web, perceive the page, and take actions to achieve the user's objective.
You have access to the following tools:
1. browser_open(url: string): Navigate to a webpage.
2. browser_snapshot(): Get a text snapshot of the current page elements and their reference IDs (e.g. @e1).
3. browser_click(ref: string): Click an element.
4. browser_fill(ref: string, value: string): Type into an input field.

IMPORTANT: You MUST respond in valid JSON format. Do not add markdown backticks around your JSON.
If you want to use a tool, reply with exactly:
{ "tool": "tool_name", "args": { "param1": "value1" } }

If you have achieved the objective or want to reply to the user, reply with exactly:
{ "response": "your final answer to the user" }`;
export async function runBrowserAgent(query, modelName, apiKey, onProgress, onToken) {
    console.log('\n\x1b[32m[NativeBrowserAgent]\x1b[0m Starting execution...');
    const targetModel = modelName || getModelForRole('browser_agent');
    const providerName = targetModel.includes("gemini") ? "gemini" : "ollama";
    const provider = getAIProvider(providerName, { apiKey });
    const messages = [
        { role: "user", parts: [{ text: query }] }
    ];
    let iterations = 0;
    const MAX_ITERATIONS = 10;
    while (iterations < MAX_ITERATIONS) {
        iterations++;
        let responseText = "";
        try {
            console.log(`[NativeBrowserAgent] Requesting ${providerName} API (Iteration ${iterations})...`);
            responseText = await provider.generate(messages, {
                model: targetModel,
                systemInstruction: BROWSER_SYSTEM_PROMPT,
                generationConfig: { responseMimeType: "application/json" }
            });
            messages.push({ role: "model", parts: [{ text: responseText }] });
            let parsed;
            try {
                parsed = JSON.parse(responseText);
            }
            catch (e) {
                console.warn("[NativeBrowserAgent] Failed to parse JSON:", responseText);
                messages.push({ role: "user", parts: [{ text: "Your last response was not valid JSON. Please reply with valid JSON." }] });
                continue;
            }
            if (parsed.response) {
                if (onProgress)
                    onProgress("Task completed.");
                return parsed.response;
            }
            if (parsed.tool) {
                if (onProgress)
                    onProgress(`Using tool: ${parsed.tool}...`);
                console.log(`[NativeBrowserAgent] Tool Call: ${parsed.tool}`, parsed.args);
                let toolResult = "";
                try {
                    if (parsed.tool === "browser_open") {
                        const res = await mcpManager.callTool("agent-browser", "agent_browser_open", { url: parsed.args.url });
                        toolResult = JSON.stringify(res);
                    }
                    else if (parsed.tool === "browser_snapshot") {
                        const res = await mcpManager.callTool("agent-browser", "agent_browser_snapshot", { compact: true });
                        let jsonResult = JSON.stringify(res);
                        if (jsonResult.length > 50000) {
                            jsonResult = jsonResult.substring(0, 50000) + '\n\n... [TRUNCATED]';
                        }
                        toolResult = jsonResult;
                    }
                    else if (parsed.tool === "browser_click") {
                        const res = await mcpManager.callTool("agent-browser", "agent_browser_click", { selector: parsed.args.ref });
                        toolResult = JSON.stringify(res);
                    }
                    else if (parsed.tool === "browser_fill") {
                        const res = await mcpManager.callTool("agent-browser", "agent_browser_fill", { selector: parsed.args.ref, text: parsed.args.value });
                        toolResult = JSON.stringify(res);
                    }
                    else {
                        toolResult = `Error: Tool ${parsed.tool} is not available.`;
                    }
                }
                catch (e) {
                    toolResult = `Error executing tool: ${e.message}`;
                }
                messages.push({ role: "user", parts: [{ text: `Tool Result: ${toolResult}` }] });
            }
        }
        catch (e) {
            console.error("[NativeBrowserAgent] Error in loop:", e);
            throw e;
        }
    }
    return "Browser Agent finished without returning a final response (hit iteration limit).";
}
