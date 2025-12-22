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
  onReady?: (manager: AnimationManager) => void;
  onError?: (error: Error) => void;
}

const ThreeStageComponent: React.FC<ThreeStageProps> = ({ 
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

  useEffect(() => {
    if (!containerRef.current) return;

    let scene: AthenaScene | null = null;
    let vrm: VRM | null = null;
    let animationManager: AnimationManager | null = null;

    const initializeThreeEnvironment = async () => {
      try {
        console.log('🚀 [ThreeStage] Starting initialization...');
        
        // Step 1: Initialize scene
        setLoadingStatus('Creating 3D scene...');
        console.log('🔵 [ThreeStage] Step 1: Creating scene...');
        scene = new AthenaScene();
        scene.init(containerRef.current!);
        sceneRef.current = scene;
        console.log('✅ [ThreeStage] Scene created and initialized');

        // Step 2: Load VRM avatar
        setLoadingStatus('Loading Athena avatar...');
        console.log('🔵 [ThreeStage] Step 2: Loading VRM...');
        const vrmLoader = new VRMLoaderService();
        const { vrm: loadedVrm, scene: vrmScene } = await vrmLoader.load('/models/athena.vrm');
        vrm = loadedVrm;
        vrmRef.current = vrm;
        console.log('✅ [ThreeStage] VRM loaded successfully');
        console.log('🔍 [ThreeStage] VRM scene:', vrmScene);
        console.log('🔍 [ThreeStage] VRM scene children:', vrmScene.children);

        // Add VRM to scene
        console.log('🔵 [ThreeStage] Adding VRM to scene...');
        scene.add(vrmScene);
        console.log('✅ [ThreeStage] VRM added to scene');

        // Register VRM update callback
        scene.onUpdate((delta) => {
          vrmLoader.update(vrm!, delta);
        });

        // Step 3: Initialize animation manager
        setLoadingStatus('Initializing animation system...');
        console.log('🔵 [ThreeStage] Step 3: Initializing animation manager...');
        animationManager = new AnimationManager();
        animationManager.initialize(vrm);
        animationManagerRef.current = animationManager;
        console.log('✅ [ThreeStage] Animation manager initialized');

        // Register animation update callback
        scene.onUpdate((delta) => {
          animationManager!.update(delta);
        });
        console.log('✅ [ThreeStage] Animation update callback registered');

        // Step 4: Load animations
        setLoadingStatus('Loading animations...');
        console.log('🔵 [ThreeStage] Step 4: Loading all animations...');
        await animationManager.loadAllAnimations();
        console.log('✅ [ThreeStage] All animations loaded');

        // All done!
        setLoadingStatus('Ready');
        setIsLoading(false);

        console.log('🎉 [ThreeStage] All steps complete!');
        console.log('🎉 [ThreeStage] Final scene children count:', scene.getScene().children.length);

        // Notify parent component
        if (onReady && animationManager) {
          onReady(animationManager);
        }

        console.log('✅✅✅ Athena 3D environment initialized successfully ✅✅✅');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('❌ Failed to initialize 3D environment:', error);
        setError(error.message);
        setIsLoading(false);
        
        if (onError) {
          onError(error);
        }
      }
    };

    initializeThreeEnvironment();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up 3D environment...');

      // Dispose animation manager
      if (animationManagerRef.current) {
        animationManagerRef.current.dispose();
        animationManagerRef.current = null;
      }

      // Dispose scene
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }

      // Clear refs
      vrmRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

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
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Error Loading 3D Environment</h3>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ThreeStageComponent);
