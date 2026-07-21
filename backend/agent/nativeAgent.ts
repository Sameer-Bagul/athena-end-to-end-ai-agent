import { tools } from "./tools.js";
import { getModelForRole, determineRoleForQuery } from "../providers/modelRouter.js";
import { getAIProvider } from "../providers/providerLayer.js";

const MAX_ITERATIONS = 5;

export async function runAgent(
  query: string,
  systemPrompt: string,
  modelName?: string,
  apiKey?: string,
  onProgress?: (message: string) => void,
  onToken?: (token: string) => void
): Promise<string> {
  console.log('\n\x1b[32m[NativeAgent]\x1b[0m Starting pure cloud execution...');
  
  // 1. Intent Routing
  const role = determineRoleForQuery(query);
  const targetModel = modelName || getModelForRole(role);
  
  console.log(`[NativeAgent] Router assigned role: ${role} -> Model: ${targetModel}`);

  // 2. Provider Layer Initialization
  const providerName = targetModel.includes("gemini") ? "gemini" : "ollama";
  const provider = getAIProvider(providerName, { apiKey });

  const now = new Date();
  const timeStr = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
  });

  const fullSystemPrompt = `[CURRENT_TIME]
${timeStr}

[CHARACTER_PROFILE]
${systemPrompt || "I am Athena, a loyal and analytical assistant."}

[FINAL_CORE_RULES]
- ALWAYS use the 'clock' tool for current time verification.
- ALWAYS use the 'web_search' tool for any research requests.
- When a tool returns a result, explain the outcome naturally to your Master, Sameer Bagul.

[TOOL_INSTRUCTIONS]
You have access to the following tools:
${tools.map(t => `- ${t.name}: ${t.description}\n  Schema: ${JSON.stringify(t.schema)}`).join("\n")}

IMPORTANT: You MUST respond in valid JSON format. Do not use markdown backticks.
If you want to use a tool, reply with exactly:
{ "tool": "tool_name", "args": { "param1": "value1" } }

If you want to reply directly to the user without using a tool, reply with exactly:
{ "response": "your final answer to the user" }`;

  const messages: any[] = [
    { role: "user", parts: [{ text: query }] }
  ];

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    let responseText = "";

    try {
      console.log(`[NativeAgent] Requesting ${providerName} API (Iteration ${iterations})...`);
      
      responseText = await provider.generate(messages, {
        model: targetModel,
        systemInstruction: fullSystemPrompt,
        generationConfig: { responseMimeType: "application/json" }
      });
      messages.push({ role: "model", parts: [{ text: responseText }] });

      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        messages.push({ role: "user", parts: [{ text: "Your last response was not valid JSON. Please reply with valid JSON." }] });
        continue;
      }

      if (parsed.response) {
        if (onProgress) onProgress("Task completed.");
        return parsed.response;
      }

      if (parsed.tool) {
        if (onProgress) onProgress(`Using tool: ${parsed.tool}...`);
        console.log(`[NativeAgent] Tool Call: ${parsed.tool}`, parsed.args);

        const tool = tools.find(t => t.name === parsed.tool);
        let toolResult = "";

        if (tool) {
          try {
            const result = await tool.invoke(parsed.args);
            toolResult = String(result);
          } catch (e: any) {
            toolResult = `Error executing tool: ${e.message}`;
          }
        } else {
          toolResult = `Error: Tool ${parsed.tool} is not available.`;
        }

        messages.push({ role: "user", parts: [{ text: `Tool Result: ${toolResult}` }] });
      }

    } catch (e: any) {
      console.error("[NativeAgent] Error in loop:", e);
      throw e;
    }
  }

  return "Agent finished without returning a final response (hit iteration limit).";
}
