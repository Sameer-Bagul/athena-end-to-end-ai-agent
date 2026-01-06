/**
 * AnimationManager.ts
 * 
 * Manages VRMA animation loading and playback for VRM avatars.
 * Handles animation blending and state management.
 * 
 * Architecture principle:
 * - Load VRMA animations from public/animations/
 * - No retargeting needed - VRMA is native VRM format
 * - Smooth crossfade between animations
 * - Prevent animation conflicts
 * - Maintain clean state machine
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM } from '@pixiv/three-vrm';
import { retargetAnimation } from 'vrm-mixamo-retarget';

/**
 * Animation action types
 * Maps semantic actions to VRMA files
 */
export const AnimationAction = {
  ANGRY: 'ANGRY',
  BLUSH: 'BLUSH',
  CLAPPING: 'CLAPPING',
  GOODBYE: 'GOODBYE',
  JUMP: 'JUMP',
  LOOK_AROUND: 'LOOK_AROUND',
  RELAX: 'RELAX',
  SAD: 'SAD',
  SLEEPY: 'SLEEPY',
  SURPRISED: 'SURPRISED',
  THINKING: 'THINKING',
} as const;

export type AnimationAction = typeof AnimationAction[keyof typeof AnimationAction];

/**
 * Animation file mapping
 * Maps enum values to VRMA filenames
 */
const ANIMATION_FILES: Record<AnimationAction, string> = {
  [AnimationAction.ANGRY]: 'angry.fbx',
  [AnimationAction.BLUSH]: 'nervousLookAround.fbx',
  [AnimationAction.CLAPPING]: 'victory.fbx',
  [AnimationAction.GOODBYE]: 'dismissingGesture.fbx',
  [AnimationAction.JUMP]: 'jump.fbx',
  [AnimationAction.LOOK_AROUND]: 'nervousLookAround.fbx',
  [AnimationAction.RELAX]: 'Idle.fbx', // Default requested by user
  [AnimationAction.SAD]: 'defeated.fbx',
  [AnimationAction.SLEEPY]: 'idleDrunk.fbx',
  [AnimationAction.SURPRISED]: 'surprised.fbx',
  [AnimationAction.THINKING]: 'Talking.fbx', // AI Response requested by user
};

/**
 * Animation configuration
 */
interface AnimationConfig {
  action: AnimationAction;
  clip: THREE.AnimationClip;
  mixer: THREE.AnimationMixer;
  clipAction: THREE.AnimationAction;
}

export class AnimationManager {
  private mixer: THREE.AnimationMixer | null = null;
  private vrm: VRM | null = null;
  private animations: Map<AnimationAction, AnimationConfig> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private currentAnimationType: AnimationAction = AnimationAction.RELAX;
  private baseHipsHeight: number = 0; // Natural resting height of hips

  // Animation settings
  private readonly CROSSFADE_DURATION = 0.5; // seconds

  constructor() {
    // FBXLoader is instantiated on demand
  }

  /**
   * Initialize the animation manager with a VRM model
   * Creates the animation mixer
   */
  public initialize(vrm: VRM): void {
    this.vrm = vrm;
    // Create mixer on the VRM scene for proper animation
    this.mixer = new THREE.AnimationMixer(vrm.scene);

    // Capture base hips height (T-pose/Rest pose)
    // We assume the model is loaded in T-pose initially
    const hips = vrm.humanoid.getNormalizedBoneNode('hips');
    if (hips) {
      // We need world position relative to model root. 
      // If scene is at 0,0,0, world position Y is correct.
      // But let's be safe and use local or ensure root is 0.
      // VRM normalized bone node "hips" is usually child of root.
      // Let's use world position assuming model is at 0,0,0 during init.
      const worldPos = new THREE.Vector3();
      hips.getWorldPosition(worldPos);
      this.baseHipsHeight = worldPos.y;
      console.log(`📏 [AnimationManager] Base Hips Height captured: ${this.baseHipsHeight.toFixed(4)}m`);
    }

    console.log('🎭 Animation mixer created on VRM scene');
  }

  /**
   * Load a single animation from VRMA file
   * 
   * @param action - Animation action to load
   * @param basePath - Base path to animations folder (default: '/animations/')
   */
  public async loadAnimation(
    action: AnimationAction,
    basePath: string = 'animations/'
  ): Promise<void> {
    if (!this.vrm || !this.mixer) {
      throw new Error('AnimationManager not initialized. Call initialize() first.');
    }

    const filename = ANIMATION_FILES[action];
    const path = `${basePath}${filename}`;
    // Assuming strictly FBX as per plan

    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      loader.load(path, (fbxGroup) => {
        console.log(`✅ Loaded FBX file for cache: ${filename}`);

        // Ensure VRM is at 0,0,0
        this.vrm!.scene.position.set(0, 0, 0);

        let clip: THREE.AnimationClip | null = null;
        try {
          clip = retargetAnimation(fbxGroup, this.vrm!);
        } catch (e) {
          console.error("Retargeting failed", e);
          reject(e);
          return;
        }

        if (!clip) {
          reject(new Error(`Failed to retarget FBX animation: ${filename}`));
          return;
        }

        // FIX: Strip Root Motion (Smart Lock)
        this.stripRootMotion(clip);

        // FIX: Arm Spacer
        this.adjustArmSpacing(clip, 0.13);

        const clipAction = this.mixer!.clipAction(clip);
        clipAction.setLoop(THREE.LoopRepeat, Infinity);
        clipAction.clampWhenFinished = false;

        // Store in cache
        this.animations.set(action, {
          action,
          clip,
          mixer: this.mixer!,
          clipAction,
        });

        console.log(`✅ Cached animation: ${action} (${filename})`);
        resolve();

      }, undefined, (e) => {
        const err = e instanceof Error ? e : new Error(String(e));
        reject(new Error(`Failed to load FBX ${action}: ${err.message}`));
      });
    });
  }



  /**
   * Load a single animation from an arbitrary URL (e.g. Blob URL or public path)
   * Supports both .vrma and .fbx (via Mixamo retargeting)
   * 
   * @param url - URL to the animation file
   */
  public async loadAnimationFromUrl(url: string): Promise<void> {
    if (!this.vrm || !this.mixer) {
      console.error('[AnimationManager] Not initialized. Call initialize() first.');
      throw new Error('AnimationManager not initialized. Call initialize() first.');
    }

    // Force FBX check or assumption
    if (!url.toLowerCase().endsWith('.fbx')) {
      console.warn(`[AnimationManager] URL does not end with .fbx, but attempting load anyway: ${url}`);
    }

    console.log(`[AnimationManager] loadAnimationFromUrl called with: ${url}`);

    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      loader.load(url, (fbxGroup) => {
        console.log(`[AnimationManager] ✅ Loaded FBX from URL: ${url}`);

        // Ensure VRM is at 0,0,0 to prevent ground clipping
        this.vrm!.scene.position.set(0, 0, 0);

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

        // FIX: Strip Root Motion (Smart Lock)
        this.stripRootMotion(clip);

        // FIX: Arm Spacer
        this.adjustArmSpacing(clip, 0.13);

        const clipAction = this.mixer!.clipAction(clip);

        // Apply Loop Fixes (same as Playground)
        clipAction.setLoop(THREE.LoopRepeat, Infinity);
        clipAction.clampWhenFinished = true;

        // Crossfade
        if (this.currentAction) {
          this.currentAction.fadeOut(this.CROSSFADE_DURATION);
        }

        console.log(`[AnimationManager] ▶️ Starting FBX animation:`, url);
        clipAction
          .reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(this.CROSSFADE_DURATION)
          .play();

        this.currentAction = clipAction;
        resolve();

      }, undefined, (e) => {
        console.error("FBX Load Error", e);
        reject(e);
      });
    });
  }

  /**
   * Load all animations
   * Loads all defined animations in parallel
   */
  public async loadAllAnimations(): Promise<void> {
    const loadPromises = Object.values(AnimationAction).map(async (action) => {
      try {
        await this.loadAnimation(action);
        return { action, status: 'success' };
      } catch (error) {
        console.warn(`⚠️ Failed to load animation: ${action}`, error);
        return { action, status: 'failed', error };
      }
    });

    const results = await Promise.all(loadPromises);

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    console.log(`✅ VRMA Animation Loading Complete: ${successCount} loaded, ${failCount} failed`);

    if (successCount === 0) {
      throw new Error('Failed to load any animations');
    }
  }

  /**
   * Play an animation with smooth crossfade
   * 
   * @param action - Animation action to play
   * @param fadeTime - Crossfade duration (optional, uses default if not provided)
   */
  public play(action: AnimationAction, fadeTime?: number): void {
    console.log(`🎯 Play request for: ${action}`);

    const animConfig = this.animations.get(action);

    if (!animConfig) {
      console.warn(`⚠️ Animation ${action} not loaded yet`);
      return;
    }

    const newAction = animConfig.clipAction;

    // If same animation is already playing, restart it
    if (this.currentAction === newAction) {
      console.log(`🔄 Restarting same animation: ${action}`);
      newAction.reset();
      newAction.play();
      return;
    }

    // Crossfade from current to new animation
    const duration = fadeTime ?? this.CROSSFADE_DURATION;

    if (this.currentAction) {
      console.log(`⏸️ Fading out current animation`);
      this.currentAction.fadeOut(duration);
    }

    console.log(`▶️ Starting animation: ${action}`);
    newAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();

    this.currentAction = newAction;
    this.currentAnimationType = action;
  }

  /**
   * Stop current animation
   */
  public stop(): void {
    if (this.currentAction) {
      this.currentAction.fadeOut(this.CROSSFADE_DURATION);
      this.currentAction = null;
    }
  }

  /**
   * Reset the avatar to a natural standing pose (Static, No Animation)
   * This effectively stops the mixer and manually sets bone rotations to A-pose.
   */
  public resetToStandPose(): void {
    // 1. Stop all animations
    this.stop();
    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    // 2. Manually set A-Pose (Arms down 45 deg)
    if (this.vrm && this.vrm.humanoid) {
      const lArm = this.vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
      const rArm = this.vrm.humanoid.getNormalizedBoneNode('rightUpperArm');

      if (lArm && rArm) {
        // Reset rotations first (T-pose)
        lArm.rotation.set(0, 0, 0);
        rArm.rotation.set(0, 0, 0);

        // Apply natural hang (approx 70-80 degrees down Z-axis for VRM)
        // VRM coords: +Z is forward? No, VRM humanoid bones are usually +Y down? 
        // Usually Unity/VRM convention: T-pose.
        // Left Arm: +Z Rotation moves arm down (towards body)?
        // Let's try 75 degrees (1.3 radians) on Z.

        lArm.rotation.z = 1.3;
        rArm.rotation.z = -1.3;
      }
    }
    console.log('🧘 [AnimationManager] Reset to static stand pose');
  }

  /**
   * Get current playing animation type
   */
  public getCurrentAnimation(): AnimationAction {
    return this.currentAnimationType;
  }

  /**
   * Update animation mixer
   * MUST be called every frame
   * 
   * @param delta - Time since last frame in seconds
   */
  public update(delta: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  /**
   * Temporary hooks for TTS integration (v1)
   * Will be replaced with proper lip-sync in future versions
   */
  public onSpeakStart(): void {
    this.play(AnimationAction.THINKING);
  }

  public onSpeakEnd(): void {
    this.play(AnimationAction.RELAX);
  }

  /**
   * Check if a specific animation is loaded
   */
  public isAnimationLoaded(action: AnimationAction): boolean {
    return this.animations.has(action);
  }

  /**
   * Get all loaded animations
   */
  public getLoadedAnimations(): AnimationAction[] {
    return Array.from(this.animations.keys());
  }

  /**
   * Set animation playback speed (time scale)
   */
  public setTimeScale(speed: number): void {
    if (this.mixer) {
      this.mixer.timeScale = speed;
      console.log(`⏩ [AnimationManager] Time scale set to: ${speed}`);
    }
  }

  /**
   * Dispose of all resources
   * Call on cleanup to prevent memory leaks
   */
  public dispose(): void {
    console.log('🧹 [AnimationManager] Disposing animation manager resources');
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
      this.mixer = null;
    }

    this.animations.forEach(config => {
      config.clipAction.stop();
      // Optional: uncache clips if needed, but usually mixer.uncacheRoot handles it
    });
    this.animations.clear();

    this.vrm = null;
  }

  // * Processes root motion to allow X/Z movement relative to start,
  //   * while ensuring Y stays above ground.
  //  */
  private stripRootMotion(clip: THREE.AnimationClip): void {
  if(!this.vrm || !this.vrm.humanoid) return;

  const hips = this.vrm.humanoid.getNormalizedBoneNode('hips');
  if(!hips) return;

  const hipsName = hips.name;

  // Find the position track for hips
  const positionTrack = clip.tracks.find(track => track.name === `${hipsName}.position`);

  if(positionTrack) {
    const values = positionTrack.values;

    // Capture initial position (Frame 0)
    const initialX = values[0];
    const initialY = values[1];
    const initialZ = values[2];

    // Calculate offsets to normalize animation to start at (0, baseHipsHeight, 0)
    // This allows the model to move (root motion) but relative to its spawn point.
    const offsetX = -initialX;
    const offsetZ = -initialZ;
    const offsetY = this.baseHipsHeight - initialY;

    const floorThreshold = 0.05; // Minimum height from floor

    // Modify values in-place: [x, y, z, x, y, z, ...]
    for (let i = 0; i < values.length; i += 3) {
      // Apply Offsets (Normalize)
      values[i] = values[i] + offsetX;       // X
      values[i + 2] = values[i + 2] + offsetZ; // Z

      // Y Logic: Normalize + Clamp
      let newY = values[i + 1] + offsetY;

      // Prevent sinking below floor
      if (newY < floorThreshold) {
        newY = floorThreshold;
      }

      values[i + 1] = newY;
    }

    console.log(`🔓 [AnimationManager] Processed root motion for ${hipsName}`);
    console.log(`   - Horizontal: Normalized (Moving)`);
    console.log(`   - Vertical: Normalized & Floor Clamped (> ${floorThreshold}m)`);
  }
}
  /**
   * Adjusts the upper arm spacing to prevent clipping into the body.
   * Rotates arms outwards (abduction) by a small angle.
   * 
   * @param clip - The animation clip to modify
   * @param spacingAngle - Angle in radians to widen arms (default: 0.1 rad ~ 5.7 deg)
   */
  private adjustArmSpacing(clip: THREE.AnimationClip, spacingAngle: number = 0.1): void {
  if(!this.vrm || !this.vrm.humanoid) return;

  const leftArm = this.vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightArm = this.vrm.humanoid.getNormalizedBoneNode('rightUpperArm');

  if(!leftArm || !rightArm) return;

const leftArmName = leftArm.name;
const rightArmName = rightArm.name;

// Create offset quaternions for abduction (Z-axis rotation usually)
// Left Arm: Rotate -Z to move up/out (Inverted from previous)
// Right Arm: Rotate +Z to move up/out (Inverted from previous)
const leftOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -spacingAngle);
const rightOffset = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), spacingAngle);

let modifiedCount = 0;

clip.tracks.forEach(track => {
  if (track.name.endsWith('.quaternion')) {
    const isLeft = track.name === `${leftArmName}.quaternion`;
    const isRight = track.name === `${rightArmName}.quaternion`;

    if (isLeft || isRight) {
      const values = track.values; // [x, y, z, w, ...]
      const numFrames = values.length / 4;
      const offset = isLeft ? leftOffset : rightOffset;

      for (let i = 0; i < numFrames; i++) {
        const idx = i * 4;
        const currentQ = new THREE.Quaternion(values[idx], values[idx + 1], values[idx + 2], values[idx + 3]);

        // Apply offset: NewQ = Offset * OldQ (Premultiply for local rotation change)
        // Or Postmultiply? Usually bone rotations are local.
        // Let's try premultiply to rotate the "base" frame of reference.
        currentQ.premultiply(offset);

        values[idx] = currentQ.x;
        values[idx + 1] = currentQ.y;
        values[idx + 2] = currentQ.z;
        values[idx + 3] = currentQ.w;
      }
      modifiedCount++;
    }
  }
});

if (modifiedCount > 0) {
  console.log(`💪 [AnimationManager] Adjusted Arm Spacing for ${modifiedCount} tracks (+${(spacingAngle * 57.29).toFixed(1)}°)`);
}
  }
}
