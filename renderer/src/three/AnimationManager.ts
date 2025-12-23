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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';

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
  [AnimationAction.ANGRY]: 'Angry.vrma',
  [AnimationAction.BLUSH]: 'Blush.vrma',
  [AnimationAction.CLAPPING]: 'Clapping.vrma',
  [AnimationAction.GOODBYE]: 'Goodbye.vrma',
  [AnimationAction.JUMP]: 'Jump.vrma',
  [AnimationAction.LOOK_AROUND]: 'LookAround.vrma',
  [AnimationAction.RELAX]: 'Relax.vrma',
  [AnimationAction.SAD]: 'Sad.vrma',
  [AnimationAction.SLEEPY]: 'Sleepy.vrma',
  [AnimationAction.SURPRISED]: 'Surprised.vrma',
  [AnimationAction.THINKING]: 'Thinking.vrma',
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
  private gltfLoader: GLTFLoader;
  private mixer: THREE.AnimationMixer | null = null;
  private vrm: VRM | null = null;
  private animations: Map<AnimationAction, AnimationConfig> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private currentAnimationType: AnimationAction = AnimationAction.RELAX;

  // Animation settings
  private readonly CROSSFADE_DURATION = 0.5; // seconds

  constructor() {
    this.gltfLoader = new GLTFLoader();
    // Register the VRMA animation loader plugin
    this.gltfLoader.register((parser) => {
      return new VRMAnimationLoaderPlugin(parser);
    });
  }

  /**
   * Initialize the animation manager with a VRM model
   * Creates the animation mixer
   */
  public initialize(vrm: VRM): void {
    this.vrm = vrm;
    // Create mixer on the VRM scene for proper animation
    this.mixer = new THREE.AnimationMixer(vrm.scene);
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
    basePath: string = '/animations/'
  ): Promise<void> {
    if (!this.vrm || !this.mixer) {
      throw new Error('AnimationManager not initialized. Call initialize() first.');
    }

    const filename = ANIMATION_FILES[action];
    const path = `${basePath}${filename}`;

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          console.log(`✅ Loaded VRMA file: ${filename}`, gltf);

          // Extract VRM animation data from the loaded GLTF
          const vrmAnimations = gltf.userData.vrmAnimations;

          if (!vrmAnimations || vrmAnimations.length === 0) {
            reject(new Error(`No VRM animation found in ${filename}`));
            return;
          }

          // Get the first animation from the file
          const vrmAnimationData = vrmAnimations[0];

          // Convert VRM animation data to THREE.AnimationClip
          const clip = createVRMAnimationClip(vrmAnimationData, this.vrm!);

          if (!clip) {
            reject(new Error(`Failed to create animation clip from ${filename}`));
            return;
          }

          console.log(`🎬 Created animation clip for ${action}:`, clip);
          console.log(`   Duration: ${clip.duration.toFixed(2)}s`);
          console.log(`   Tracks: ${clip.tracks.length}`);

          // Create animation action
          const clipAction = this.mixer!.clipAction(clip);

          // Configure animation
          clipAction.setLoop(THREE.LoopRepeat, Infinity);
          clipAction.clampWhenFinished = true;

          // Store animation config
          this.animations.set(action, {
            action,
            clip,
            mixer: this.mixer!,
            clipAction,
          });

          console.log(`✅ Loaded animation: ${action} (${filename})`);
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
   * Load a single animation from an arbitrary URL (e.g. Blob URL)
   * 
   * @param url - URL to the animation file
   */
  public async loadAnimationFromUrl(url: string): Promise<void> {
    if (!this.vrm || !this.mixer) {
      throw new Error('AnimationManager not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          console.log(`✅ Loaded animation from URL: ${url}`, gltf);

          // Extract VRM animation data 
          const vrmAnimations = gltf.userData.vrmAnimations;
          if (!vrmAnimations || vrmAnimations.length === 0) {
            reject(new Error(`No VRM animation found in URL`));
            return;
          }

          const vrmAnimationData = vrmAnimations[0];
          const clip = createVRMAnimationClip(vrmAnimationData, this.vrm!);

          if (!clip) {
            reject(new Error(`Failed to create animation clip from URL`));
            return;
          }

          // Create animation action
          const clipAction = this.mixer!.clipAction(clip);
          clipAction.setLoop(THREE.LoopRepeat, Infinity);
          clipAction.clampWhenFinished = true;

          // Perform crossfade
          if (this.currentAction) {
            this.currentAction.fadeOut(this.CROSSFADE_DURATION);
          }

          console.log(`▶️ Starting custom animation`);
          clipAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(this.CROSSFADE_DURATION)
            .play();

          this.currentAction = clipAction;

          resolve();
        },
        undefined,
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          reject(new Error(`Failed to load animation from URL: ${err.message}`));
        }
      );
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
   * Dispose of all resources
   * Call on cleanup to prevent memory leaks
   */
  public dispose(): void {
    console.log('🧹 [AnimationManager] Disposing animation manager resources');
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
      this.mixer = null;
    }

    this.animations.clear();
    this.currentAction = null;
    this.vrm = null;
  }
}
