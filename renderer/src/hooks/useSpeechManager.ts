import { useEffect, useRef, useCallback } from "react";
import { SpeechRecognitionManager } from "../lib/SpeechRecognition";
import { useAppStore } from "../context/AppContext";

export function useSpeechManager(onSpeechResult: (text: string) => void) {
    const state = useAppStore(s => s.state);
    const actions = useAppStore(s => s.actions);
    const speechManagerRef = useRef<SpeechRecognitionManager | null>(null);

    // Initialize Manager
    useEffect(() => {
        speechManagerRef.current = new SpeechRecognitionManager();
        return () => {
            speechManagerRef.current?.stop();
        }
    }, []);

    // Toggle Logic
    const toggleListening = useCallback(() => {
        if (state.isListening) {
            speechManagerRef.current?.stop();
            actions.toggleListening();
            actions.setVoiceStatus("idle");
        } else {
            actions.toggleListening();
            actions.setVoiceStatus("listening");
            speechManagerRef.current?.start({
                onResult: onSpeechResult,
                onStatusChange: (s) => actions.setVoiceStatus(s as any),
                onError: (e) => console.error(e)
            });
        }
    }, [state.isListening, actions, onSpeechResult]);

    return {
        speechManager: speechManagerRef.current,
        toggleListening
    };
}
