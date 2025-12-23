import React, { useEffect, useRef, useState, memo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AthenaScene } from '../three/AthenaScene';
import { AnimationManager } from '../three/AnimationManager';
import { LipSyncManager } from '../three/LipSyncManager';

interface ThreeStageProps {
  vrmUrl: string;
  animationUrl?: string;
  isPlaying: boolean;
  animationSpeed: number;
  lightIntensity: number;
  cameraFov: number;
  gridVisible: boolean;
  shadowsEnabled: boolean;
  backgroundColor: string;
  speechText?: string;
  cameraMode: string;
  onReady?: () => void;
  onError?: (error: string) => void;
}

const ThreeStageComponent: React.FC<ThreeStageProps> = ({
  vrmUrl,
  animationUrl,
  isPlaying,
  animationSpeed,
  lightIntensity,
  cameraFov,
  gridVisible,
  shadowsEnabled,
  backgroundColor,
  speechText,
  cameraMode,
  onReady,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AthenaScene | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const lipSyncRef = useRef<LipSyncManager | null>(null);
  const vrmRef = useRef<VRM | null>(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Initializing scene...");
  const [error, setError] = useState<string | null>(null);
  const [isVrmReady, setIsVrmReady] = useState(false);

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new AthenaScene();
    scene.init(containerRef.current);
    sceneRef.current = scene;

    // Managers
    animationManagerRef.current = new AnimationManager();
    lipSyncRef.current = new LipSyncManager();

    return () => {
      scene.dispose();
      if (animationManagerRef.current) animationManagerRef.current.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Use IsPlaying prop (Future impl or current if AnimationManager supports it)
  useEffect(() => {
    // Placeholder for play/pause logic if needed
    // if (animationManagerRef.current) ...
  }, [isPlaying]);

  // Update Animation Speed
  useEffect(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.setTimeScale(animationSpeed);
    }
  }, [animationSpeed]);

  // Update Shadows (if Scene supports execution, otherwise placeholder)
  useEffect(() => {
    // sceneRef.current?.setShadowsEnabled(shadowsEnabled);
  }, [shadowsEnabled]);

  // Load VRM
  useEffect(() => {
    if (!sceneRef.current || !vrmUrl) return;

    let isCancelled = false;

    const loadVRM = async () => {
      try {
        setIsLoading(true);
        setIsVrmReady(false);
        setLoadingStatus(`Loading VRM: ${vrmUrl.split('/').pop()}...`);
        setError(null);

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        const gltf = await loader.loadAsync(vrmUrl, (_progress) => {
          // Progress callback
        });

        if (isCancelled) {
          // If cancelled, dispose what we just loaded
          VRMUtils.deepDispose(gltf.scene);
          return;
        }

        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          throw new Error("Failed to parse VRM.");
        }

        // Success: Replace old model with new one in a single transaction
        if (vrmRef.current) {
          sceneRef.current!.remove(vrmRef.current.scene);
          VRMUtils.deepDispose(vrmRef.current.scene);
          vrmRef.current = null;
        }

        vrmRef.current = vrm;
        sceneRef.current!.add(vrm.scene);

        animationManagerRef.current!.initialize(vrm);
        lipSyncRef.current!.setVRM(vrm);

        vrm.scene.rotation.y = Math.PI; // Face the camera

        const updateCallback = (delta: number) => {
          vrm.update(delta);
          if (animationManagerRef.current) {
            animationManagerRef.current.update(delta);
          }
          if (lipSyncRef.current) {
            lipSyncRef.current.update(delta);
          }
        };

        sceneRef.current!.onUpdate(updateCallback);

        setIsVrmReady(true);
        setLoadingStatus("Ready");
        setIsLoading(false);
        if (onReady) onReady();

      } catch (err: any) {
        if (!isCancelled) {
          console.error("VRM Load Error:", err);
          setError(err.message || "Failed to load VRM");
          setIsLoading(false);
          setIsVrmReady(false);
          if (onError) onError(err.message);
        }
      }
    };

    loadVRM();

    return () => {
      isCancelled = true;
      // If we have a vrmRef, do we clean it up here?
      // NO. If we unmount, we should dispose.
      // If we just switch URL, we do NOT want to dispose the *old* one yet? 
      // Actually, we DO want to remove the old one immediately if we start a new load.
      // But the new effect will handle removal of vrmRef.current.

      // HOWEVER, what if the component unmounts entirely?
      // We rely on Main useEffect's scene.dispose()! 
      // AthenaScene.dispose() clears the scene.

      // So this cleanup acts primarily as a flag to cancel pending async work.
    };
  }, [vrmUrl]);

  // Handle Animation Loading
  useEffect(() => {
    if (!animationManagerRef.current || !animationUrl || !isVrmReady) return;

    const loadAnim = async () => {
      try {
        if (animationUrl.startsWith('/') || animationUrl.startsWith('blob:')) {
          await animationManagerRef.current!.loadAnimationFromUrl(animationUrl);
        }
      } catch (err) {
        console.error("Animation Load Error:", err);
      }
    };

    loadAnim();
  }, [animationUrl, isVrmReady]);

  // Handle Speech
  useEffect(() => {
    if (lipSyncRef.current && speechText) {
      lipSyncRef.current.speak(speechText);
    }
  }, [speechText]);

  // Handle Camera Mode
  useEffect(() => {
    if (!sceneRef.current || !vrmRef.current) return;

    const headNode = vrmRef.current.humanoid.getNormalizedBoneNode('head');
    if (!headNode) return;

    const headPos = new THREE.Vector3();
    headNode.getWorldPosition(headPos);

    if (cameraMode === 'face') {
      const targetPos = headPos.clone().add(new THREE.Vector3(0, 0.05, 0.5));
      sceneRef.current.setCameraTarget(targetPos, headPos);
    } else if (cameraMode === 'half') {
      const hipsNode = vrmRef.current.humanoid.getNormalizedBoneNode('hips');
      if (hipsNode) {
        const hipsPos = new THREE.Vector3();
        hipsNode.getWorldPosition(hipsPos);
        const chestPos = headPos.clone().lerp(hipsPos, 0.5);
        const targetPos = chestPos.clone().add(new THREE.Vector3(0, 0.1, 1.2));
        sceneRef.current.setCameraTarget(targetPos, chestPos);
      }
    } else {
      sceneRef.current.setCameraTarget(
        new THREE.Vector3(0, 1.2, 2.5),
        new THREE.Vector3(0, 1.0, 0)
      );
    }
  }, [cameraMode]);

  // Update scene properties
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setLightIntensity(lightIntensity);
  }, [lightIntensity]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setGridVisible(gridVisible ?? true);
  }, [gridVisible]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (typeof cameraFov === 'number') {
      sceneRef.current.setCameraFov(cameraFov);
    }
  }, [cameraFov]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setBackgroundColor(backgroundColor ?? '#0f0f1e');
  }, [backgroundColor]);


  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="text-center px-8 py-6 bg-black/40 rounded-2xl border border-white/10">
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500" />
            </div>
            <p className="text-white text-xl font-semibold mb-1">{loadingStatus}</p>
            <p className="text-white/50 text-sm">Please wait...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="text-center max-w-lg px-8 py-6 bg-red-950/80 rounded-2xl border border-red-500/20">
            <h3 className="text-white text-2xl font-bold mb-2">Error</h3>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ThreeStageComponent);
