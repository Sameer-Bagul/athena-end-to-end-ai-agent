/**
 * TypeScript type declarations for Three.js modules
 */

import type * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import type { AnimationManager } from './AnimationManager';

/**
 * Callback when 3D environment is ready
 */
export type OnReadyCallback = (manager: AnimationManager) => void;

/**
 * Callback when error occurs during loading
 */
export type OnErrorCallback = (error: Error) => void;

/**
 * Animation update callback
 */
export type UpdateCallback = (delta: number) => void;

/**
 * Scene initialization options
 */
export interface SceneOptions {
  antialias?: boolean;
  alpha?: boolean;
  backgroundColor?: number;
}

/**
 * VRM with scene reference
 */
export interface VRMWithScene {
  vrm: VRM;
  scene: THREE.Group;
}
