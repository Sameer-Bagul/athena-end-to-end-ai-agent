import { useRef, useCallback } from 'react';
import ThreeStage from './components/ThreeStage';
import { AnimationManager } from './three/AnimationManager';

function App() {
  const animationManagerRef = useRef<AnimationManager | null>(null);

  const handleReady = useCallback((manager: AnimationManager) => {
    animationManagerRef.current = manager;
    console.log('✅ Athena is ready!');
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('❌ Failed to load Athena:', error);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-white overflow-hidden">
      <ThreeStage 
        onReady={handleReady}
        onError={handleError}
      />
    </div>
  );
}

export default App;
