import { useEffect, useRef, useState, memo, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AthenaScene } from '../three/AthenaScene';
import { AnimationManager, AnimationAction } from '../three/AnimationManager';
import { LipSyncManager } from '../three/LipSyncManager';
import { NaturalPresenceManager } from '../lib/NaturalPresenceManager';
import { useAppStore } from '../context/AppContext';

import type { FacialExpression } from '../lib/facialMapping';

export interface ThreeStageHandle {
  playAudio: (blob: Blob | null, animation?: string, facialExpressions?: FacialExpression[], isMuted?: boolean) => Promise<void>;
  stopAudio: () => void;
  playAnimationAction: (action: AnimationAction) => void;
  captureScreenshot: (width?: number, height?: number) => string;
  animationManager?: AnimationManager;
}

interface ThreeStageProps {
  vrmUrl: string;
  animationUrl?: string;
  isPlaying: boolean;
  animationSpeed: number;
  lightIntensity: number;
  cameraFov: number;
  gridVisible: boolean;
  environmentVisible?: boolean;
  shadowsEnabled: boolean;
  backgroundColor: string;
  speechText?: string;
  cameraMode: string;
  cameraDeviceId?: string;
  onReady?: () => void;
  onDrop?: (file: File) => void;
  onError?: (error: string) => void;
  onThumbnailGenerated?: (image: string) => void;
}

const ThreeStageComponent = forwardRef<ThreeStageHandle, ThreeStageProps>(({
  vrmUrl,
  animationUrl,
  isPlaying,
  animationSpeed,
  lightIntensity,
  cameraFov,
  gridVisible,
  environmentVisible,
  cameraMode,
  cameraDeviceId,
  onReady,
  onError,
  onThumbnailGenerated
}, ref) => {
  const { state, actions } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AthenaScene | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const lipSyncRef = useRef<LipSyncManager | null>(null);
  const naturalPresenceRef = useRef<NaturalPresenceManager>(new NaturalPresenceManager());
  const vrmRef = useRef<VRM | null>(null);

  // Refs for callbacks to prevent unnecessary effect re-runs
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onThumbnailGeneratedRef = useRef(onThumbnailGenerated);
  const actionsRef = useRef(actions);

  // Consolidated ref updates to reduce effect overhead
  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    onThumbnailGeneratedRef.current = onThumbnailGenerated;
    actionsRef.current = actions;
  }, [onReady, onError, onThumbnailGenerated, actions]);

  // Helper to format animation name for UI
  const formatAnimStatus = useCallback((action: string) => {
    if (!action) return "Idle";
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Initializing scene...");
  const [error, setError] = useState<string | null>(null);
  const [isVrmReady, setIsVrmReady] = useState(false);

  useImperativeHandle(ref, () => ({
    playAudio: async (blob: Blob | null, animation?: string, facialExpressions?: FacialExpression[], isMuted: boolean = false) => {
      if (animationManagerRef.current) {
        const action = (animation as AnimationAction) || AnimationAction.THINKING;

        if (facialExpressions && facialExpressions.length > 0) {
          animationManagerRef.current.playWithFacial(action, facialExpressions);
        } else {
          if (animationManagerRef.current.isAnimationLoaded(action)) {
            animationManagerRef.current.play(action);
          } else {
            animationManagerRef.current.play(AnimationAction.THINKING);
          }
        }
        actionsRef.current.setCurrentAnimation(formatAnimStatus(action));
      }

      if (lipSyncRef.current && blob) {
        await lipSyncRef.current.playAudio(blob, isMuted);
      } else if (!blob) {
        await new Promise(r => setTimeout(r, 2000));
      }

      if (animationManagerRef.current) {
        animationManagerRef.current.play(AnimationAction.RELAX);
        actionsRef.current.setCurrentAnimation("Idle");
      }
    },
    stopAudio: () => {
      if (lipSyncRef.current) {
        lipSyncRef.current.stop();
      }
    },
    playAnimationAction: (action: AnimationAction) => {
      if (animationManagerRef.current) {
        animationManagerRef.current.play(action);
        actionsRef.current.setCurrentAnimation(formatAnimStatus(action));
      }
    },
    captureScreenshot: (width?: number, height?: number) => {
      if (sceneRef.current) {
        return sceneRef.current.captureScreenshot(width, height);
      }
      return '';
    },
    animationManager: animationManagerRef.current ?? undefined
  }));

  // 1. Scene Initialization (Once)
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new AthenaScene();
    scene.init(containerRef.current);
    sceneRef.current = scene;

    animationManagerRef.current = new AnimationManager();
    lipSyncRef.current = new LipSyncManager();

    const updateCallback = (delta: number) => {
      if (vrmRef.current) {
        vrmRef.current.update(delta);
      }
      if (animationManagerRef.current) {
        animationManagerRef.current.update(delta);
      }
      if (lipSyncRef.current) {
        lipSyncRef.current.update(delta);
      }
      naturalPresenceRef.current.update(delta);
    };
    scene.onUpdate(updateCallback);

    return () => {
      scene.removeUpdateCallback(updateCallback);
      scene.dispose();
      if (animationManagerRef.current) animationManagerRef.current.dispose();
      sceneRef.current = null;
    };
  }, []);

  // 2. Play/Pause state (Stand pose)
  useEffect(() => {
    if (!animationManagerRef.current || !isVrmReady) return;

    if (isPlaying) {
      if (animationUrl) {
        const name = animationUrl.split('/').pop()?.replace('.vrma', '').replace('.fbx', '') || "Animation";
        actionsRef.current.setCurrentAnimation(formatAnimStatus(name));
        animationManagerRef.current.loadAnimationFromUrl(animationUrl).catch(e => console.error("Resume Anim Error:", e));
      }
    } else {
      animationManagerRef.current.resetToStandPose();
      actionsRef.current.setCurrentAnimation("Paused");
    }
  }, [isPlaying, isVrmReady, animationUrl, formatAnimStatus]);

  // 3. VRM Loading (Strictly on vrmUrl change)
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

        const gltf = await loader.loadAsync(vrmUrl);

        if (isCancelled) {
          VRMUtils.deepDispose(gltf.scene);
          return;
        }

        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) throw new Error("Failed to parse VRM.");

        if (vrmRef.current) {
          naturalPresenceRef.current.dispose();
          sceneRef.current!.remove(vrmRef.current.scene);
          VRMUtils.deepDispose(vrmRef.current.scene);
          vrmRef.current = null;
        }

        vrmRef.current = vrm;
        sceneRef.current!.add(vrm.scene);

        animationManagerRef.current!.initialize(vrm);
        lipSyncRef.current!.setVRM(vrm);
        naturalPresenceRef.current.initialize(vrm, sceneRef.current!.getCamera(), cameraDeviceId);

        try {
          await animationManagerRef.current!.loadAllAnimations();
        } catch (e) {
          console.warn("Failed to load standard animations", e);
        }

        vrm.scene.rotation.y = Math.PI;

        const headNode = vrm.humanoid.getNormalizedBoneNode('head');
        if (headNode) {
          const headPos = new THREE.Vector3();
          headNode.getWorldPosition(headPos);
          const targetPos = headPos.clone().add(new THREE.Vector3(0, 0.05, 0.5));
          sceneRef.current!.setCameraTarget(targetPos, headPos);

          setTimeout(() => {
            if (isCancelled || !sceneRef.current || !vrmRef.current) return;
            vrmRef.current.update(0.016);
            const screenshot = sceneRef.current.captureScreenshot();
            if (onThumbnailGeneratedRef.current && screenshot) {
              onThumbnailGeneratedRef.current(screenshot);
            }
          }, 150);
        }

        setIsVrmReady(true);
        setLoadingStatus("Ready");
        setIsLoading(false);
        if (onReadyRef.current) onReadyRef.current();

      } catch (err) {
        if (!isCancelled) {
          const error = err as Error;
          console.error("VRM Load Error:", error);
          setError(error.message || "Failed to load VRM");
          setIsLoading(false);
          setIsVrmReady(false);
          if (onErrorRef.current) onErrorRef.current(error.message);
        }
      }
    };

    loadVRM();
    return () => { isCancelled = true; };
  }, [vrmUrl, cameraDeviceId]);

  // 4. Camera Device Management
  useEffect(() => {
    if (cameraDeviceId !== undefined) {
      naturalPresenceRef.current.setCameraDevice(cameraDeviceId);
    }
  }, [cameraDeviceId]);

  // 5. Animation Speed and Time Scale
  useEffect(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.setTimeScale(animationSpeed);
    }
  }, [animationSpeed]);

  // 6. Camera Mode (Zoom/Face/Half)
  useEffect(() => {
    if (!sceneRef.current || !vrmRef.current || !isVrmReady) return;

    const headNode = vrmRef.current.humanoid.getNormalizedBoneNode('head');
    if (!headNode) return;

    const headPos = new THREE.Vector3();
    headNode.getWorldPosition(headPos);

    if (cameraMode === 'face') {
      const eyePos = headPos.clone().add(new THREE.Vector3(0, 0.12, 0));
      const targetPos = eyePos.clone().add(new THREE.Vector3(0, 0.0, 0.35));
      sceneRef.current.setCameraTarget(targetPos, eyePos);
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
      sceneRef.current.setCameraTarget(new THREE.Vector3(0, 1.2, 2.5), new THREE.Vector3(0, 1.0, 0));
    }
  }, [cameraMode, isVrmReady]);

  // 7. Light/Grid/Background Cleanup
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setLightIntensity(lightIntensity);
  }, [lightIntensity]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setGridVisible(gridVisible);
  }, [gridVisible]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setEnvironmentVisible(environmentVisible ?? true);
  }, [environmentVisible]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setCameraFov(cameraFov);
  }, [cameraFov]);

  // Dynamic Scene Settings
  useEffect(() => {
    const s = state.sceneSettings;
    if (!sceneRef.current || !s) return;

    sceneRef.current.setBackground(s.bgColor, s.bgColor, s.bgColor); // Simplified for now
    sceneRef.current.setLightColors(s.keyLightColor, s.fillLightColor, s.backLightColor);
    sceneRef.current.setGridColor(s.gridColor, s.gridColor);
    sceneRef.current.setFloorSettings(s.floorOpacity, s.bgColor);
  }, [state.sceneSettings, isVrmReady]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
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
});

export default memo(ThreeStageComponent);
