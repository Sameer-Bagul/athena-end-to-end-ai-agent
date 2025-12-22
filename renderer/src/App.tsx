import { useRef, useCallback, useState } from 'react';
import ThreeStage from './components/ThreeStage';
import { AnimationManager, AnimationAction } from './three/AnimationManager';

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

  return (
    <div className="fixed inset-0 w-screen h-screen bg-linear-to-br from-purple-950 via-black to-black overflow-hidden">
      <ThreeStage 
        onReady={handleReady}
        onError={handleError}
      />
      
      {/* Animation Controls */}
      {isReady && (
        <div className="fixed top-4 right-4 flex flex-col gap-2 max-w-xs">
          {/* Play/Stop Button */}
          <button
            onClick={toggleAnimation}
            className={`px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-200 ${
              animationEnabled
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {animationEnabled ? '⏸ Stop Animation' : '▶ Play Animation'}
          </button>

          {/* Animation Selection */}
          <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-3 max-h-[70vh] overflow-y-auto">
            <div className="text-white text-sm font-semibold mb-2">Select Animation:</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(AnimationAction).map(([key, value]) => (
                <button
                  key={value}
                  onClick={() => playAnimation(value)}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    currentAnimation === value && animationEnabled
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs">
            <div>Status: {animationEnabled ? 'Playing' : 'Stopped'}</div>
            <div className="text-white/60 mt-1">
              Current: {currentAnimation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
