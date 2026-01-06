import { useAppStore } from "../context/AppContext";
import { sendMessageToOllama, generateSpeech } from "../lib/api";
import { ToolRegistry } from "../services/tools/core/registry";

export function useAssistant() {
    const { state, actions } = useAppStore();

    const processInput = async (
        text: string,
        options: {
            source: 'voice' | 'text',
            onPlayAudio: (blob: Blob) => Promise<void>
        }
    ) => {
        actions.setChatProcessing(true);
        const shouldSpeak = options.source === 'voice' || state.isListening;

        try {
            // --- Tool Check ---
            let context = "";
            const tool = ToolRegistry.findTool(text);
            if (tool) {
                actions.setTranscript(`Using tool: ${tool.name}...`);
                const toolResult = await ToolRegistry.executeTool(tool, text);
                context = `\n[SYSTEM CONTEXT]\nTool '${tool.name}' result: ${toolResult}\n[END CONTEXT]\n`;
                console.log("[useAssistant] Tool Context:", context);
            }

            // 1. LLM Request
            // Append context to the *user prompt* effectively, or we can send it as system message update.
            // But modifying the prompt is easier for a stateless request.
            const fullPrompt = context ? `${context}\n${text}` : text;

            const response = await sendMessageToOllama(fullPrompt);
            actions.addMessage({ role: 'assistant', content: response });

            // 2. TTS Request (if applicable)
            if (shouldSpeak) {
                console.log(`🎤 [useAssistant] TTS Triggered (Source: ${options.source}, Listening: ${state.isListening})`);
                try {
                    const audio = await generateSpeech(response, state.selectedCharacter.voiceStyle);
                    console.log("🎤 [useAssistant] Speech generated, playing...");
                    await options.onPlayAudio(audio);
                } catch (e) {
                    console.error("[useAssistant] TTS failed", e);
                }
            } else {
                console.log("🎤 [useAssistant] Auto-speak skipped (Source not voice & Mic off)");
            }

        } catch (e) {
            console.error("[useAssistant] Chat error", e);
            actions.addMessage({ role: 'assistant', content: "Error: Could not process request." });
        } finally {
            actions.setChatProcessing(false);
            actions.setTranscript(""); // Clear "Using tool..." message
        }
    };

    return { processInput };
}
