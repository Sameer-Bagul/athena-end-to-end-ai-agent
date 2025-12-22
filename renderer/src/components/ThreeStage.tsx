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

import { useEffect, useRef, useState } from 'react';
import { AthenaScene } from '../three/AthenaScene';
import { VRMLoaderService } from '../three/VRMLoader';
import { AnimationManager, AnimationAction } from '../three/AnimationManager';
import type { VRM } from '@pixiv/three-vrm';

interface ThreeStageProps {
  className?: string;
  onReady?: (manager: AnimationManager) => void;
  onError?: (error: Error) => void;
}

export const ThreeStage: React.FC<ThreeStageProps> = ({ 
  className = '', 
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

        // Step 5: Start idle animation
        setLoadingStatus('Starting idle animation...');
        console.log('🔵 [ThreeStage] Step 5: Starting idle animation...');
        animationManager.play(AnimationAction.IDLE);
        console.log('✅ [ThreeStage] Idle animation started');

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
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Three.js canvas container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white" />
            </div>
            <p className="text-white text-lg font-medium">{loadingStatus}</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 backdrop-blur-sm">
          <div className="text-center max-w-md p-6 bg-red-950/80 rounded-lg">
            <h3 className="text-white text-xl font-bold mb-2">Error Loading 3D Environment</h3>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeStage;
