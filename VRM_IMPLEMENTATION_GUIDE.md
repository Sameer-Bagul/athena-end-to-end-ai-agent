# VRM Implementation Guide
## Complete Guide to Using VRM Models with FBX Animations, Facial Expressions & Lip-Sync

> A comprehensive guide for implementing VRM (Virtual Reality Model) avatars in web applications with full animation, facial expression, and lip-sync support.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Technologies](#core-technologies)
3. [VRM Loading Pipeline](#vrm-loading-pipeline)
4. [FBX Animation Retargeting](#fbx-animation-retargeting)
5. [Facial Expression System](#facial-expression-system)
6. [Lip-Sync Implementation](#lip-sync-implementation)
7. [Natural Presence Features](#natural-presence-features)
8. [Complete Code Examples](#complete-code-examples)
9. [Project Structure](#project-structure)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide demonstrates how to create interactive 3D avatar experiences using VRM models with:
- **VRM Loading**: Load and normalize VRM models
- **FBX Animation Retargeting**: Use Mixamo animations with any VRM model
- **Facial Expressions**: Control blendshapes for emotions
- **Lip-Sync**: Real-time audio-driven mouth movements
- **Natural Behaviors**: Blinking, idle movements, head tracking

### What is VRM?

VRM is an open file format for 3D avatars based on glTF 2.0. It's specifically designed for character models with humanoid rigs, expressions, and spring physics.

**Key Features:**
- Standardized humanoid bone structure
- Facial expression blendshapes (morph targets)
- Spring bone physics (hair, clothes)
- First-person camera settings
- Material/shader settings

---

## Core Technologies

### Required Libraries

```json
{
  "dependencies": {
    "three": "^0.182.0",                    // 3D graphics engine
    "@pixiv/three-vrm": "^3.4.4",          // VRM loader for Three.js
    "@pixiv/three-vrm-animation": "^3.4.4", // VRM animation utilities
    "vrm-mixamo-retarget": "^1.0.3",       // Mixamo to VRM bone mapping
    "@mediapipe/tasks-vision": "^0.10.22"   // Face tracking (optional)
  }
}
```

### Essential Three.js Loaders

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
```

---

## VRM Loading Pipeline

### 1. VRM Loader Service

Create a service to handle VRM loading and normalization:

```typescript
// VRMLoader.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

export interface VRMLoadResult {
  vrm: VRM;
  scene: THREE.Group;
}

export class VRMLoaderService {
  private gltfLoader: GLTFLoader;

  constructor() {
    // Initialize GLTF loader with VRM plugin
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.register((parser) => new VRMLoaderPlugin(parser));
  }

  /**
   * Load a VRM model from the given path
   */
  public async load(path: string): Promise<VRMLoadResult> {
    console.log('🔵 [VRMLoader] Starting to load VRM from:', path);
    
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          console.log('🟢 [VRMLoader] GLTF loaded successfully');
          const vrm = gltf.userData.vrm as VRM;

          if (!vrm) {
            reject(new Error('VRM data not found in loaded file'));
            return;
          }

          // Normalize the VRM for proper display
          this.normalizeVRM(vrm);

          console.log('🟢 [VRMLoader] VRM normalized and ready');
          resolve({
            vrm,
            scene: vrm.scene,
          });
        },
        (progress) => {
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(`Loading VRM: ${percentComplete.toFixed(2)}%`);
        },
        (error) => {
          reject(new Error(`Failed to load VRM: ${error.message}`));
        }
      );
    });
  }

  /**
   * Normalize VRM for proper display
   */
  private normalizeVRM(vrm: VRM): void {
    // Use VRMUtils to remove unnecessary nodes
    VRMUtils.removeUnnecessaryVertices(vrm.scene);
    VRMUtils.removeUnnecessaryJoints(vrm.scene);

    // Disable frustum culling to prevent avatar parts from disappearing
    vrm.scene.traverse((obj) => {
      obj.frustumCulled = false;
    });

    // Position the VRM at origin
    const bbox = new THREE.Box3().setFromObject(vrm.scene);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    console.log('🔍 [VRMLoader] VRM Bounding Box:', {
      size,
      min: bbox.min,
      max: bbox.max
    });
    
    // Position so the model's feet are at Y=0
    vrm.scene.position.set(0, -bbox.min.y, 0);

    // VRM models typically face +Z, rotate to face camera (-Z)
    vrm.scene.rotation.y = Math.PI;

    // Scale adjustment (most VRMs are in meters, ~1.6-1.8m tall)
    vrm.scene.scale.setScalar(1.0);
  }

  /**
   * Get the humanoid bone structure from VRM
   */
  public getHumanoid(vrm: VRM) {
    return vrm.humanoid;
  }

  /**
   * Get specific bone from VRM humanoid
   */
  public getBone(vrm: VRM, boneName: string): THREE.Object3D | null {
    try {
      const bone = vrm.humanoid.getNormalizedBoneNode(boneName as any);
      return bone || null;
    } catch {
      return null;
    }
  }

  /**
   * Update VRM (called each frame)
   * Required for VRM's internal updates (springs, constraints, etc.)
   */
  public update(vrm: VRM, delta: number): void {
    vrm.update(delta);
  }
}
```

### 2. Usage Example

```typescript
// In your React component or scene setup
const vrmLoader = new VRMLoaderService();

async function loadAvatar() {
  const { vrm, scene } = await vrmLoader.load('/models/avatar.vrm');
  
  // Add to Three.js scene
  threeScene.add(scene);
  
  // In render loop
  function animate() {
    const delta = clock.getDelta();
    vrmLoader.update(vrm, delta);
    renderer.render(threeScene, camera);
    requestAnimationFrame(animate);
  }
}
```

---

## FBX Animation Retargeting

### The Problem: Mixamo → VRM Bone Mapping

Mixamo animations use a different bone naming convention than VRM. We need to retarget the animations.

**Mixamo Bones** → **VRM Humanoid Bones**

```
mixamorigHips       → hips
mixamorigSpine      → spine
mixamorigLeftArm    → leftUpperArm
mixamorigLeftForeArm → leftLowerArm
...
```

### 1. Bone Mapping File

```typescript
// mixamo-retargeting.ts
import { VRM } from "@pixiv/three-vrm";
import * as THREE from "three";

export const mixamoVRMRigMap: { [key: string]: string } = {
  "mixamorigHips": "hips",
  "mixamorigSpine": "spine",
  "mixamorigSpine1": "chest",
  "mixamorigSpine2": "upperChest",
  "mixamorigNeck": "neck",
  "mixamorigHead": "head",
  "mixamorigLeftShoulder": "leftShoulder",
  "mixamorigLeftArm": "leftUpperArm",
  "mixamorigLeftForeArm": "leftLowerArm",
  "mixamorigLeftHand": "leftHand",
  "mixamorigRightShoulder": "rightShoulder",
  "mixamorigRightArm": "rightUpperArm",
  "mixamorigRightForeArm": "rightLowerArm",
  "mixamorigRightHand": "rightHand",
  "mixamorigLeftUpLeg": "leftUpperLeg",
  "mixamorigLeftLeg": "leftLowerLeg",
  "mixamorigLeftFoot": "leftFoot",
  "mixamorigLeftToeBase": "leftToes",
  "mixamorigRightUpLeg": "rightUpperLeg",
  "mixamorigRightLeg": "rightLowerLeg",
  "mixamorigRightFoot": "rightFoot",
  "mixamorigRightToeBase": "rightToes",
  // Add finger bones as needed
};

/**
 * Retargets a Mixamo animation clip to a VRM instance
 */
export function retargetMixamoClip(vrm: VRM, clip: THREE.AnimationClip): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];

  clip.tracks.forEach((track) => {
    const trackSplits = track.name.split('.');
    const mixamoBoneName = trackSplits[0];
    const propertyName = trackSplits[1];

    const vrmBoneName = mixamoVRMRigMap[mixamoBoneName];

    if (vrmBoneName) {
      const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName as any);

      if (vrmNode) {
        const vrmNodeName = vrmNode.name;

        // Only retarget rotation (quaternion)
        // Skip position to prevent root motion issues
        if (propertyName === 'quaternion') {
          const newTrack = track.clone();
          newTrack.name = `${vrmNodeName}.quaternion`;
          tracks.push(newTrack);
        }
      }
    }
  });

  return new THREE.AnimationClip('vrmAnimation', clip.duration, tracks);
}
```

### 2. Animation Manager

```typescript
// AnimationManager.ts
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM } from '@pixiv/three-vrm';
import { retargetAnimation } from 'vrm-mixamo-retarget'; // OR use custom retargetMixamoClip

export class AnimationManager {
  private mixer: THREE.AnimationMixer | null = null;
  private vrm: VRM | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  private readonly CROSSFADE_DURATION = 0.5; // seconds

  /**
   * Initialize with a VRM model
   */
  public initialize(vrm: VRM): void {
    this.vrm = vrm;
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    console.log('🎭 Animation mixer created');
  }

  /**
   * Load and retarget FBX animation
   */
  public async loadAnimationFromUrl(url: string): Promise<void> {
    if (!this.vrm || !this.mixer) {
      throw new Error('AnimationManager not initialized');
    }

    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      
      loader.load(url, (fbxGroup) => {
        console.log(`✅ Loaded FBX: ${url}`);

        // Ensure VRM is at origin
        this.vrm!.scene.position.set(0, 0, 0);

        // Retarget animation using library
        let clip: THREE.AnimationClip | null = null;
        try {
          clip = retargetAnimation(fbxGroup, this.vrm!);
        } catch (e) {
          console.error("Retargeting failed", e);
          reject(e);
          return;
        }

        if (!clip) {
          reject(new Error("Failed to retarget FBX animation"));
          return;
        }

        // Create animation action
        const clipAction = this.mixer!.clipAction(clip);
        clipAction.setLoop(THREE.LoopRepeat, Infinity);

        // Crossfade from previous animation
        if (this.currentAction) {
          this.currentAction.fadeOut(this.CROSSFADE_DURATION);
        }

        clipAction
          .reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(this.CROSSFADE_DURATION)
          .play();

        this.currentAction = clipAction;
        resolve();
      }, undefined, (e) => {
        reject(e);
      });
    });
  }

  /**
   * Update animation mixer (call every frame)
   */
  public update(delta: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}
```

### 3. Usage Example

```typescript
const animationManager = new AnimationManager();

// Initialize with VRM
animationManager.initialize(vrm);

// Load a Mixamo animation
await animationManager.loadAnimationFromUrl('/animations/walking.fbx');

// In render loop
function animate() {
  const delta = clock.getDelta();
  animationManager.update(delta);
}
```

---

## Facial Expression System

### Understanding VRM Expressions

VRM models use **blendshapes** (morph targets) for facial expressions. Common expression names:

- `Joy`, `Angry`, `Sad`, `Surprised`, `Relaxed`
- `Blink`, `BlinkLeft`, `BlinkRight`
- `aa`, `ih`, `ou`, `ee`, `oh` (vowel shapes for lip-sync)
- `LookUp`, `LookDown`, `LookLeft`, `LookRight`

### 1. Expression Controller

```typescript
export interface FacialExpression {
  name: string;    // e.g., 'Joy', 'Angry'
  value: number;   // 0.0 - 1.0
  duration?: number; // Optional auto-reset duration (ms)
}

export class ExpressionManager {
  private vrm: VRM | null = null;

  public setVRM(vrm: VRM): void {
    this.vrm = vrm;
  }

  /**
   * Set a facial expression value
   */
  public setExpression(name: string, value: number): void {
    if (!this.vrm || !this.vrm.expressionManager) return;
    
    // Clamp value between 0 and 1
    const clampedValue = Math.max(0, Math.min(1, value));
    this.vrm.expressionManager.setValue(name, clampedValue);
    
    console.log(`Set ${name} = ${clampedValue}`);
  }

  /**
   * Set multiple expressions at once
   */
  public setExpressions(expressions: FacialExpression[]): void {
    expressions.forEach((expr) => {
      this.setExpression(expr.name, expr.value);
      
      // Auto-reset if duration specified
      if (expr.duration) {
        setTimeout(() => {
          this.setExpression(expr.name, 0);
        }, expr.duration);
      }
    });
  }

  /**
   * Reset all expressions to neutral
   */
  public reset(): void {
    if (!this.vrm || !this.vrm.expressionManager) return;
    
    const commonExpressions = [
      'Joy', 'Angry', 'Sad', 'Surprised', 'Relaxed',
      'Blink', 'BlinkLeft', 'BlinkRight',
      'aa', 'ih', 'ou', 'ee', 'oh'
    ];
    
    commonExpressions.forEach(name => {
      this.vrm!.expressionManager!.setValue(name, 0);
    });
  }

  /**
   * Trigger emotion with automatic reset
   */
  public triggerEmotion(emotion: string, intensity: number = 1.0, duration: number = 2000): void {
    this.setExpression(emotion, intensity);
    
    setTimeout(() => {
      this.setExpression(emotion, 0);
    }, duration);
  }
}
```

### 2. Animation-Facial Expression Mapping

Map animations to their appropriate facial expressions:

```typescript
// facialMapping.ts
export type AnimationFacialMap = {
  [animationFile: string]: FacialExpression[];
};

export const animationFacialMap: AnimationFacialMap = {
  'talking.fbx': [
    { name: 'Joy', value: 0.7 },
    { name: 'Blink', value: 1.0, duration: 300 },
  ],
  'jump.fbx': [
    { name: 'Surprised', value: 1.0 },
  ],
  'defeated.fbx': [
    { name: 'Sad', value: 1.0 },
  ],
  'victory.fbx': [
    { name: 'Joy', value: 1.0 },
  ],
  'angry.fbx': [
    { name: 'Angry', value: 1.0 },
  ],
};
```

### 3. Usage with Animations

```typescript
// When playing an animation, also trigger facial expressions
async function playAnimationWithExpression(animationFile: string) {
  // Load and play animation
  await animationManager.loadAnimationFromUrl(`/animations/${animationFile}`);
  
  // Get mapped facial expressions
  const expressions = animationFacialMap[animationFile];
  
  if (expressions && expressionManager) {
    expressionManager.setExpressions(expressions);
  }
}
```

---

## Lip-Sync Implementation

Real-time lip synchronization using audio frequency analysis.

### 1. Lip-Sync Manager

```typescript
// LipSyncManager.ts
import { VRM } from '@pixiv/three-vrm';

export class LipSyncManager {
  private vrm: VRM | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;
  private dataArray: Uint8Array | null = null;

  // Vowel shape weights (smoothed)
  private currentVowelWeights = {
    aa: 0,  // Open mouth
    ih: 0,  // Wide mouth
    ou: 0,  // Rounded mouth
    ee: 0,  // Teeth showing
    oh: 0   // Open rounded
  };

  private readonly SMOOTHING_FACTOR = 0.4;
  private readonly SENSITIVITY = 1.0;

  public setVRM(vrm: VRM): void {
    this.vrm = vrm;
  }

  /**
   * Play audio with lip-sync
   */
  public async playAudio(audioBlob: Blob, isMuted: boolean = false): Promise<void> {
    if (!this.vrm) return;

    // Initialize AudioContext
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Stop previous audio
    this.stop();

    return new Promise((resolve) => {
      (async () => {
        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

          this.source = this.audioContext!.createBufferSource();
          this.source.buffer = audioBuffer;

          this.analyser = this.audioContext!.createAnalyser();
          this.analyser.fftSize = 1024; // Higher resolution for frequency analysis
          this.analyser.smoothingTimeConstant = 0.3;

          this.source.connect(this.analyser);

          if (isMuted) {
            // Mute but keep analysis active
            const gainNode = this.audioContext!.createGain();
            gainNode.gain.value = 0;
            this.analyser.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);
          } else {
            this.analyser.connect(this.audioContext!.destination);
          }

          this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

          this.source.onended = () => {
            this.isPlaying = false;
            this.resetMouth();
            resolve();
          };

          this.source.start(0);
          this.isPlaying = true;

        } catch (error) {
          console.error('Audio playback error:', error);
          this.isPlaying = false;
          resolve();
        }
      })();
    });
  }

  /**
   * Update lip-sync (call every frame)
   */
  public update(_delta: number): void {
    if (!this.vrm || !this.isPlaying || !this.analyser || !this.dataArray) {
      if (!this.isPlaying) this.resetMouth(true);
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Analyze frequency bands
    // Low (100-600Hz): Vowels like 'ou', 'oh'
    const lowEnergy = this.getAverageEnergy(2, 14);
    
    // Mid (600-2000Hz): Vowels like 'aa', 'ee'
    const midEnergy = this.getAverageEnergy(14, 46);
    
    // High (2000-6000Hz): Consonants and 'ih'
    const highEnergy = this.getAverageEnergy(46, 140);

    // Calculate target vowel shapes
    const volume = Math.max(lowEnergy, midEnergy, highEnergy) / 255;
    const isSpeaking = volume > 0.1;

    if (!isSpeaking) {
      this.resetMouth(true);
      return;
    }

    const targets = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

    // Relative energies
    const relLow = lowEnergy / 255;
    const relMid = midEnergy / 255;
    const relHigh = highEnergy / 255;

    // Heuristics for vowel shapes
    // 'aa' (open mouth): High mid and high energy
    if (relMid > 0.4 && relHigh > 0.3) {
      targets.aa = (relMid + relHigh) * 0.8;
    }

    // 'ou' (rounded): Dominant low, muted high
    if (relLow > 0.5 && relHigh < 0.3) {
      targets.ou = relLow * 1.2;
    }

    // 'ih' (wide): Dominant high frequency
    if (relHigh > 0.5 && relLow < 0.4) {
      targets.ih = relHigh * 1.1;
    }

    // 'oh' (open rounded): Strong low + mid
    if (relLow > 0.5 && relMid > 0.4) {
      targets.oh = (relLow + relMid) * 0.6;
    }

    // 'ee' (wide/teeth): Balanced mid
    if (relMid > 0.4 && relLow > 0.3) {
      targets.ee = relMid * 0.7;
    }

    // Apply sensitivity and clamp
    Object.keys(targets).forEach((key) => {
      const k = key as keyof typeof targets;
      targets[k] = Math.min(targets[k] * this.SENSITIVITY, 1.0);
    });

    // Smooth interpolation
    this.currentVowelWeights.aa = this.lerp(this.currentVowelWeights.aa, targets.aa, this.SMOOTHING_FACTOR);
    this.currentVowelWeights.ih = this.lerp(this.currentVowelWeights.ih, targets.ih, this.SMOOTHING_FACTOR);
    this.currentVowelWeights.ou = this.lerp(this.currentVowelWeights.ou, targets.ou, this.SMOOTHING_FACTOR);
    this.currentVowelWeights.ee = this.lerp(this.currentVowelWeights.ee, targets.ee, this.SMOOTHING_FACTOR);
    this.currentVowelWeights.oh = this.lerp(this.currentVowelWeights.oh, targets.oh, this.SMOOTHING_FACTOR);

    // Apply to VRM
    this.applyWeights();
  }

  private getAverageEnergy(startBin: number, endBin: number): number {
    if (!this.dataArray) return 0;
    let sum = 0;
    for (let i = startBin; i < endBin; i++) {
      sum += this.dataArray[i];
    }
    return sum / (endBin - startBin);
  }

  private applyWeights(): void {
    if (!this.vrm || !this.vrm.expressionManager) return;
    const em = this.vrm.expressionManager;
    em.setValue('aa', this.currentVowelWeights.aa);
    em.setValue('ih', this.currentVowelWeights.ih);
    em.setValue('ou', this.currentVowelWeights.ou);
    em.setValue('ee', this.currentVowelWeights.ee);
    em.setValue('oh', this.currentVowelWeights.oh);
  }

  private resetMouth(decay: boolean = false): void {
    if (!this.vrm || !this.vrm.expressionManager) return;

    if (decay) {
      // Smooth decay
      const decayFactor = 0.2;
      this.currentVowelWeights.aa = this.lerp(this.currentVowelWeights.aa, 0, decayFactor);
      this.currentVowelWeights.ih = this.lerp(this.currentVowelWeights.ih, 0, decayFactor);
      this.currentVowelWeights.ou = this.lerp(this.currentVowelWeights.ou, 0, decayFactor);
      this.currentVowelWeights.ee = this.lerp(this.currentVowelWeights.ee, 0, decayFactor);
      this.currentVowelWeights.oh = this.lerp(this.currentVowelWeights.oh, 0, decayFactor);
      this.applyWeights();
    } else {
      // Instant reset
      this.currentVowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
      this.applyWeights();
    }
  }

  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  public stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Already stopped
      }
      this.source.disconnect();
      this.source = null;
    }
    this.isPlaying = false;
    this.resetMouth();
  }
}
```

### 2. Usage Example

```typescript
const lipSyncManager = new LipSyncManager();
lipSyncManager.setVRM(vrm);

// Play audio with lip-sync
const audioBlob = await fetch('/audio/speech.wav').then(r => r.blob());
await lipSyncManager.playAudio(audioBlob);

// In render loop
function animate() {
  const delta = clock.getDelta();
  lipSyncManager.update(delta);
}
```

---

## Natural Presence Features

### 1. Automatic Blinking

```typescript
// blink.ts
import { VRM } from '@pixiv/three-vrm';

export function startBlinking(vrm: VRM): () => void {
  let blinkTimer: NodeJS.Timeout;

  const blink = () => {
    if (!vrm.expressionManager) return;

    // Blink animation
    vrm.expressionManager.setValue('Blink', 1.0);
    
    setTimeout(() => {
      vrm.expressionManager?.setValue('Blink', 0);
    }, 150); // Blink duration

    // Random interval between blinks (2-6 seconds)
    const nextBlink = 2000 + Math.random() * 4000;
    blinkTimer = setTimeout(blink, nextBlink);
  };

  blink();

  // Return cleanup function
  return () => {
    clearTimeout(blinkTimer);
  };
}
```

### 2. Idle Movements

```typescript
// idle.ts
import * as THREE from 'three';

export function startIdle(onUpdate: (target: THREE.Vector3) => void): () => void {
  const idleTarget = new THREE.Vector3();
  let time = 0;

  const updateIdle = () => {
    time += 0.01;

    // Subtle look around pattern
    idleTarget.x = Math.sin(time * 0.5) * 0.1;
    idleTarget.y = Math.cos(time * 0.3) * 0.05;
    
    onUpdate(idleTarget);
  };

  const interval = setInterval(updateIdle, 16); // ~60fps

  return () => {
    clearInterval(interval);
  };
}
```

### 3. Head Tracking (Camera Follow)

```typescript
// head-follow.ts
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';

export function createHeadFollower(vrm: VRM) {
  const targetPose = { yaw: 0, pitch: 0, roll: 0, lean: 0 };
  const currentPose = { yaw: 0, pitch: 0, roll: 0, lean: 0 };

  return {
    setPose: (yaw: number, pitch: number, roll: number, distance: number) => {
      targetPose.yaw = yaw;
      targetPose.pitch = pitch;
      targetPose.roll = roll;
      
      // Distance-based lean
      const minD = 0.15;
      const maxD = 0.4;
      targetPose.lean = THREE.MathUtils.clamp((distance - minD) / (maxD - minD), 0, 1);
    },
    
    update: () => {
      // Smooth dampening
      const damp = 0.15;
      currentPose.yaw = THREE.MathUtils.lerp(currentPose.yaw, targetPose.yaw, damp);
      currentPose.pitch = THREE.MathUtils.lerp(currentPose.pitch, targetPose.pitch, damp);
      currentPose.roll = THREE.MathUtils.lerp(currentPose.roll, targetPose.roll, damp);
      currentPose.lean = THREE.MathUtils.lerp(currentPose.lean, targetPose.lean, damp);

      const head = vrm.humanoid?.getNormalizedBoneNode("head");
      const spine = vrm.humanoid?.getNormalizedBoneNode("spine");

      if (head) {
        head.rotation.y = currentPose.yaw * 0.5;
        head.rotation.x = -currentPose.pitch * 0.3;
        head.rotation.z = currentPose.roll * 0.2;
      }

      if (spine) {
        spine.rotation.z = currentPose.lean * 0.1;
      }
    }
  };
}
```

---

## Complete Code Examples

### Full React Component Integration

```typescript
// ThreeStage.tsx
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { AnimationManager } from '../three/AnimationManager';
import { LipSyncManager } from '../three/LipSyncManager';
import { VRMLoaderService } from '../three/VRMLoader';

export function ThreeStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const lipSyncRef = useRef<LipSyncManager | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 2;

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    sceneRef.current = scene;

    // Initialize managers
    animationManagerRef.current = new AnimationManager();
    lipSyncRef.current = new LipSyncManager();

    // Load VRM
    const vrmLoader = new VRMLoaderService();
    vrmLoader.load('/models/avatar.vrm').then(({ vrm }) => {
      scene.add(vrm.scene);
      vrmRef.current = vrm;

      // Initialize managers with VRM
      animationManagerRef.current!.initialize(vrm);
      lipSyncRef.current!.setVRM(vrm);

      // Load default animation
      animationManagerRef.current!.loadAnimationFromUrl('/animations/idle.fbx');
    });

    // Render loop
    const clock = new THREE.Clock();
    function animate() {
      const delta = clock.getDelta();

      if (vrmRef.current) {
        vrmRef.current.update(delta);
      }

      if (animationManagerRef.current) {
        animationManagerRef.current.update(delta);
      }

      if (lipSyncRef.current) {
        lipSyncRef.current.update(delta);
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} />;
}
```

---

## Project Structure

```
your-project/
├── src/
│   ├── three/                  # Three.js Core (NO React)
│   │   ├── VRMLoader.ts       # VRM loading & normalization
│   │   ├── AnimationManager.ts # FBX loading & retargeting
│   │   ├── LipSyncManager.ts  # Audio-driven lip-sync
│   │   └── AthenaScene.ts     # Scene, camera, lights
│   │
│   ├── lib/                    # Utilities
│   │   ├── mixamo-retargeting.ts  # Bone mapping
│   │   ├── facialMapping.ts      # Expression mappings
│   │   ├── blink.ts              # Auto-blink
│   │   ├── idle.ts               # Idle movements
│   │   └── head-follow.ts        # Head tracking
│   │
│   ├── components/             # React Components
│   │   └── ThreeStage.tsx     # Three.js wrapper
│   │
│   └── App.tsx                # Main app
│
├── public/
│   ├── models/
│   │   └── avatar.vrm         # VRM model files
│   │
│   └── animations/            # FBX animation files
│       ├── idle.fbx
│       ├── talking.fbx
│       ├── walking.fbx
│       └── ...
│
└── package.json
```

---

## Troubleshooting

### VRM Not Loading

**Problem**: Black screen or VRM doesn't appear

**Solutions**:
1. Check VRM file path is correct
2. Verify VRM file is valid (test in [VRM Viewer](https://vrm.dev/))
3. Check console for errors
4. Ensure proper lighting in scene

### Animations Not Working

**Problem**: VRM loads but doesn't animate

**Solutions**:
1. Verify FBX files use **Mixamo rig** (bone names like `mixamorigHips`)
2. Check FBX format is **Binary**, not ASCII
3. Ensure `AnimationManager.initialize()` is called with VRM
4. Verify `AnimationManager.update()` is called every frame

### Facial Expressions Not Showing

**Problem**: Expressions don't change

**Solutions**:
1. Check if VRM has blendshapes: `console.log(vrm.expressionManager?.expressionMap)`
2. Verify expression names match VRM's expression names
3. Values must be between 0.0 and 1.0
4. Some VRMs use different naming (e.g., `happy` vs `Joy`)

### Lip-Sync Not Syncing

**Problem**: Mouth doesn't move with audio

**Solutions**:
1. Ensure VRM has vowel blendshapes: `aa`, `ih`, `ou`, `ee`, `oh`
2. Check audio is actually playing (not muted in browser)
3. Verify `LipSyncManager.update()` is called every frame
4. AudioContext might be suspended - call `audioContext.resume()`

### Performance Issues

**Problem**: Low FPS, laggy animations

**Solutions**:
1. Reduce shadow quality or disable shadows
2. Lower polygon count of VRM model
3. Use simpler animations
4. Disable unnecessary post-processing
5. Use `VRMUtils.removeUnnecessaryVertices()` and `removeUnnecessaryJoints()`

---

## Advanced Topics

### Using VRMA (Native VRM Animations)

VRMA is the native animation format for VRM. No retargeting needed!

```typescript
import { VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';

const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

const gltf = await loader.loadAsync('/animations/wave.vrma');
const vrmAnimation = gltf.userData.vrmAnimations[0];

// Create clip
const clip = vrmAnimation.createAnimationClip(vrm);
const action = mixer.clipAction(clip);
action.play();
```

### Custom Blendshape Mapping

Different VRM models may use different blendshape names:

```typescript
// Create a mapping for your specific VRM
const blendshapeMap = {
  // Your naming → Standard naming
  'smile': 'Joy',
  'angry_face': 'Angry',
  'blink_both': 'Blink',
};

function setExpression(customName: string, value: number) {
  const standardName = blendshapeMap[customName] || customName;
  vrm.expressionManager?.setValue(standardName, value);
}
```

---

## Resources

### Documentation
- [Three.js Documentation](https://threejs.org/docs/)
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)
- [VRM Specification](https://vrm.dev/)

### Tools
- [VRoid Studio](https://vroid.com/) - Create VRM avatars
- [Mixamo](https://www.mixamo.com/) - Free animations
- [Blender VRM Add-on](https://github.com/saturday06/VRM-Addon-for-Blender) - Edit VRMs in Blender

### Sample Assets
- [VRM Sample Models](https://github.com/vrm-c/vrm-specification/tree/master/samples)
- [Mixamo Characters](https://www.mixamo.com/#/?page=1&type=Character)

---

## License

This guide is provided as-is for educational purposes. VRM format is developed by the VRM Consortium.

---

**Made with ❤️ for the VR/AR community**

*Last Updated: January 2026*
