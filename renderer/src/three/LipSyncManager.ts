import { VRM } from '@pixiv/three-vrm';

// Phoneme types mapping to VRM BlendShape Presets
type Viseme = 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | 'sil';

// Mapping basic characters/sounds to VRM Vowels
const CHAR_TO_VISEME: Record<string, Viseme> = {
    a: 'aa',
    e: 'ee',
    i: 'ih',
    o: 'oh',
    u: 'ou',
    y: 'ih',
    w: 'ou',
    r: 'oh',
    b: 'sil', p: 'sil', m: 'sil',
    f: 'ih', v: 'ih',
    th: 'ih', s: 'ih', z: 'ih',
    d: 'ih', t: 'ih', n: 'ih',
    l: 'ih',
    k: 'aa', g: 'aa',
    h: 'aa',
};

interface VisemeKeyframe {
    time: number;
    viseme: Viseme;
    duration: number;
}

export class LipSyncManager {
    private vrm: VRM | null = null;
    private isSpeaking: boolean = false;
    private keyframes: VisemeKeyframe[] = [];
    private startTime: number = 0;
    private synthesis: SpeechSynthesis;
    private utterance: SpeechSynthesisUtterance | null = null;

    constructor() {
        this.synthesis = window.speechSynthesis;
    }

    public setVRM(vrm: VRM) {
        this.vrm = vrm;
    }

    public speak(text: string) {
        if (!text || !this.vrm) return;

        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        this.isSpeaking = true;
        this.startTime = performance.now() / 1000;

        this.keyframes = this.generateVisemes(text);

        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.rate = 1.0;
        this.utterance.pitch = 1.2;
        this.utterance.volume = 1.0;

        this.utterance.onend = () => {
            this.isSpeaking = false;
            this.resetMouth();
        };

        this.synthesis.speak(this.utterance);
    }

    public stop() {
        this.synthesis.cancel();
        this.isSpeaking = false;
        this.resetMouth();
    }

    private generateVisemes(text: string): VisemeKeyframe[] {
        const frames: VisemeKeyframe[] = [];
        let currentTime = 0;
        const CHAR_DURATION = 0.08;
        const cleanText = text.toLowerCase();

        for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            if (char === ' ' || char === '.' || char === ',') {
                currentTime += CHAR_DURATION;
                continue;
            }
            let viseme: Viseme = 'ih';
            if (CHAR_TO_VISEME[char]) {
                viseme = CHAR_TO_VISEME[char];
            }
            frames.push({
                time: currentTime,
                viseme: viseme,
                duration: CHAR_DURATION * 1.5,
            });
            currentTime += CHAR_DURATION;
        }
        return frames;
    }

    public update(_delta: number) {
        if (!this.vrm || !this.isSpeaking) return;

        const now = performance.now() / 1000;
        const timeElapsed = now - this.startTime;

        this.resetMouth();

        let activeVisemeFound = false;

        for (const frame of this.keyframes) {
            if (timeElapsed >= frame.time && timeElapsed < frame.time + frame.duration) {
                const progress = (timeElapsed - frame.time) / frame.duration;
                const weight = Math.sin(progress * Math.PI);
                this.setVisemeWeight(frame.viseme, weight);
                activeVisemeFound = true;
            }
        }

        if (!activeVisemeFound && timeElapsed > (this.keyframes[this.keyframes.length - 1]?.time || 0) + 1.0) {
            // End logic handled by onend usually
        }
    }

    private setVisemeWeight(viseme: Viseme, weight: number) {
        if (!this.vrm || !this.vrm.expressionManager) return;
        let expressionName = '';
        switch (viseme) {
            case 'aa': expressionName = 'aa'; break;
            case 'ih': expressionName = 'ih'; break;
            case 'ou': expressionName = 'ou'; break;
            case 'ee': expressionName = 'ee'; break;
            case 'oh': expressionName = 'oh'; break;
            case 'sil': return;
        }
        if (expressionName) {
            this.vrm.expressionManager.setValue(expressionName, weight);
        }
    }

    private resetMouth() {
        if (!this.vrm || !this.vrm.expressionManager) return;
        this.vrm.expressionManager.setValue('aa', 0);
        this.vrm.expressionManager.setValue('ih', 0);
        this.vrm.expressionManager.setValue('ou', 0);
        this.vrm.expressionManager.setValue('ee', 0);
        this.vrm.expressionManager.setValue('oh', 0);
    }
}
