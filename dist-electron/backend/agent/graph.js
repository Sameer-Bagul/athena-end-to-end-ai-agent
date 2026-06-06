import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { AgentState } from "./state.js";
import { tools } from "./tools.js";
const c = { agent: "\x1b[35m[Agent]\x1b[0m", graph: "\x1b[35m[AgentGraph]\x1b[0m" };
/**
 * System prompt that instructs the model how to use tools
 */
const TOOL_SYSTEM_PROMPT = `### TOOL USE RULES (MANDATORY)
1. If you need external data (time, weather, search, timer), respond ONLY with a JSON object.
2. NO text preamble, NO conversational filler.
3. Once a tool returns a RESULT, respond naturally to the user explaining what happened.

TOOLS:
- weather(city): Current weather
- clock(timezone?): Current time
- knowledge_search(query): Search local files
- timer(seconds, label?): Set a physical timer
- web_search(query): Search the internet for real-time info/docs

JSON FORMAT:
{"tool": "timer", "arguments": {"seconds": 60, "label": "Coffee"}}`;
/**
 * Initialize the LLM - Optimized for speed
 */
function createLLM(modelName = "dolphin-mistral:latest", apiKey) {
    if (modelName.toLowerCase().includes("gemini")) {
        return new ChatGoogleGenerativeAI({
            model: modelName,
            temperature: 0,
            apiKey: apiKey || process.env.GOOGLE_API_KEY,
        });
    }
    return new ChatOllama({
        model: modelName,
        temperature: 0, // Forced deterministic for tool JSON
        numCtx: 4096, // Increased context window
        numPredict: 512, // Enough for JSON + small explanation if anyway
        baseUrl: "http://localhost:11434",
    });
}
/**
 * Agent Node - Makes decisions and optionally calls tools
 */
async function callAgent(state, config) {
    console.log('[Agent] Processing messages...');
    const modelName = config?.configurable?.model || "dolphin-mistral:latest";
    try {
        const apiKey = config?.configurable?.apiKey;
        const llm = createLLM(modelName, apiKey);
        console.log(`[Agent] Using model: ${modelName}`);
        console.log(`[Agent] Message count: ${state.messages.length}`);
        // Invoke the model with config to support callbacks and timeout
        const response = await llm.invoke(state.messages, {
            ...config,
            // @ts-ignore - Timeout might not be in the exact type but often works in runtime for LangChain
            timeout: 60000
        });
        console.log('[Agent] Response received');
        console.log(`[Agent] RAW Response:`, response.content);
        return { messages: [response] };
    }
    catch (error) {
        console.error('[Agent] Error during LLM invocation:', error.message);
        console.error('[Agent] Full error:', error);
        // Return error as AI message so execution doesn't hang
        const hint = modelName.toLowerCase().includes('gemini') ? 'Gemini API Key' : "if Ollama is running with 'ollama list'";
        return {
            messages: [
                new AIMessage({
                    content: `I encountered an error: ${error.message}. Please check ${hint}.`
                })
            ]
        };
    }
}
/**
 * Tool Execution Node - Manually executes tools based on JSON response
 */
async function executeTools(state) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!(lastMessage instanceof AIMessage)) {
        return { messages: [] };
    }
    const content = String(lastMessage.content).trim();
    try {
        // Improved JSON extraction: 
        // 1. Check for markdown code blocks first
        // 2. Fall back to regex finding the first '{' and last '}'
        let jsonStr = "";
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        }
        else {
            const braceMatch = content.match(/\{[\s\S]*\}/);
            if (braceMatch) {
                jsonStr = braceMatch[0].trim();
            }
        }
        if (!jsonStr) {
            throw new Error('No JSON detected in response');
        }
        // Parse the JSON tool call
        const toolCall = JSON.parse(jsonStr);
        if (!toolCall.tool || !toolCall.arguments) {
            throw new Error('Invalid tool call format');
        }
        console.log(`[Tools] Executing: ${toolCall.tool}`);
        console.log(`[Tools] Arguments:`, toolCall.arguments);
        // Find and execute the tool
        const tool = tools.find(t => t.name === toolCall.tool);
        if (!tool) {
            const errorMsg = `Tool "${toolCall.tool}" not found. Available: ${tools.map(t => t.name).join(', ')}`;
            console.error(`[Tools] ${errorMsg}`);
            return {
                messages: [
                    new ToolMessage({
                        content: errorMsg,
                        name: toolCall.tool,
                        tool_call_id: 'manual',
                    })
                ]
            };
        }
        // Execute the tool (cast to any to handle complex union types)
        const result = await tool.invoke(toolCall.arguments);
        console.log(`[Tools] Result: ${String(result).substring(0, 100)}...`);
        // Return tool result as a message
        return {
            messages: [
                new ToolMessage({
                    content: String(result),
                    name: toolCall.tool,
                    tool_call_id: 'manual',
                })
            ]
        };
    }
    catch (error) {
        console.error('[Tools] Execution error:', error.message);
        return {
            messages: [
                new ToolMessage({
                    content: `Tool execution failed: ${error.message}`,
                    name: 'manual_tool_execution',
                    tool_call_id: 'manual',
                })
            ]
        };
    }
}
/**
 * Conditional edge - Determines if we should execute tools or end
 */
function shouldContinue(state) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!(lastMessage instanceof AIMessage)) {
        return END;
    }
    const content = String(lastMessage.content).trim();
    // Check if response contains a JSON tool call
    // Look for {"tool": pattern anywhere in the response
    const toolCallMatch = content.match(/\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:/);
    if (toolCallMatch) {
        console.log(`[Agent] Detected tool call: ${toolCallMatch[1]}`);
        console.log('[Agent] Routing to tools');
        return "tools";
    }
    // Otherwise, we're done
    console.log('[Agent] Ending conversation');
    return END;
}
/**
 * Build the Agent Graph
 */
export function createAgentGraph() {
    // Build the graph with manual tool routing
    const workflow = new StateGraph(AgentState)
        .addNode("agent", callAgent)
        .addNode("tools", executeTools)
        .addEdge(START, "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent");
    // Compile and return
    return workflow.compile();
}
// Cache the compiled graph to avoid rebuilding on every request
let cachedGraph = null;
/**
 * Get or create the agent graph (singleton pattern for performance)
 */
function getOrCreateGraph() {
    if (!cachedGraph) {
        console.log('[AgentGraph] Compiling workflow (first time)...');
        cachedGraph = createAgentGraph();
        console.log('[AgentGraph] Workflow compiled and cached');
    }
    return cachedGraph;
}
/**
 * Run the agent with a user query
 */
export async function runAgent(query, systemPrompt, modelName, apiKey, onProgress, onToken) {
    console.log('\n\x1b[32m[AgentGraph]\x1b[0m Starting agent execution...');
    try {
        const graph = getOrCreateGraph();
        // Combine user's system prompt with tool instructions
        // Combine user's system prompt with tool instructions and CURRENT TIME
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
        const fullSystemPrompt = `[STRICT_COMMAND_CENTER]
- CURRENT_TIME: ${timeStr}
- IF YOU NEED A TOOL: Respond ONLY with the JSON object. No other text.
- AFTER TOOL RESULT: Provide a natural, conversational confirmation for Sameer Bagul.

${TOOL_SYSTEM_PROMPT}

[CHARACTER_PROFILE]
${systemPrompt || "I am Athena, a loyal and analytical assistant."}

[FINAL_CORE_RULES]
- ALWAYS use 'clock' for current time verification.
- ALWAYS use 'web_search' for any research requests.
- DO NOT textually simulate tool results.
- NEVER speak JSON. If you output JSON, let the system handle it and wait for the result.
- ONCE THE TOOL FINISHES, explain the outcome to your Master, Sameer Bagul.`;
        const messages = [
            new SystemMessage(fullSystemPrompt),
            new HumanMessage(query),
        ];
        console.log('\n\x1b[32m[AgentGraph]\x1b[0m Full System Prompt:', fullSystemPrompt);
        console.log('\n\x1b[32m[AgentGraph]\x1b[0m User Query:', query);
        const config = {
            configurable: {
                model: modelName || "dolphin-mistral:latest",
                apiKey: apiKey,
            },
            callbacks: [
                {
                    handleLLMNewToken(token) {
                        if (onToken) {
                            onToken(token);
                        }
                    }
                }
            ]
        };
        // Stream the execution
        let finalResponse = "";
        const stream = await graph.stream({ messages }, { ...config, streamMode: "values" });
        for await (const event of stream) {
            const lastMessage = event.messages[event.messages.length - 1];
            if (lastMessage instanceof AIMessage) {
                const content = String(lastMessage.content);
                // Check if it's a tool call (JSON format)
                if (content.trim().startsWith('{') && content.includes('"tool"')) {
                    try {
                        const parsed = JSON.parse(content);
                        if (parsed.tool && onProgress) {
                            onProgress(`Using ${parsed.tool}...`);
                        }
                    }
                    catch {
                        // Not a tool call, treat as final response
                        finalResponse = content;
                        if (onProgress) {
                            onProgress(content);
                        }
                    }
                }
                else {
                    // Normal response
                    finalResponse = content;
                    if (onProgress) {
                        onProgress(content);
                    }
                }
            }
            else if (lastMessage instanceof ToolMessage) {
                // Tool result received, will be sent back to agent
                if (onProgress) {
                    onProgress('Processing result...');
                }
            }
        }
        console.log('[AgentGraph] Agent execution completed');
        return finalResponse || "I apologize, but I couldn't generate a response.";
    }
    catch (error) {
        console.error('[AgentGraph] Error during execution:', error);
        throw error;
    }
}
