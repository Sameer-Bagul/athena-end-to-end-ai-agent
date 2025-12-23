import { useRef, useCallback, useState } from 'react';
import ThreeStage from './components/ThreeStage';
import { AnimationManager, AnimationAction } from './three/AnimationManager';
import { ControlPanel } from './components/ControlPanel';

function App() {
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationAction>(AnimationAction.RELAX);

  const handleReady = useCallback((manager: AnimationManager) => {
    animationManagerRef.current = manager;
    setIsReady(true);
    // Auto-play Relax animation as default
    manager.play(AnimationAction.RELAX);
    setCurrentAnimation(AnimationAction.RELAX);
    setAnimationEnabled(true);
    console.log('✅ Athena is ready with VRMA animations!');
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('❌ Failed to load Athena:', error);
  }, []);

  const toggleAnimation = () => {
    if (!animationManagerRef.current) return;

    if (animationEnabled) {
      // Stop animation
      animationManagerRef.current.stop();
      setAnimationEnabled(false);
      console.log('🛑 Animation stopped');
    } else {
      // Start animation
      animationManagerRef.current.play(currentAnimation);
      setAnimationEnabled(true);
      console.log('▶️ Animation started');
    }
  };

  const playAnimation = (action: AnimationAction) => {
    console.log(`🎮 Button clicked for animation: ${action}`);
    if (!animationManagerRef.current) {
      console.error('❌ Animation manager not ready');
      return;
    }
    animationManagerRef.current.play(action);
    setCurrentAnimation(action);
    setAnimationEnabled(true);
    console.log(`✅ Animation changed to: ${action}`);
  };

  const handleFileUpload = (file: File) => {
    console.log('📂 File uploaded:', file);
    // TODO: Implement VRM loading logic
    // This would involve passing the file to the VRMLoaderService
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden font-sans text-white">
      {/* 3D Scene Area (75% approx / Flex-1) */}
      <div className="flex-1 relative h-full bg-linear-to-br from-purple-950 via-black to-black">
        <ThreeStage
          onReady={handleReady}
          onError={handleError}
        />

        {/* Loading Overlay for 3D Area */}
        {!isReady && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-lg font-bold text-white">Initialize...</h2>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Controls (Fixed width) */}
      <div className="w-100 shrink-0 relative z-50 h-full">
        <ControlPanel
          currentAnimation={currentAnimation}
          onAnimationChange={playAnimation}
          isPlaying={animationEnabled}
          onTogglePlay={toggleAnimation}
          isReady={isReady}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
}

export default App;
