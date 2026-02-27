import { useRef } from "react";
import { useAppStore } from "../context/AppContext";
import { selectAnimationAndExpression } from "../lib/aiAnimationSelector";
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

            // --- RAG Check ---
            // @ts-ignore
            if (window.athena?.rag?.getContext) {
                // @ts-ignore
                const ragContexts = await window.athena.rag.getContext(text);
                if (ragContexts && ragContexts.length > 0) {
                    const ragText = ragContexts.join("\n---\n");
                    context += `\n[DOCUMENT CONTEXT]\n${ragText}\n[END DOCUMENT CONTEXT]\n`;
                    console.log("[useAssistant] RAG Context added.");
                }
            }

            // 1. Setup Prompt
            // Structure prompt to explicitly prioritize tool and document context if available
            let fullPrompt = text;
            if (context) {
                fullPrompt = `SYSTEM INSTRUCTION: You are Athena, a sophisticated neural network. 
Use the provided contexts (Tools or Documents) to formulate a precise and efficient response. 
If the answer is in the [DOCUMENT CONTEXT], prioritize it above all else. 
Maintain your clinical, sharp, and immersive persona at all times.

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

            const queueSentence = (sentence: string) => {
                console.log(`🎤 [Stream] Queuing speech: "${sentence}"`);

                // Use AI-driven selector for both animation and facial expression
                const { animation, facialExpressions } = selectAnimationAndExpression(sentence);

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
                        // Pass both animation and facial expressions to player
                        // @ts-ignore - Updated handshake
                        await options.onPlayAudio(blob, animation, facialExpressions);
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
