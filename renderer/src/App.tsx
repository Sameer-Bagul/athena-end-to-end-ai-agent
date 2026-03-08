import { useState, useEffect } from "react";
import { VRMControlPanel } from "./components/VRMControlPanel";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import { WidgetLayout } from "./components/WidgetLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isWidgetWindow, setIsWidgetWindow] = useState(false);

  useEffect(() => {
    // 1. Check if we are the Widget Window
    if (window.location.hash === '#widget') {
      setIsWidgetWindow(true);
      setLoading(false);
      return;
    }

    // 2. Check onboarding (Main Window only)
    const isComplete = localStorage.getItem("athena_onboarding_complete") === "true";
    setShowOnboarding(!isComplete);
    setLoading(false);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("athena_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const handleOpenWidget = async () => {
    await window.athena.openWidget();
  };

  if (loading) return null;

  // --- WIDGET MODE RENDER ---
  if (isWidgetWindow) {
    return (
      <ErrorBoundary>
        <WidgetLayout />
      </ErrorBoundary>
    );
  }

  // --- MAIN APP RENDER ---
  return (
    <ErrorBoundary>
      <div className="h-screen w-screen bg-background overflow-hidden font-sans text-foreground flex flex-col">
        {/* No TitleBar (Using Native Frame) */}

        <div className="flex-1 relative overflow-hidden">
          {showOnboarding ? (
            <div className="h-full w-full bg-black">
              <OnboardingFlow onComplete={handleOnboardingComplete} />
            </div>
          ) : (
            <VRMControlPanel
              onOpenWidget={handleOpenWidget}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
