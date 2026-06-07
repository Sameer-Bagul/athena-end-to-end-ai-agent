import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { AgentState } from "./state.js";
import { tools } from "./tools.js";

const c = { agent: "\x1b[35m[Agent]\x1b[0m", graph: "\x1b[35m[AgentGraph]\x1b[0m" };

/**
 * System prompt rules that guide the AI's core behavior.
 * (Native tool schemas are injected automatically by LangChain)
 */;

/**
 * Initialize the LLM - Optimized for speed
 */
function createLLM(modelName: string = "qwen2.5-coder:7b", apiKey?: string) {
  if (modelName.toLowerCase().includes("gemini")) {
    const gemini = new ChatGoogleGenerativeAI({
      model: modelName,
      temperature: 0,
      apiKey: apiKey || process.env.GOOGLE_API_KEY,
    });
    return gemini.bindTools(tools);
  }

  // Ollama models (local) will not have tools bound to keep them purely conversational
  const ollama = new ChatOllama({
    model: modelName,
    temperature: 0.7, // Increased temperature to prevent deterministic empty string collapse in dolphin-mistral
    numCtx: 4096, 
    numPredict: 512, 
    baseUrl: "http://localhost:11434",
  });

  return ollama;
}

/**
 * Agent Node - Makes decisions and optionally calls tools
 */
async function callAgent(state: typeof AgentState.State, config?: any) {
  console.log('[Agent] Processing messages...');
  const modelName = config?.configurable?.model || "qwen2.5-coder:7b";

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
  } catch (error: any) {
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
async function executeTools(state: typeof AgentState.State) {
  const lastMessage = state.messages[state.messages.length - 1];

  if (!(lastMessage instanceof AIMessage)) {
    return { messages: [] };
  }

  const content = String(lastMessage.content).trim();

  try {
    // Handle native Langchain tool calls first (from Ollama bindTools)
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      const call = lastMessage.tool_calls[0];
      console.log(`[Tools] Executing native tool: ${call.name}`);
      console.log(`[Tools] Arguments:`, call.args);

      const tool = tools.find(t => t.name === call.name);
      if (!tool) {
        throw new Error(`Tool "${call.name}" not found`);
      }

      const result = await (tool as any).invoke(call.args);
      console.log(`[Tools] Result: ${String(result).substring(0, 100)}...`);

      return {
        messages: [
          new ToolMessage({
            content: String(result),
            name: call.name,
            tool_call_id: call.id || 'manual',
          })
        ]
      };
    }

    // Fallback: Parse raw JSON response
    let jsonStr = "";
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);

    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0].trim();
      }
    }

    if (!jsonStr) {
      throw new Error('No tool call detected in response');
    }

    // Parse the JSON tool call
    const toolCall = JSON.parse(jsonStr);

    if (!toolCall.tool || !toolCall.arguments) {
      throw new Error('Invalid tool call format');
    }

    console.log(`[Tools] Executing parsed: ${toolCall.tool}`);
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
    const result = await (tool as any).invoke(toolCall.arguments);

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

  } catch (error: any) {
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
function shouldContinue(state: typeof AgentState.State): "tools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1];

  if (!(lastMessage instanceof AIMessage)) {
    return END;
  }

  // Check for native Langchain tool_calls
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    console.log(`[Agent] Detected tool call: ${lastMessage.tool_calls[0].name}`);
    console.log('[Agent] Routing to tools');
    return "tools";
  }

  const content = String(lastMessage.content).trim();

  // Fallback: Check if response contains a JSON tool call manually
  // Look for {"tool": pattern anywhere in the response
  const toolCallMatch = content.match(/\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:/);

  if (toolCallMatch) {
    console.log(`[Agent] Detected raw JSON tool call: ${toolCallMatch[1]}`);
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
let cachedGraph: ReturnType<typeof createAgentGraph> | null = null;

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
export async function runAgent(
  query: string,
  systemPrompt: string,
  modelName?: string,
  apiKey?: string,
  onProgress?: (message: string) => void,
  onToken?: (token: string) => void
): Promise<string> {
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

    const isAdvancedModel = modelName?.toLowerCase().includes("gemini");

    const coreRules = isAdvancedModel 
      ? `- ALWAYS use the 'clock' tool for current time verification.
- ALWAYS use the 'web_search' tool for any research requests.
- When a tool returns a result, explain the outcome naturally to your Master, Sameer Bagul.`
      : `- You do NOT have access to external tools, real-time data, search, or physical timers.
- If the user asks you to perform an action requiring a tool (like checking the weather, setting a timer, or searching the web), politely explain that you are currently running as a local model. Suggest that they switch to an advanced model (like Gemini) in the Settings to enable full tool support.
- Otherwise, converse naturally and do not mention tools.`;

const fullSystemPrompt = `[CURRENT_TIME]
${timeStr}

[CHARACTER_PROFILE]
${systemPrompt || "I am Athena, a loyal and analytical assistant."}

[FINAL_CORE_RULES]
${coreRules}`;

    const messages: BaseMessage[] = [
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
          handleLLMNewToken(token: string) {
            if (onToken) {
              onToken(token);
            }
          }
        }
      ]
    };

    // Stream the execution
    let finalResponse = "";

    const stream = await graph.stream(
      { messages },
      { ...config, streamMode: "values" }
    );

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
          } catch {
            // Not a tool call, treat as final response
            finalResponse = content;
            if (onProgress) {
              onProgress(content);
            }
          }
        } else {
          // Normal response
          finalResponse = content;
          if (onProgress) {
            onProgress(content);
          }
        }
      } else if (lastMessage instanceof ToolMessage) {
        // Tool result received, will be sent back to agent
        if (onProgress) {
          onProgress('Processing result...');
        }
      }
    }

    console.log('[AgentGraph] Agent execution completed');

    return finalResponse || "I apologize, but I couldn't generate a response.";

  } catch (error) {
    console.error('[AgentGraph] Error during execution:', error);
    throw error;
  }
}
