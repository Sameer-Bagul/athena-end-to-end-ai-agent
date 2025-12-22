/**
 * AnimationManager.ts
 * 
 * Manages FBX animation loading and playback for VRM avatars.
 * Handles animation blending, retargeting, and state management.
 * 
 * Architecture principle:
 * - Load FBX animations from public/animations/
 * - Retarget to VRM humanoid skeleton
 * - Smooth crossfade between animations
 * - Prevent animation conflicts
 * - Maintain clean state machine
 */

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM } from '@pixiv/three-vrm';

/**
 * Animation action types
 * Maps semantic actions to FBX files
 */
export const AnimationAction = {
  IDLE: 'IDLE',
  TALK: 'TALK',
  GREET: 'GREET',
  HAPPY: 'HAPPY',
  JUMP: 'JUMP',
} as const;

export type AnimationAction = typeof AnimationAction[keyof typeof AnimationAction];

/**
 * Animation file mapping
 * Maps enum values to FBX filenames
 */
const ANIMATION_FILES: Record<AnimationAction, string> = {
  [AnimationAction.IDLE]: 'idleFemale.fbx',
  [AnimationAction.TALK]: 'talking.fbx',
  [AnimationAction.GREET]: 'greeting.fbx',
  [AnimationAction.HAPPY]: 'excited.fbx',
  [AnimationAction.JUMP]: 'jump.fbx',
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
  private fbxLoader: FBXLoader;
  private mixer: THREE.AnimationMixer | null = null;
  private vrm: VRM | null = null;
  private animations: Map<AnimationAction, AnimationConfig> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private currentAnimationType: AnimationAction = AnimationAction.IDLE;
  
  // Animation settings
  private readonly CROSSFADE_DURATION = 0.5; // seconds

  constructor() {
    this.fbxLoader = new FBXLoader();
  }

  /**
   * Initialize the animation manager with a VRM model
   * Creates the animation mixer
   */
  public initialize(vrm: VRM): void {
    this.vrm = vrm;
    this.mixer = new THREE.AnimationMixer(vrm.scene);
  }

  /**
   * Load a single animation from FBX file
   * 
   * @param action - Animation action to load
   * @param basePath - Base path to animations folder (default: '/animations/')
   */
  public async loadAnimation(
    action: AnimationAction,
    basePath: string = '/animations/'
  ): Promise<void> {
    if (!this.vrm || !this.mixer) {
      throw new Error('AnimationManager not initialized. Call initialize() first.');
    }

    const filename = ANIMATION_FILES[action];
    const path = `${basePath}${filename}`;

    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        path,
        (fbx: THREE.Group) => {
          // Extract animation clip from FBX
          const clip = fbx.animations[0];

          if (!clip) {
            reject(new Error(`No animation found in ${filename}`));
            return;
          }

          // Retarget animation to VRM humanoid
          const retargetedClip = this.retargetAnimationClip(clip);

          // Create animation action
          const clipAction = this.mixer!.clipAction(retargetedClip);
          
          // Configure animation
          clipAction.setLoop(THREE.LoopRepeat, Infinity);
          clipAction.clampWhenFinished = true;

          // Store animation config
          this.animations.set(action, {
            action,
            clip: retargetedClip,
            mixer: this.mixer!,
            clipAction,
          });

          console.log(`Loaded animation: ${action} (${filename})`);
          resolve();
        },
        (progress) => {
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(`Loading ${action}: ${percentComplete.toFixed(2)}%`);
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          reject(new Error(`Failed to load animation ${action}: ${err.message}`));
        }
      );
    });
  }

  /**
   * Load all animations
   * Loads all defined animations in parallel
   */
  public async loadAllAnimations(): Promise<void> {
    const loadPromises = Object.values(AnimationAction).map((action) =>
      this.loadAnimation(action)
    );

    await Promise.all(loadPromises);
    console.log('All animations loaded successfully');
  }

  /**
   * Retarget FBX animation to VRM humanoid skeleton
   * Handles bone name mismatches between FBX and VRM
   */
  private retargetAnimationClip(clip: THREE.AnimationClip): THREE.AnimationClip {
    if (!this.vrm) {
      throw new Error('VRM not set');
    }

    // Clone the clip to avoid modifying the original
    const retargetedClip = clip.clone();

    // Map FBX bone names to VRM humanoid bone names
    retargetedClip.tracks = retargetedClip.tracks.map((track) => {
      const trackSplitted = track.name.split('.');
      const mixamoRigName = trackSplitted[0];
      const propertyName = trackSplitted[1];

      // Get corresponding VRM bone
      const vrmBoneName = this.mixamoVRMBoneMap[mixamoRigName];
      // @ts-expect-error - VRM humanoid bone names are dynamic
      const vrmNodeName = this.vrm!.humanoid?.getNormalizedBoneNode(vrmBoneName);

      if (vrmNodeName) {
        const newTrack = track.clone();
        newTrack.name = `${vrmNodeName.name}.${propertyName}`;
        return newTrack;
      }

      return track;
    });

    return retargetedClip;
  }

  /**
   * Mixamo to VRM bone name mapping
   * Maps standard Mixamo rig bone names to VRM humanoid bone names
   */
  private mixamoVRMBoneMap: Record<string, string> = {
    mixamorigHips: 'hips',
    mixamorigSpine: 'spine',
    mixamorigSpine1: 'chest',
    mixamorigSpine2: 'upperChest',
    mixamorigNeck: 'neck',
    mixamorigHead: 'head',
    mixamorigLeftShoulder: 'leftShoulder',
    mixamorigLeftArm: 'leftUpperArm',
    mixamorigLeftForeArm: 'leftLowerArm',
    mixamorigLeftHand: 'leftHand',
    mixamorigRightShoulder: 'rightShoulder',
    mixamorigRightArm: 'rightUpperArm',
    mixamorigRightForeArm: 'rightLowerArm',
    mixamorigRightHand: 'rightHand',
    mixamorigLeftUpLeg: 'leftUpperLeg',
    mixamorigLeftLeg: 'leftLowerLeg',
    mixamorigLeftFoot: 'leftFoot',
    mixamorigLeftToeBase: 'leftToes',
    mixamorigRightUpLeg: 'rightUpperLeg',
    mixamorigRightLeg: 'rightLowerLeg',
    mixamorigRightFoot: 'rightFoot',
    mixamorigRightToeBase: 'rightToes',
  };

  /**
   * Play an animation with smooth crossfade
   * 
   * @param action - Animation action to play
   * @param fadeTime - Crossfade duration (optional, uses default if not provided)
   */
  public play(action: AnimationAction, fadeTime?: number): void {
    const animConfig = this.animations.get(action);

    if (!animConfig) {
      console.warn(`Animation ${action} not loaded yet`);
      return;
    }

    const newAction = animConfig.clipAction;

    // If same animation is already playing, do nothing
    if (this.currentAction === newAction) {
      return;
    }

    // Crossfade from current to new animation
    const duration = fadeTime ?? this.CROSSFADE_DURATION;

    if (this.currentAction) {
      this.currentAction.fadeOut(duration);
    }

    newAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();

    this.currentAction = newAction;
    this.currentAnimationType = action;

    console.log(`Playing animation: ${action}`);
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
    this.play(AnimationAction.TALK);
  }

  public onSpeakEnd(): void {
    this.play(AnimationAction.IDLE);
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
   * Dispose of all resources
   * Call on cleanup to prevent memory leaks
   */
  public dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.animations.clear();
    this.currentAction = null;
    this.vrm = null;
  }
}
