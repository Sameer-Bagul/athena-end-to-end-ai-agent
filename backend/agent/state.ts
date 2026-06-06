import { MessagesAnnotation } from "@langchain/langgraph";

/**
 * Agent State Definition
 * Uses standard MessagesAnnotation for robust message merging and ID deduping
 */
export const AgentState = MessagesAnnotation;

export type AgentStateType = typeof AgentState.State;
