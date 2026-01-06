import { useRef } from "react";
import { useAppStore } from "../context/AppContext";
import { sendMessageToOllama, generateSpeech } from "../lib/api";
import { ToolRegistry } from "../services/tools/core/registry";

export function useAssistant() {
    const { state, actions } = useAppStore();

    // Audio Queue Logic
    const audioQueueRef = useRef<(() => Promise<void>)[]>([]);
    const isPlayingRef = useRef(false);

    const processAudioQueue = async () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

        isPlayingRef.current = true;
        const task = audioQueueRef.current.shift();

        if (task) {
            try {
                await task();
            } catch (e) {
                console.error("Audio playback error:", e);
            }
        }

        isPlayingRef.current = false;
        processAudioQueue();
    };

    const processInput = async (
        text: string,
        options: {
            source: 'voice' | 'text',
            onPlayAudio: (blob: Blob) => Promise<void>
        }
    ) => {
        actions.setChatProcessing(true);
        // User request: always respond with voice + text
        const shouldSpeak = true;

        // Reset queue on new input? Maybe optional, but safer to assume sequential conversation
        // audioQueueRef.current = []; // Uncomment if we want interruptions

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

            // 1. Setup Prompt
            // Structure prompt to explicitly prioritize tool context if available
            let fullPrompt = text;
            if (context) {
                fullPrompt = `SYSTEM INSTRUCTION: You have access to real-time data from a tool. You MUST use the information provided in the [SYSTEM CONTEXT] block to answer the user. Do not hallucinate or ignore this data. Cite the source if provided.
                
                ${context}
                
                User Query: ${text}`;
            }

            // 2. Prepare Streaming State
            // Add a placeholder message that we will update live
            // We use a unique ID logic implicitly by targeting the last message
            actions.addMessage({ role: 'assistant', content: '...' });

            let fullResponse = "";
            let pendingSpeechText = "";

            // Animation Keyword Matching
            const determineAnimation = (text: string): string | undefined => {
                const t = text.toLowerCase();
                if (t.includes("hello") || t.includes("hi ") || t.includes("greetings")) return 'CLAPPING'; // Friendly greeting
                if (t.includes("bye") || t.includes("see you")) return 'GOODBYE';
                if (t.includes("wow") || t.includes("amazing") || t.includes("great")) return 'CLAPPING';
                if (t.includes("sad") || t.includes("sorry") || t.includes("unfortunate")) return 'SAD';
                if (t.includes("angry") || t.includes("mad") || t.includes("terrible")) return 'ANGRY';
                if (t.includes("wait") || t.includes("thinking") || t.includes("hmm")) return 'THINKING';
                if (t.includes("yes") || t.includes("course") || t.includes("sure")) return 'CLAPPING'; // Nod equivalent?
                if (t.includes("no ") || t.includes("not ")) return 'ANGRY'; // Shake equivalent?

                // Default "Talking" animation for any speech
                return 'THINKING';
            };

            const queueSentence = (sentence: string) => {
                console.log(`🎤 [Stream] Queuing speech: "${sentence}"`);

                // Determine animation mainly from the sentence content
                const animation = determineAnimation(sentence);

                // Start generation immediately
                const audioPromise = generateSpeech(sentence, state.selectedCharacter.voiceStyle)
                    .catch(e => {
                        console.error("TTS Gen Error:", e);
                        return null;
                    });

                // Add playback task
                audioQueueRef.current.push(async () => {
                    const blob = await audioPromise;
                    if (blob) {
                        // Pass animation intent to player
                        // @ts-ignore - Updated handshake
                        await options.onPlayAudio(blob, animation);
                    }
                });

                processAudioQueue();
            };

            // 3. Call LLM with Streaming
            await sendMessageToOllama(fullPrompt, undefined, (token) => {
                fullResponse += token;
                pendingSpeechText += token;

                // Live UI Update
                actions.updateLastMessage(fullResponse);

                if (shouldSpeak) {
                    // Detect sentence completion
                    // regex looks for [.!?] followed by space or newline
                    const match = pendingSpeechText.match(/[.!?]+[\s\n]+|[\n]+/);
                    if (match && match.index !== undefined) {
                        const endIdx = match.index + match[0].length;
                        const sentence = pendingSpeechText.substring(0, endIdx).trim();

                        // Basic filtering to avoid stuttering on "A.I." or "Mr."
                        // This can be improved with advanced NLP but simple length check helps
                        if (sentence.length > 0) {
                            queueSentence(sentence);
                            pendingSpeechText = pendingSpeechText.substring(endIdx);
                        }
                    }
                }
            });

            // 4. Handle Remainder
            if (shouldSpeak && pendingSpeechText.trim().length > 0) {
                queueSentence(pendingSpeechText.trim());
            }

            // Final Update ensures clean state
            actions.updateLastMessage(fullResponse);

        } catch (e) {
            console.error("[useAssistant] Chat error", e);
            actions.addMessage({ role: 'assistant', content: "Error: Could not process request." });
        } finally {
            actions.setChatProcessing(false);
            actions.setTranscript("");
        }
    };

    return { processInput };
}
