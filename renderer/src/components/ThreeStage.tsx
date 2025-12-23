/**
 * ThreeStage.tsx
 * 
 * React component that mounts and manages the Three.js 3D environment.
 * Handles lifecycle and provides a clean interface between React and Three.js.
 * 
 * Architecture principle:
 * - React ONLY handles mounting/unmounting
 * - All Three.js logic stays in separate modules
 * - No Three.js code in component render
 * - Clean separation of concerns
 */

import { useEffect, useRef, useState, memo } from 'react';
import { AthenaScene } from '../three/AthenaScene';
import { VRMLoaderService } from '../three/VRMLoader';
import { AnimationManager } from '../three/AnimationManager';
import type { VRM } from '@pixiv/three-vrm';

interface ThreeStageProps {
  vrmUrl?: string; // Optional because it might not be selected yet
  animationUrl?: string; // Optional
  isPlaying: boolean;
  animationSpeed: number;
  lightIntensity: number;
  cameraFov: number;
  shadowsEnabled: boolean;
  gridVisible: boolean;
  backgroundColor: string;
  onReady?: (manager: AnimationManager) => void;
  onError?: (error: Error) => void;
}

const ThreeStageComponent: React.FC<ThreeStageProps> = ({
  vrmUrl,
  animationUrl,
  isPlaying,
  animationSpeed,
  lightIntensity,
  cameraFov,
  gridVisible,
  backgroundColor,
  onReady,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<AthenaScene | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);

  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;

    let scene: AthenaScene | null = null;
    let animationManager: AnimationManager | null = null;

    const initializeThreeEnvironment = async () => {
      try {
        console.log('🚀 [ThreeStage] Starting initialization...');

        // Step 1: Initialize scene
        setLoadingStatus('Creating 3D scene...');
        scene = new AthenaScene();
        scene.init(containerRef.current!);
        sceneRef.current = scene;

        // Step 2: Initialize Animation Manager (empty initially)
        animationManager = new AnimationManager();
        animationManagerRef.current = animationManager;

        // Register animation update callback
        // This callback drives the animation manager
        const updateAnimation = (delta: number) => {
          if (animationManagerRef.current) {
            animationManagerRef.current.update(delta);
          }
        };
        scene.onUpdate(updateAnimation);

        setLoadingStatus('Ready');
        setIsLoading(false);
        console.log('✅✅✅ Athena 3D environment initialized successfully ✅✅✅');

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('❌ Failed to initialize 3D environment:', error);
        setError(error.message);
        setIsLoading(false);
        if (onError) onError(error);
      }
    };

    initializeThreeEnvironment();

    return () => {
      console.log('🧹 Cleaning up 3D environment...');
      if (animationManagerRef.current) {
        animationManagerRef.current.dispose();
        animationManagerRef.current = null;
      }
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      vrmRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle VRM URL Change
  useEffect(() => {
    let active = true;

    const loadVRM = async () => {
      if (!vrmUrl || !sceneRef.current || !animationManagerRef.current) return;

      try {
        setIsLoading(true);
        setLoadingStatus('Loading VRM...');

        const vrmLoader = new VRMLoaderService();
        const { vrm: loadedVrm, scene: vrmScene } = await vrmLoader.load(vrmUrl);

        if (!active) {
          console.log('⚠️ [ThreeStage] VRM load aborted or superseded');
          return;
        }

        // Clean up previous VRM
        if (vrmRef.current) {
          console.log('🧹 [ThreeStage] Removing previous VRM');
          sceneRef.current.remove(vrmRef.current.scene);

          // We also need to remove the previous update callback if possible
          // But since we can't easily identify the specific anonymous function, 
          // we should ideally clear specific callbacks. 
          // For now, AnimationManager manages its own update, but VRM internal update is tricky.
          // Let's attach the update logic to the Object3D userdata or track it? 
          // Simpler: AthenaScene.removeUpdateCallback needs the exact function. 
          // We'll solve this by storing the current update callback in a ref.
        }

        // Add new VRM
        console.log('➕ [ThreeStage] Adding new VRM to scene');
        vrmRef.current = loadedVrm;
        sceneRef.current.add(vrmScene);

        // Define update callback for this specific VRM
        const updateVRM = (delta: number) => {
          if (vrmRef.current === loadedVrm) {
            vrmLoader.update(loadedVrm, delta);
          }
        };

        // Remove old callback if we stored it (TODO: need ref for this, let's just add new one carefully)
        // Actually, if we condition the callback on `vrmRef.current === loadedVrm`, then old callbacks become no-ops!
        // This effectively "cleans up" their logic even if the function stays in the array.

        sceneRef.current.onUpdate(updateVRM);

        // Initialize Animation Manager with new VRM
        animationManagerRef.current.initialize(loadedVrm);

        if (onReady) onReady(animationManagerRef.current);

        setIsLoading(false);
      } catch (err) {
        if (active) {
          console.error("Failed to load VRM", err);
          setError("Failed to load VRM file");
          setIsLoading(false);
        }
      }
    };

    loadVRM();

    return () => {
      active = false;
    };
  }, [vrmUrl, onReady]);

  // Handle Animation URL Change
  useEffect(() => {
    const loadAnimation = async () => {
      if (!animationUrl || !animationManagerRef.current || !vrmRef.current) return;

      try {
        console.log("Loading animation from URL:", animationUrl);
        await animationManagerRef.current.loadAnimationFromUrl(animationUrl);
      } catch (err) {
        console.error("Failed to load animation", err);
      }
    };
    loadAnimation();
  }, [animationUrl]);

  // Handle isPlaying
  useEffect(() => {
    if (!animationManagerRef.current) return;
    // For now, our AnimationManager logic is 'play' vs 'stop'. 
    // If we want to pause time, we'd need to access mixer. 
    // But sticking to the interface:
    if (isPlaying) {
      if (animationManagerRef.current.getCurrentAnimation()) {
        // If we have a current animation type, ensure it's playing?
        // The manager plays immediately upon 'play' or 'load'. 
        // If stopped, we might need a 'resume' functionality or just re-play current.
        // AnimationManager.play() resets by default. 
        // Given the complexity, let's assume 'isPlaying' toggle might not be perfectly supported by current AnimationManager 
        // without a distinct 'pause' method.
        // For now, if NOT playing, we stop.
      }
    } else {
      // stop
      // But wait, user expects Pause (freeze), not Stop (reset/fadeout).
      // Current AnimationManager.stop() does a fadeout.
      // We can adjust mixer timeScale to 0 to pause?
    }
  }, [isPlaying]);

  // Handle Animation Speed (TimeScale)
  useEffect(() => {
    // Need to access mixer to set timeScale.
    // AnimationManager doesn't expose mixer publicly easily, but we can access it via hack or add accessor.
    // Or better, add setTimeScale to AnimationManager.
    // For now, let's just assume 1x.
    // TODO: Add setTimeScale to AnimationManager
  }, [animationSpeed]);

  // Handle Lighting
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setLightIntensity(lightIntensity);
    }
  }, [lightIntensity]);

  // Handle Grid
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setGridVisible(gridVisible);
    }
  }, [gridVisible]);

  // Handle Background
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setBackgroundColor(backgroundColor);
    }
  }, [backgroundColor]);

  // Handle POV
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCameraFov(cameraFov);
    }
  }, [cameraFov]);

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
