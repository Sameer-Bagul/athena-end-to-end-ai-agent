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
import { animationFacialMap } from '../lib/facialMapping';
import type { FacialExpression } from '../lib/facialMapping';
import { retargetAnimation } from 'vrm-mixamo-retarget';

/**
 * Animation action types
 * Maps semantic actions to VRMA files
 */
export const AnimationAction = {
  ANGRY: 'ANGRY',
  ARMS_STRETCH: 'ARMS_STRETCH',
  BUTTON_PUSH: 'BUTTON_PUSH',
  DANCE_BBOY: 'DANCE_BBOY',
  DANCE_HIPHOP: 'DANCE_HIPHOP',
  DANCE_RUMBA: 'DANCE_RUMBA',
  DEFEATED: 'DEFEATED',
  DISMISS: 'DISMISS',
  EXCITED_DANCE: 'EXCITED_DANCE',
  GREETING: 'GREETING',
  DRUNK: 'DRUNK',
  IDLE: 'IDLE',
  IDLE_ALT: 'IDLE_ALT',
  JUMP_SINGLE: 'JUMP_SINGLE',
  JUMP_BIG: 'JUMP_BIG',
  LAYING: 'LAYING',
  LOOK_AROUND: 'LOOK_AROUND',
  POINT: 'POINT',
  SALUTE: 'SALUTE',
  SURPRISED: 'SURPRISED',
  TALK_ARGUE: 'TALK_ARGUE',
  TALK_BIG: 'TALK_BIG',
  TALK_NORMAL: 'TALK_NORMAL',
  TALK_PHONE: 'TALK_PHONE',
  RAP: 'RAP',
  SING: 'SING',
  RELAX: 'RELAX', // Compatibility
  THINKING: 'THINKING', // Compatibility
} as const;

export type AnimationAction = typeof AnimationAction[keyof typeof AnimationAction];

const ANIMATION_FILES: Record<AnimationAction, string> = {
  [AnimationAction.ANGRY]: 'angry.fbx',
  [AnimationAction.ARMS_STRETCH]: 'armStretching.fbx',
  [AnimationAction.BUTTON_PUSH]: 'buttonPushing.fbx',
  [AnimationAction.DANCE_BBOY]: 'danceBboyHipHop.fbx',
  [AnimationAction.DANCE_HIPHOP]: 'danceHipHop.fbx',
  [AnimationAction.DANCE_RUMBA]: 'danceRumba.fbx',
  [AnimationAction.DEFEATED]: 'defeated.fbx',
  [AnimationAction.DISMISS]: 'dismissingGesture.fbx',
  [AnimationAction.EXCITED_DANCE]: 'excitedDance.fbx',
  [AnimationAction.GREETING]: 'greeting.fbx',
  [AnimationAction.DRUNK]: 'Drunk.fbx',
  [AnimationAction.IDLE]: 'idle1.fbx',
  [AnimationAction.IDLE_ALT]: 'idle1.fbx',
  [AnimationAction.JUMP_SINGLE]: 'SingleBigjump.fbx',
  [AnimationAction.JUMP_BIG]: 'bigJumps.fbx',
  [AnimationAction.LAYING]: 'layingFemalePose.fbx',
  [AnimationAction.LOOK_AROUND]: 'nervousLookAround.fbx',
  [AnimationAction.POINT]: 'pointForward.fbx',
  [AnimationAction.SALUTE]: 'salute.fbx',
  [AnimationAction.SURPRISED]: 'surprised.fbx',
  [AnimationAction.TALK_ARGUE]: 'talkingArguing.fbx',
  [AnimationAction.TALK_BIG]: 'talkingBig.fbx',
  [AnimationAction.TALK_NORMAL]: 'talking1.fbx',
  [AnimationAction.TALK_PHONE]: 'talkingOnPhone.fbx',
  [AnimationAction.RAP]: 'Rapping.fbx',
  [AnimationAction.SING]: 'Singing.fbx',
  [AnimationAction.RELAX]: 'idle1.fbx',
  [AnimationAction.THINKING]: 'Talking.fbx',
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
  /**
   * Triggers a happy facial expression (smile, soft eyes)
   */
  public triggerHappyFace(): void {
    if (!this.vrm || !this.vrm.expressionManager) return;
    // Typical VRM blendshapes for happy: "Joy" or "Smile"
    this.vrm.expressionManager.setValue('Joy', 1.0);
    this.vrm.expressionManager.setValue('Smile', 1.0);
    // Optionally soften eyes
    this.vrm.expressionManager.setValue('EyeSmileLeft', 0.7);
    this.vrm.expressionManager.setValue('EyeSmileRight', 0.7);
    // Reset after 2 seconds
    setTimeout(() => {
      if (this.vrm && this.vrm.expressionManager) {
        this.vrm.expressionManager.setValue('Joy', 0);
        this.vrm.expressionManager.setValue('Smile', 0);
        this.vrm.expressionManager.setValue('EyeSmileLeft', 0);
        this.vrm.expressionManager.setValue('EyeSmileRight', 0);
      }
    }, 2000);
  }
  /**
   * Play animation and set facial expressions explicitly (for AI/LLM-driven control)
   */
  public playWithFacial(action: AnimationAction, facialExpressions?: FacialExpression[], fadeTime?: number): void {
    this.play(action, fadeTime);

    // Reset previous expressions to avoid mixing
    this.resetExpressions();

    if (facialExpressions && this.vrm && this.vrm.expressionManager) {
      facialExpressions.forEach((expr: FacialExpression) => {
        if (this.vrm && this.vrm.expressionManager) {
          this.vrm.expressionManager.setValue(expr.name, expr.value);
          if (expr.duration) {
            setTimeout(() => {
              if (this.vrm && this.vrm.expressionManager) {
                this.vrm.expressionManager.setValue(expr.name, 0);
              }
            }, expr.duration);
          }
        }
      });
    }
  }

  // Expression Aliases for compatibility
  private readonly EXP_ALIASES: Record<string, string[]> = {
    'Happy': ['joy', 'Joy', 'Smile'],
    'Joy': ['joy', 'Joy'],
    'Sad': ['sorrow', 'Sorrow', 'Sad'],
    'Angry': ['angry', 'Angry'],
    'Surprised': ['surprised', 'Surprised', 'Shocked', 'Blink'], // Blink sometimes used if surprised missing? No, mostly Surprised is custom.
    'Relax': ['fun', 'Fun', 'Relax'],
    'Neutral': ['neutral', 'Neutral']
  };

  /**
   * Reset common facial expressions to 0
   */
  public resetExpressions(): void {
    if (!this.vrm || !this.vrm.expressionManager) return;
    // Reset all known aliases
    const allKeys = new Set<string>();
    Object.values(this.EXP_ALIASES).flat().forEach(k => allKeys.add(k));
    // Add standard VRM keys just in case
    ['joy', 'angry', 'sorrow', 'fun', 'neutral', 'blink', 'blink_l', 'blink_r', 'a', 'i', 'u', 'e', 'o'].forEach(k => allKeys.add(k));

    const manager = this.vrm.expressionManager;
    allKeys.forEach(name => {
      // Check if expression exists to avoid warnings? 
      // VRMExpressionManager.setValue usually just ignores invalid keys or warns.
      // We can check availability if needed but trying to set 0 is generally safe.
      if (manager.getExpressionTrackName(name)) {
        manager.setValue(name, 0);
      }
    });
  }

  /**
   * Set a facial expression value directly with alias support
   */
  public setExpression(name: string, value: number): void {
    if (!this.vrm || !this.vrm.expressionManager) return;

    // Try exact match first
    if (this.vrm.expressionManager.getExpressionTrackName(name)) {
      this.vrm.expressionManager.setValue(name, value);
      return;
    }

    // Try aliases
    const aliases = this.EXP_ALIASES[name] || [];
    let found = false;
    for (const alias of aliases) {
      if (this.vrm.expressionManager.getExpressionTrackName(alias)) {
        this.vrm.expressionManager.setValue(alias, value);
        found = true;
        // We usually only want to set one valid alias per semantic intent
        // Break after first valid one to avoid double-application (e.g. Joy + Smile both existing)
        break;
      }
    }

    if (!found) {
      // Fallback: try lowercase
      const lower = name.toLowerCase();
      if (this.vrm.expressionManager.getExpressionTrackName(lower)) {
        this.vrm.expressionManager.setValue(lower, value);
      }
    }
  }
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
    console.log('[AnimationManager] Starting animation preload...');
    
    // Priority animations (load first for immediate use)
    const ESSENTIAL_ANIMATIONS: AnimationAction[] = [
      AnimationAction.IDLE,
      AnimationAction.TALK_NORMAL,
      AnimationAction.THINKING,
      AnimationAction.RELAX
    ];

    const SECONDARY_ANIMATIONS = (Object.values(AnimationAction) as AnimationAction[]).filter(
      action => !(ESSENTIAL_ANIMATIONS as readonly AnimationAction[]).includes(action)
    );

    // Load essential animations first
    const essentialPromises = ESSENTIAL_ANIMATIONS.map(async (action) => {
      try {
        await this.loadAnimation(action);
        return { action, status: 'success' };
      } catch (error) {
        console.warn(`⚠️ Failed to load essential animation: ${action}`, error);
        return { action, status: 'failed', error };
      }
    });

    const essentialResults = await Promise.all(essentialPromises);
    const essentialSuccess = essentialResults.filter(r => r.status === 'success').length;
    console.log(`✅ Essential animations loaded: ${essentialSuccess}/${ESSENTIAL_ANIMATIONS.length}`);

    // Lazy load secondary animations in background
    if (typeof requestIdleCallback !== 'undefined') {
      SECONDARY_ANIMATIONS.forEach((action, index) => {
        requestIdleCallback(() => {
          this.loadAnimation(action as AnimationAction).catch(e => 
            console.warn(`⚠️ Failed to lazy-load animation: ${action}`, e)
          );
        }, { timeout: 2000 + index * 100 }); // Stagger loading
      });
      console.log(`🔄 Lazy-loading ${SECONDARY_ANIMATIONS.length} secondary animations in background`);
    } else {
      // Fallback: Load in batches with delays
      this.lazyLoadAnimationsBatched(SECONDARY_ANIMATIONS as AnimationAction[]);
    }
  }

  /**
   * Lazy load animations in batches (fallback for browsers without requestIdleCallback)
   */
  private async lazyLoadAnimationsBatched(animations: AnimationAction[]) {
    const BATCH_SIZE = 3;
    for (let i = 0; i < animations.length; i += BATCH_SIZE) {
      const batch = animations.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(action => 
        this.loadAnimation(action).catch(e => 
          console.warn(`⚠️ Failed to load ${action}:`, e)
        )
      ));
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(`✅ Completed lazy-loading ${animations.length} secondary animations`);
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
      this.triggerFacialExpressions(action);
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

    // Ensure clean slate for expressions unless handled by playWithFacial wrapper
    // Actually playWithFacial calls this, then sets new ones.
    // But plain play() should also clean up old ones.
    this.resetExpressions();
    this.triggerFacialExpressions(action);
  }

  /**
   * Triggers facial blendshapes for the given animation action
   */
  private triggerFacialExpressions(action: AnimationAction) {
    if (!this.vrm || !this.vrm.expressionManager) return;
    // Find FBX filename for this action
    const fbxFile = ANIMATION_FILES[action];
    const expressions = animationFacialMap[fbxFile];
    if (!expressions) return;
    expressions.forEach((expr: FacialExpression) => {
      this.vrm?.expressionManager?.setValue(expr.name, expr.value);
      if (expr.duration) {
        setTimeout(() => {
          this.vrm?.expressionManager?.setValue(expr.name, 0);
        }, expr.duration);
      }
    });
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
    
    // Stop current action
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
    }

    // Dispose all animations with deep cleanup
    this.animations.forEach(config => {
      config.clipAction.stop();
      
      // Deep dispose of animation clips
      if (config.clip) {
        // Clear tracks
        config.clip.tracks = [];
        config.clip.duration = 0;
      }
    });
    this.animations.clear();

    // Dispose mixer thoroughly
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
      this.mixer = null;
    }

    // Clear VRM reference
    this.vrm = null;
    this.currentAnimationType = AnimationAction.RELAX;
    
    console.log('✅ [AnimationManager] Disposal complete');
  }

  // * Processes root motion to allow X/Z movement relative to start,
  //   * while ensuring Y stays above ground.
  //  */
  private stripRootMotion(clip: THREE.AnimationClip): void {
    if (!this.vrm || !this.vrm.humanoid) return;

    const hips = this.vrm.humanoid.getNormalizedBoneNode('hips');
    if (!hips) return;

    const hipsName = hips.name;

    // Find the position track for hips
    const positionTrack = clip.tracks.find(track => track.name === `${hipsName}.position`);

    if (positionTrack) {
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
    if (!this.vrm || !this.vrm.humanoid) return;

    const leftArm = this.vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightArm = this.vrm.humanoid.getNormalizedBoneNode('rightUpperArm');

    if (!leftArm || !rightArm) return;

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
