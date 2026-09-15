import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, VRMAnimation, createVRMAnimationClip } from '@pixiv/three-vrm-animation';

export class AthenaVRMLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
    this.loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
  }

  async load(url: string, onProgress?: (progress: number) => void): Promise<VRM> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm as VRM;
          if (!vrm) {
            reject(new Error('Loaded model does not contain valid VRM data.'));
            return;
          }

          // Optimization & shadow setup
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.combineSkeletons(gltf.scene);

          vrm.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              mesh.frustumCulled = false;
            }
          });

          // Rotate avatar to face camera correctly
          VRMUtils.rotateVRM0(vrm);

          resolve(vrm);
        },
        (event) => {
          if (onProgress && event.total > 0) {
            onProgress(event.loaded / event.total);
          }
        },
        (error) => reject(error)
      );
    });
  }

  async loadAnimation(url: string, vrm: VRM): Promise<THREE.AnimationClip> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const vrmAnimations = gltf.userData.vrmAnimations as VRMAnimation[];
          if (!vrmAnimations || vrmAnimations.length === 0) {
            reject(new Error('No valid VRMA animation data found in file.'));
            return;
          }
          const clip = createVRMAnimationClip(vrmAnimations[0], vrm);
          resolve(clip);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
}
