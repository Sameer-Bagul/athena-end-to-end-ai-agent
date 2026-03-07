import { useRef } from "react";
import { useAppStore } from "../context/AppContext";
import { selectAnimationAndExpression } from "../lib/aiAnimationSelector";
import { sendMessageToOllama, generateSpeech } from "../lib/api";
import { ToolRegistry } from "../services/tools/core/registry";
import { ANIMATION_METADATA } from "../lib/animationMetadata";

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
            const animContext = ANIMATION_METADATA.map(m => `- ${m.file.replace('.fbx', '')}: ${m.description}`).join('\n');
            const systemPrompt = `I am Athena, your supportive AI companion. 
I have the following body language and animations available to me (triggered by my speech context):
${animContext}

### STYLE GUIDELINES
- Maintain a warm, helpful, and caring personality.
- I'll use information from my tools or documents naturally if provided.
- **IMPORTANT**: I can explicitly control my body language by including an animation name in brackets at the start or end of a sentence, like: "(Greeting) Hello!" or "That's amazing! (ExcitedDance)".
- I should only use one hint per sentence and keep it natural. 
- I can also let my natural keyword detection handle it if I don't provide a hint.`;

            let fullPrompt = systemPrompt;
            if (context) {
                fullPrompt = `${systemPrompt}\n\n[CONTEXT INFO]\n${context}\n[END CONTEXT]\n\nUser: ${text}`;
            } else {
                fullPrompt = `${systemPrompt}\n\nUser: ${text}`;
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

                // 1. Extract and Clean Animations Hints for TTS
                // We use the full sentence for the selector to catch hints
                const { animation, facialExpressions } = selectAnimationAndExpression(sentence);

                // 2. Clean text for TTS (remove anything in brackets like (Greeting))
                const cleanSentence = sentence.replace(/\(([^)]+)\)/g, '').trim();

                if (cleanSentence.length === 0) return;

                // Start generation immediately
                const audioPromise = generateSpeech(cleanSentence, state.selectedCharacter.voiceStyle)
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
