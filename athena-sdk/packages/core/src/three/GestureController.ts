import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

export class GestureController {
  private vrm: VRM | null = null;
  private blinkTimer = 0;
  private blinkInterval = 4.0;
  private isBlinking = false;
  private blinkProgress = 0;
  private time = 0;

  setVRM(vrm: VRM) {
    this.vrm = vrm;
  }

  update(delta: number) {
    if (!this.vrm) return;

    this.time += delta;

    // 1. Natural Eye Blink Automation
    this.blinkTimer += delta;
    if (this.blinkTimer >= this.blinkInterval) {
      this.isBlinking = true;
      this.blinkTimer = 0;
      this.blinkInterval = 2.5 + Math.random() * 4.0;
    }

    if (this.isBlinking) {
      this.blinkProgress += delta * 10.0;
      const blinkValue = Math.sin(Math.min(this.blinkProgress, Math.PI));
      if (this.vrm.expressionManager) {
        this.vrm.expressionManager.setValue('blink', blinkValue);
      }
      if (this.blinkProgress >= Math.PI) {
        this.isBlinking = false;
        this.blinkProgress = 0;
        if (this.vrm.expressionManager) {
          this.vrm.expressionManager.setValue('blink', 0);
        }
      }
    }

    // 2. Procedural Breathing & Subtle Head Sway
    const neckNode = this.vrm.humanoid?.getNormalizedBoneNode('neck');
    const headNode = this.vrm.humanoid?.getNormalizedBoneNode('head');
    const spineNode = this.vrm.humanoid?.getNormalizedBoneNode('spine');

    if (neckNode) {
      neckNode.rotation.y = Math.sin(this.time * 0.8) * 0.02;
    }
    if (headNode) {
      headNode.rotation.z = Math.cos(this.time * 0.6) * 0.015;
    }
    if (spineNode) {
      spineNode.rotation.x = Math.sin(this.time * 1.5) * 0.01;
    }
  }
}
