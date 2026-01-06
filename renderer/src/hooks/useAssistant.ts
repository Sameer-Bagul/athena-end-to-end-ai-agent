import { useAppStore } from "../context/AppContext";
import { sendMessageToOllama, generateSpeech } from "../lib/api";

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
            // 1. LLM Request
            const response = await sendMessageToOllama(text);
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
        }
    };

    return { processInput };
}
