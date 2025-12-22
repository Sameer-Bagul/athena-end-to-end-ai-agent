import { useRef, useState } from 'react';
import ThreeStage from './components/ThreeStage';
import { AnimationManager, AnimationAction } from './three/AnimationManager';
import './App.css';

function App() {
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationAction>(AnimationAction.IDLE);

  const handleReady = (manager: AnimationManager) => {
    animationManagerRef.current = manager;
    setIsReady(true);
    console.log('Athena is ready!');
  };

  const handleError = (error: Error) => {
    console.error('Failed to load Athena:', error);
  };

  const playAnimation = (action: AnimationAction) => {
    if (animationManagerRef.current) {
      animationManagerRef.current.play(action);
      setCurrentAnimation(action);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white">Athena</h1>
          <p className="text-sm text-purple-300">AI Assistant v1.0</p>
        </div>
        <div className="text-sm text-white/60">
          {isReady ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Ready
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Loading...
            </span>
          )}
        </div>
      </header>

      {/* Main 3D Stage */}
      <div className="flex-1 relative overflow-hidden">
        <ThreeStage 
          className="w-full h-full"
          onReady={handleReady}
          onError={handleError}
        />
      </div>

      {/* Control Panel */}
      {isReady && (
        <div className="flex-shrink-0 p-3 bg-black/30 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xs font-semibold text-white/80 mb-2">Animation Controls</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.values(AnimationAction).map((action) => (
                <button
                  key={action}
                  onClick={() => playAnimation(action)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                    currentAnimation === action
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {action.toLowerCase()}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-2">
              Click buttons to switch animations
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
