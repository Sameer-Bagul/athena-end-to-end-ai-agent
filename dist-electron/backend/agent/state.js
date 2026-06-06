import { Annotation } from "@langchain/langgraph";
/**
 * Agent State Definition
 * This stores the conversation history and context
 */
export const AgentState = Annotation.Root({
    messages: Annotation({
        reducer: (x, y) => x.concat(y),
    }),
});
