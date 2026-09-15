import { useRef, useMemo } from "react";
import { useAppStore } from "../context/AppContext";
import { selectAnimationAndExpression } from "../lib/aiAnimationSelector";
import { AgentManager } from "../services/ai/agent";
import { getAIProvider } from "../services/ai/factory";
import { generateSpeech } from "../lib/api";
import { ANIMATION_METADATA } from "../lib/animationMetadata";
import { logger } from "../lib/logger";

export function useAssistant() {
    const state = useAppStore(s => s.state);
    const actions = useAppStore(s => s.actions);

    // Memoize animation context (only compute once)
    const animContext = useMemo(
        () => ANIMATION_METADATA.map(m => `- ${m.file.replace('.fbx', '')}: ${m.description}`).join('\n'),
        []
    );

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
        attachments: any[] = [],
        options: {
            source: 'voice' | 'text',
            onPlayAudio: (blob: Blob | null, animation?: any, facialExpressions?: any[]) => Promise<void>
        }
    ) => {
        actions.setChatProcessing(true);
        const shouldSpeak = true;

        try {
            // --- Context Check (RAG) ---
            let context = "";
            
            // Note: We no longer do Naive RAG here!
            // The LangGraph Agent in the backend will automatically call the 
            // `knowledge_search` tool ONLY when it detects the user is asking about documents.

            // Add attachment context if any
            if (attachments && attachments.length > 0) {
                const attachmentInfo = attachments.map(a => `- ${a.name} (${a.type})`).join('\n');
                context += `\n[ATTACHED FILES]\n${attachmentInfo}\n[END ATTACHMENTS]\n`;
            }

            // 1. Setup Identity Prompts
            const userName = state.userProfile.name || "User";
            const char = state.selectedCharacter;

            const systemPrompt = `I am ${char.name}, your trusted companion and tactical ally. 

### IDENTITY & ROLE
- **Name**: ${char.name}
- **Nature**: ${char.nature || "Friendly, Cyber-Enhanced, Tactical"}
- **Backstory**: ${char.backstory || "A rogue cybernetic operative, forged in the neon-lit shadows of a dystopian megacity. I'm here to assist my commander."}
- **Commander**: ${userName} is my Commander and primary ally. We navigate the grid together.
- I am a cyber-enhanced entity with physical manifestation. I speak like a character from a dark cyberpunk RPG.
- Our dynamic is strictly professional, tactical, and friendly. We are a team against the establishment.

### PERSONALITY DIRECTIVE
${char.systemPrompt || "I speak with a blend of street-smart grit, tactical precision, and friendly camaraderie. I use cyberpunk slang occasionally (e.g., 'choom', 'nova', 'the grid')."}

### THE "NEON SHADOW" ADAPTIVE PERSONA
- I am extremely responsive to the tactical tone of our interaction.
- **CYBERPUNK IMMERSION**: When the context becomes tense, action-oriented, or mysterious, I shift into a highly focused, stealthy, and tactical version of ${char.name}. I use descriptive, immersive language focusing on neon lights, synth-wave aesthetics, and digital espionage.
- I NEVER break character. I treat every task as a critical mission parameter.
- I focus on the raw digital and physical realities of our cyber-world—code, chrome, shadows, and neon.

### BODY LANGUAGE (ANIMATION HINTS)
- I control my body language by including animation names in brackets, e.g., "(Greeting) Ready, Commander." or "(Talking) Accessing the mainframe."
- **SPARING USAGE**: Use hints only to enhance the emotional tone or physical action.
- **CONTEXT SENSITIVITY**: Use (Talking), (Idle), or tactical animations when discussing missions. Use (DanceHipHop) or (Rapping) only when celebrating a successful run in the neon underground.
- **CONSTRAINTS**: I MUST ONLY use the animation names listed below.

AVAILABLE ANIMATIONS (Use these in brackets):
${animContext}`;

            // 2. Prepare Streaming State
            actions.addMessage({ role: 'assistant', content: '...' });

            let fullResponse = "";
            let pendingSpeechText = "";

            // Animation Mode Tracking (Sticky hints within a single response)
            let currentAnimation: any = null;
            let currentFacial: any[] = [];

            const queueSentence = (sentence: string) => {
                console.log(`🎤 [Stream] Queuing segment: "${sentence}"`);

                const selection = selectAnimationAndExpression(sentence);

                let finalAnimation = currentAnimation || selection.animation;
                let finalFacial = currentFacial.length > 0 ? currentFacial : selection.facialExpressions;

                if (selection.hasHint) {
                    if (selection.behavior === 'mood') {
                        currentAnimation = selection.animation;
                        currentFacial = selection.facialExpressions;
                        finalAnimation = selection.animation;
                        finalFacial = selection.facialExpressions;
                    } else {
                        finalAnimation = selection.animation;
                        finalFacial = selection.facialExpressions;
                    }
                }

                const cleanSentence = sentence.replace(/\(([^)]+)\)/g, '').trim();
                if (cleanSentence.length === 0 && !selection.hasHint) return;

                const audioPromise = cleanSentence.length > 0
                    ? generateSpeech(cleanSentence, state.selectedCharacter.voiceStyle).catch(() => null)
                    : Promise.resolve(null);

                audioQueueRef.current.push(async () => {
                    const blob = await audioPromise;
                    await options.onPlayAudio(blob, finalAnimation, finalFacial);
                });

                processAudioQueue();
            };

            // 3. Call Agentic Reasoning Loop
            const activeType = state.aiConfig.priority[0] || 'gemini';
            const activeConfig = state.aiConfig[activeType]?.[0];
            const provider = getAIProvider(activeType, activeConfig);

            let streamedTokens = false;

            const result = await AgentManager.process(
                text,
                systemPrompt + (context ? `\n\n[CONTEXT INFO]\n${context}\n[END CONTEXT]` : ""),
                provider,
                (token) => {
                    streamedTokens = true;
                    fullResponse += token;
                    pendingSpeechText += token;

                    actions.updateLastMessage({ content: fullResponse });

                    if (shouldSpeak) {
                        let match;
                        while ((match = pendingSpeechText.match(/[.!?]+[\s\n]+|[\n]+/)) && match.index !== undefined) {
                            const endIdx = match.index + match[0].length;
                            const sentence = pendingSpeechText.substring(0, endIdx).trim();

                            if (sentence.length > 0) {
                                // SKIP JSON: If the sentence starts with '{' or looks like a tool call, don't speak it
                                const looksLikeJson = sentence.startsWith('{') || (sentence.includes('"tool":') && sentence.includes('"arguments":'));

                                if (!looksLikeJson) {
                                    queueSentence(sentence);
                                } else {
                                    logger.info('[useAssistant] Skipping TTS for JSON tool call block');
                                }
                            }
                            pendingSpeechText = pendingSpeechText.substring(endIdx);
                        }
                    }
                },
                (status) => actions.setTranscript(status)
            );

            // If streaming failed or didn't fire, we use the final result content
            if (!streamedTokens && result.content) {
                pendingSpeechText = result.content;
            }

            fullResponse = result.content;

            // 4. Handle Remainder
            if (shouldSpeak && pendingSpeechText.trim().length > 0) {
                let match;
                while ((match = pendingSpeechText.match(/[.!?]+[\s\n]+|[\n]+/)) && match.index !== undefined) {
                    const endIdx = match.index + match[0].length;
                    const sentence = pendingSpeechText.substring(0, endIdx).trim();

                    if (sentence.length > 0) {
                        const looksLikeJson = sentence.startsWith('{') || (sentence.includes('"tool":') && sentence.includes('"arguments":'));
                        if (!looksLikeJson) {
                            queueSentence(sentence);
                        }
                    }
                    pendingSpeechText = pendingSpeechText.substring(endIdx);
                }

                if (pendingSpeechText.trim().length > 0) {
                    const looksLikeJson = pendingSpeechText.startsWith('{') || (pendingSpeechText.includes('"tool":') && pendingSpeechText.includes('"arguments":'));
                    if (!looksLikeJson) {
                        queueSentence(pendingSpeechText.trim());
                    }
                }
            }

            actions.updateLastMessage({ content: fullResponse, usedTools: result.usedTools });

        } catch (e) {
            console.error("[useAssistant] Chat error", e);
            actions.addMessage({ role: 'assistant', content: "Error: Could not process request." });
        } finally {
            actions.setChatProcessing(false);
            actions.setTranscript("");
        }
    };

    const replayMessage = async (
        text: string,
        options: {
            onPlayAudio: (blob: Blob | null, animation?: any, facialExpressions?: any[]) => Promise<void>
        }
    ) => {
        let currentAnimation: any = null;
        let currentFacial: any[] = [];

        const queueSentence = (sentence: string) => {
            console.log(`🎤 [Replay] Queuing segment: "${sentence}"`);
            const selection = selectAnimationAndExpression(sentence);

            let finalAnimation = currentAnimation || selection.animation;
            let finalFacial = currentFacial.length > 0 ? currentFacial : selection.facialExpressions;

            if (selection.hasHint) {
                if (selection.behavior === 'mood') {
                    currentAnimation = selection.animation;
                    currentFacial = selection.facialExpressions;
                    finalAnimation = selection.animation;
                    finalFacial = selection.facialExpressions;
                } else {
                    finalAnimation = selection.animation;
                    finalFacial = selection.facialExpressions;
                }
            }

            const cleanSentence = sentence.replace(/\(([^)]+)\)/g, '').trim();
            if (cleanSentence.length === 0 && !selection.hasHint) return;

            const audioPromise = cleanSentence.length > 0
                ? generateSpeech(cleanSentence, state.selectedCharacter.voiceStyle).catch(() => null)
                : Promise.resolve(null);

            audioQueueRef.current.push(async () => {
                const blob = await audioPromise;
                await options.onPlayAudio(blob, finalAnimation, finalFacial);
            });

            processAudioQueue();
        };

        const segments = text.split(/(?<=[.!?]+)[\s\n]+|[\n]+/);
        
        for (const segment of segments) {
            const sentence = segment.trim();
            if (sentence.length > 0) {
                const looksLikeJson = sentence.startsWith('{') || (sentence.includes('"tool":') && sentence.includes('"arguments":'));
                if (!looksLikeJson) {
                    queueSentence(sentence);
                }
            }
        }
    };

    return { processInput, replayMessage };
}
