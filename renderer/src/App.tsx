import { useState } from "react";
import { VRMControlPanel } from "./components/VRMControlPanel";
import { FBXPlayground } from "./components/FBXPlayground";

function App() {
  const [screen, setScreen] = useState<'main' | 'fbx'>('main');

  return (
    <div className="h-screen w-screen bg-background overflow-hidden font-sans text-foreground">
      {screen === 'main' ? (
        <VRMControlPanel onOpenFBXLab={() => setScreen('fbx')} />
      ) : (
        <FBXPlayground onBack={() => setScreen('main')} />
      )}
    </div>
  );
}

export default App;
