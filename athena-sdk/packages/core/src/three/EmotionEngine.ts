import { VRM } from '@pixiv/three-vrm';

export type VRMEmotion = 'neutral' | 'happy' | 'sorrow' | 'angry' | 'surprised' | 'relaxed';

export class EmotionEngine {
  private vrm: VRM | null = null;
  private currentEmotion: VRMEmotion = 'neutral';
  private targetWeight = 0;
  private currentWeight = 0;

  setVRM(vrm: VRM) {
    this.vrm = vrm;
  }

  detectEmotionFromText(text: string): VRMEmotion {
    const lower = text.toLowerCase();
    if (/happy|great|awesome|wonderful|yay|haha|smile|delighted|enjoy/.test(lower)) {
      return 'happy';
    }
    if (/sorry|sad|unfortunate|apologies|miss|grief|regret/.test(lower)) {
      return 'sorrow';
    }
    if (/frustrated|angry|annoyed|terrible|wrong|error|bad/.test(lower)) {
      return 'angry';
    }
    if (/wow|amazing|incredible|surprise|unbelievable|astonishing/.test(lower)) {
      return 'surprised';
    }
    if (/relax|calm|peace|chill|easy|comfort/.test(lower)) {
      return 'relaxed';
    }
    return 'neutral';
  }

  setEmotion(emotion: VRMEmotion, weight = 1.0) {
    this.currentEmotion = emotion;
    this.targetWeight = weight;
  }

  update(delta: number) {
    if (!this.vrm || !this.vrm.expressionManager) return;

    // Smooth lerp to target emotion weight
    this.currentWeight += (this.targetWeight - this.currentWeight) * Math.min(delta * 5.0, 1.0);

    // Reset standard emotion expression weights
    const emotions: VRMEmotion[] = ['happy', 'sorrow', 'angry', 'surprised', 'relaxed'];
    for (const em of emotions) {
      if (em === this.currentEmotion) {
        this.vrm.expressionManager.setValue(em, this.currentWeight);
      } else {
        const val = this.vrm.expressionManager.getValue(em) || 0;
        if (val > 0.001) {
          this.vrm.expressionManager.setValue(em, val * (1 - Math.min(delta * 5.0, 1.0)));
        }
      }
    }
  }
}
