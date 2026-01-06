import { useEffect, useRef, useState, memo, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AthenaScene } from '../three/AthenaScene';
import { AnimationManager, AnimationAction } from '../three/AnimationManager';
import { LipSyncManager } from '../three/LipSyncManager';
import { NaturalPresenceManager } from '../lib/NaturalPresenceManager';

export interface ThreeStageHandle {
  playAudio: (blob: Blob) => Promise<void>;
  stopAudio: () => void;
  playAnimationAction: (action: AnimationAction) => void;
  captureScreenshot: (width?: number, height?: number) => string;
}

interface ThreeStageProps {
  vrmUrl: string;
  animationUrl?: string; // Legacy/File-based animation
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
  shadowsEnabled,
  backgroundColor,
  speechText,
  cameraMode,
  onReady,
  onError,
  onThumbnailGenerated
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AthenaScene | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const lipSyncRef = useRef<LipSyncManager | null>(null);
  const naturalPresenceRef = useRef<NaturalPresenceManager>(new NaturalPresenceManager());
  const vrmRef = useRef<VRM | null>(null);

  // State for loading
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState("Initializing scene...");
  const [error, setError] = useState<string | null>(null);
  const [isVrmReady, setIsVrmReady] = useState(false);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    playAudio: (blob: Blob) => {
      if (lipSyncRef.current) {
        return lipSyncRef.current.playAudio(blob);
      }
      return Promise.resolve();
    },
    stopAudio: () => {
      if (lipSyncRef.current) {
        lipSyncRef.current.stop();
      }
    },
    playAnimationAction: (action: AnimationAction) => {
      if (animationManagerRef.current) {
        animationManagerRef.current.play(action);
      }
    },
    captureScreenshot: (width?: number, height?: number) => {
      if (sceneRef.current) {
        return sceneRef.current.captureScreenshot(width, height);
      }
      return '';
    }
  }));

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new AthenaScene();
    scene.init(containerRef.current);
    sceneRef.current = scene;

    // Managers
    animationManagerRef.current = new AnimationManager();
    lipSyncRef.current = new LipSyncManager();

    // Register ONE stable update callback
    const updateCallback = (delta: number) => {
      // Update VRM if loaded
      if (vrmRef.current) {
        vrmRef.current.update(delta);
      }
      // Update Managers (they persist across models)
      if (animationManagerRef.current) {
        animationManagerRef.current.update(delta);
      }
      if (lipSyncRef.current) {
        lipSyncRef.current.update(delta);
      }
      // Update Natural Presence
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

  // Handle Play/Pause (Switch to Idle vs Custom)
  useEffect(() => {
    if (!animationManagerRef.current || !isVrmReady) return;

    if (isPlaying) {
      // PLAY: Resume/Replay the custom animation
      if (animationUrl) {
        animationManagerRef.current.loadAnimationFromUrl(animationUrl).catch(e => console.error("Resume Anim Error:", e));
      }
    } else {
      // STOP: Switch to Static Stand Pose (User Request)
      animationManagerRef.current.resetToStandPose();
    }
  }, [isPlaying, isVrmReady]); // Trigger when Play state toggles

  // Update Animation Speed
  useEffect(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.setTimeScale(animationSpeed);
    }
  }, [animationSpeed]);
  useEffect(() => {
    // sceneRef.current?.setShadowsEnabled(shadowsEnabled);
  }, [shadowsEnabled]);

  // Debug: specific log to see WHY this effect runs
  useEffect(() => {
    console.log("[ThreeStage] VRM Load Effect Triggered");
    console.log(" - vrmUrl:", vrmUrl);
    console.log(" - onThumbnailGenerated changed?", onThumbnailGenerated);
  }, [vrmUrl, onThumbnailGenerated]);

  // Load VRM
  useEffect(() => {
    if (!sceneRef.current || !vrmUrl) return;

    let isCancelled = false;
    console.log(`[ThreeStage] Starting VRM Load: ${vrmUrl} `);

    const loadVRM = async () => {
      try {
        setIsLoading(true);
        // ... (rest of function)
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
          // Cleanup old behaviors
          naturalPresenceRef.current.dispose();

          sceneRef.current!.remove(vrmRef.current.scene);
          VRMUtils.deepDispose(vrmRef.current.scene);
          vrmRef.current = null;
        }

        vrmRef.current = vrm;
        sceneRef.current!.add(vrm.scene);

        // Initialize Managers
        animationManagerRef.current!.initialize(vrm);
        lipSyncRef.current!.setVRM(vrm);

        // --- NEW: Natural Presence Features (Blink, Idle, Head Follow) ---
        // Initialize Natural Presence (Async)
        naturalPresenceRef.current.initialize(vrm, sceneRef.current!.getCamera());

        // -------------------------------------------------------------

        // Preload standard animations
        try {
          await animationManagerRef.current!.loadAllAnimations();
        } catch (e) {
          console.warn("Failed to load standard animations", e);
        }

        vrm.scene.rotation.y = Math.PI; // Face the camera

        // --- Auto-Thumbnail Generation ---
        // 1. Position camera to face
        const headNode = vrm.humanoid.getNormalizedBoneNode('head');
        if (headNode) {
          const headPos = new THREE.Vector3();
          headNode.getWorldPosition(headPos);
          const targetPos = headPos.clone().add(new THREE.Vector3(0, 0.05, 0.5)); // Close up
          sceneRef.current!.setCameraTarget(targetPos, headPos);

          // 2. Force Render & Capture
          // Add a small delay to ensure textures/shaders are fully ready on GPU
          setTimeout(() => {
            if (!sceneRef.current || !vrm) return;

            // Ensure transforms
            vrm.update(0.016);

            // Capture
            const screenshot = sceneRef.current.captureScreenshot();
            if (onThumbnailGenerated && screenshot) {
              onThumbnailGenerated(screenshot);
            }

            // 3. Reset Camera
            sceneRef.current.setCameraTarget(
              new THREE.Vector3(0, 1.2, 2.5),
              new THREE.Vector3(0, 1.0, 0)
            );
          }, 150);
        }
        // ---------------------------------

        // NOTE: We do NOT register a new onUpdate callback here.
        // The main scene loop handles vrmRef.current directly.

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
    };
  }, [vrmUrl, onThumbnailGenerated]);

  // Handle Animation Loading
  useEffect(() => {
    // Animation loading logic needs to re-run when animationUrl changes OR when vrm becomes ready
    if (!animationManagerRef.current || !animationUrl || !isVrmReady) return;

    const loadAnim = async () => {
      try {
        if (animationUrl.startsWith('/') || animationUrl.startsWith('blob:') || animationUrl.startsWith('animations/')) {
          // We might want to ensure we don't load if it's already same?
          // AnimationManager might handle it, but for safety:
          await animationManagerRef.current!.loadAnimationFromUrl(animationUrl);
        }
      } catch (err) {
        console.error('[ThreeStage] Animation Load Error:', err);
      }
    };

    loadAnim();
  }, [animationUrl, isVrmReady]);

  // Handle Speech (Legacy prop)
  useEffect(() => {
    // Legacy support or removal? 
    // LipSyncManager now expects playAudio(blob). 
    // If speechText is still passed, we might ignore it or try to fetch?
    // For now, let's ignore it as we are moving to blob based flow.
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
});

export default memo(ThreeStageComponent);
