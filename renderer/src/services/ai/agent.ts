import { logger } from "../../lib/logger";
import type { AIProvider } from "./types";

export interface AgentResult {
    content: string;
    usedTools: string[];
}

class AgentManagerService {
    constructor() {
        logger.info('[AgentManager] Using backend LangGraph agent via IPC');
    }

    /**
     * The main reasoning loop - now delegates to backend
     */
    async process(
        text: string,
        systemPrompt: string,
        provider: AIProvider,
        onChunk?: (token: string) => void,
        _onStatusUpdate?: (status: string) => void
    ): Promise<AgentResult> {
        logger.info('[AgentManager] Processing query via backend agent...');

        try {
            // Get the model name dynamically from the provider
            const modelName = provider.getModelName();

            const queryId = Math.random().toString(36).substring(7);

            // Call the backend agent via IPC
            // @ts-ignore
            const result = await window.athena.agent.queryStream(queryId, text, systemPrompt, modelName, onChunk, _onStatusUpdate);

            if (!result.success) {
                logger.warn('[AgentManager] Backend agent failed, forwarding error:', result.error);
                const errorMessage = `I encountered an error connecting to my AI core (${modelName}). Error detail: ${result.error}. Please ensure your provider is running and matches your configuration.`;

                if (onChunk) {
                    onChunk(errorMessage);
                }

                return {
                    content: errorMessage,
                    usedTools: []
                };
            }

            return {
                content: result.response,
                usedTools: [] // Tool tracking would need to be added to backend
            };

        } catch (error) {
            logger.error('[AgentManager] Error calling backend agent:', error);
            const errorMessage = `I encountered an unexpected system error: ${error instanceof Error ? error.message : "Unknown failure"}`;

            if (onChunk) {
                onChunk(errorMessage);
            }

            return {
                content: errorMessage,
                usedTools: []
            };
        }
    }



}

export const AgentManager = new AgentManagerService();
