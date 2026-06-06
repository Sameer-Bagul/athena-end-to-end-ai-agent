import React, { useState, useEffect } from "react";
const VRMControlPanel = React.lazy(() => import('./components/VRMControlPanel').then(m => ({ default: m.VRMControlPanel })));
const OnboardingFlow = React.lazy(() => import('./components/onboarding/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const WidgetLayout = React.lazy(() => import('./components/WidgetLayout').then(m => ({ default: m.WidgetLayout })));
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isWidgetWindow, setIsWidgetWindow] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('[App] Component mounting...');
    
    // Add timeout to detect stuck loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.error('[App] Loading timeout - forcing error display');
        setError(new Error('App initialization timed out. This may indicate an issue with AppContext or component initialization.'));
        setLoading(false);
      }
    }, 5000);
    
    try {
      // 1. Check if we are the Widget Window
      console.log('[App] Window hash:', window.location.hash);
      if (window.location.hash === '#widget') {
        console.log('[App] Widget window detected');
        setIsWidgetWindow(true);
        setLoading(false);
        clearTimeout(loadingTimeout);
        return;
      }

      // 2. Check onboarding (Main Window only)
      const isComplete = localStorage.getItem("athena_onboarding_complete") === "true";
      console.log('[App] Onboarding complete:', isComplete);
      setShowOnboarding(!isComplete);
      setLoading(false);
      clearTimeout(loadingTimeout);
      console.log('[App] Initialization complete');
    } catch (err) {
      console.error('[App] Error during initialization:', err);
      setError(err as Error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    }
    
    return () => clearTimeout(loadingTimeout);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("athena_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const handleOpenWidget = async () => {
    await window.athena.openWidget();
  };

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a1e', color: 'white', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center' }}>
        <div>
          <h1 style={{ color: '#ff4444', marginBottom: '20px' }}>⚠️ App Error</h1>
          <p style={{ color: '#aaa', maxWidth: '600px' }}>{error.message}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Reload App</button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    console.log('[App] Loading...');
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a1e', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
          <div style={{ fontSize: '18px', color: '#aaa' }}>Loading Athena...</div>
        </div>
      </div>
    );
  }

  // --- WIDGET MODE RENDER ---
  if (isWidgetWindow) {
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<div className="h-screen w-screen flex items-center justify-center text-white">Loading Widget...</div>}>
          <WidgetLayout />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  // --- MAIN APP RENDER ---
  return (
    <ErrorBoundary>
      <div className="h-screen w-screen bg-background overflow-hidden font-sans text-foreground flex flex-col">
        {/* No TitleBar (Using Native Frame) */}

        <div className="flex-1 relative overflow-hidden">
          <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center text-white">Loading UI...</div>}>
            {showOnboarding ? (
              <div className="h-full w-full bg-black">
                <OnboardingFlow onComplete={handleOnboardingComplete} />
              </div>
            ) : (
              <VRMControlPanel
                onOpenWidget={handleOpenWidget}
              />
            )}
          </React.Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
