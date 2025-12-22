/**
 * VRMLoader.ts
 * 
 * Handles loading and normalization of VRM avatars.
 * VRM is a 3D avatar file format based on glTF.
 * 
 * Architecture principle:
 * - Load VRM from public/models/ directory
 * - Normalize humanoid bone structure
 * - Apply proper scaling and positioning
 * - Return ready-to-use VRM instance
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
   * 
   * @param path - Path to VRM file (relative to public directory)
   * @returns Promise resolving to VRM instance and scene
   */
  public async load(path: string): Promise<VRMLoadResult> {
    console.log('🔵 [VRMLoader] Starting to load VRM from:', path);
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf: GLTF) => {
          console.log('🟢 [VRMLoader] GLTF loaded successfully', gltf);
          const vrm = gltf.userData.vrm as VRM;

          if (!vrm) {
            console.error('🔴 [VRMLoader] No VRM data in loaded file!');
            reject(new Error('VRM data not found in loaded file'));
            return;
          }

          console.log('🟢 [VRMLoader] VRM data found:', vrm);
          console.log('🟢 [VRMLoader] VRM scene children:', vrm.scene.children.length);

          // Normalize the VRM
          this.normalizeVRM(vrm);

          console.log('🟢 [VRMLoader] VRM normalized and ready');
          console.log('🟢 [VRMLoader] VRM position:', vrm.scene.position);
          console.log('🟢 [VRMLoader] VRM rotation:', vrm.scene.rotation);
          console.log('🟢 [VRMLoader] VRM scale:', vrm.scene.scale);

          resolve({
            vrm,
            scene: vrm.scene,
          });
        },
        (progress) => {
          // Log loading progress
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(`Loading VRM: ${percentComplete.toFixed(2)}%`);
        },
        (error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          reject(new Error(`Failed to load VRM: ${err.message}`));
        }
      );
    });
  }

  /**
   * Normalize VRM for proper display
   * - Remove unnecessary nodes
   * - Disable frustum culling
   * - Apply proper rotation and scale
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
    // Most VRM models are designed to be at Y=0, but we need to check the bounding box
    // to ensure proper positioning
    const bbox = new THREE.Box3().setFromObject(vrm.scene);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    
    console.log('🔍 [VRMLoader] VRM Bounding Box:');
    console.log('   Size:', size);
    console.log('   Center:', center);
    console.log('   Min:', bbox.min);
    console.log('   Max:', bbox.max);
    
    // Position so the model's feet are at Y=0 and centered on X/Z
    vrm.scene.position.set(0, -bbox.min.y, 0);

    // VRM models typically face +Z, but we want them to face -Z (towards camera)
    // Rotate 180 degrees around Y axis
    vrm.scene.rotation.y = Math.PI;

    // Scale adjustment (most VRMs are in meters, standard human ~1.6-1.8m tall)
    // Keep at 1.0 for now, adjust if needed based on your specific model
    vrm.scene.scale.setScalar(1.0);

    // Add box helper to visualize bounds
    const boxHelper = new THREE.BoxHelper(vrm.scene, 0xff00ff);
    vrm.scene.add(boxHelper);
    console.log('🟢 [VRMLoader] Added bounding box helper (magenta)');
  }

  /**
   * Get the humanoid bone structure from VRM
   * Useful for animation retargeting
   */
  public getHumanoid(vrm: VRM) {
    return vrm.humanoid;
  }

  /**
   * Helper method to get specific bone from VRM humanoid
   * 
   * @param vrm - VRM instance
   * @param boneName - Name of the humanoid bone (e.g., 'hips', 'head', 'leftHand')
   * @returns THREE.Object3D or null if not found
   */
  public getBone(vrm: VRM, boneName: string): THREE.Object3D | null {
    try {
      // @ts-expect-error - VRM humanoid bone names are dynamic
      const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
      return bone || null;
    } catch {
      return null;
    }
  }

  /**
   * Update VRM (called each frame)
   * Required for VRM's internal updates (springs, constraints, etc.)
   * 
   * @param vrm - VRM instance
   * @param delta - Time since last frame in seconds
   */
  public update(vrm: VRM, delta: number): void {
    vrm.update(delta);
  }
}
