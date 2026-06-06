import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
// Steps
import { OnboardingLayout } from "./OnboardingLayout";
import { Splash } from "./steps/Splash";
import { Welcome } from "./steps/Welcome";
import { Permissions } from "./steps/Permissions";
import { ModelSetup } from "./steps/ModelSetup";
import { Personalization } from "./steps/Personalization";
import { FirstInteraction } from "./steps/FirstInteraction";
import { Button } from "../ui/button";

import { CloudRegistry } from "./steps/CloudRegistry";

export type OnboardingStep =
    | "splash"
    | "welcome"
    | "permissions"
    | "model"
    | "cloud"
    | "personalization"
    | "interaction";

interface OnboardingFlowProps {
    onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    console.log('[OnboardingFlow] Component rendering...');
    const [step, setStep] = useState<OnboardingStep>("splash");
    
    console.log('[OnboardingFlow] Current step:', step);

    // Auto-advance Splash
    useEffect(() => {
        if (step === "splash") {
            const timer = setTimeout(() => setStep("welcome"), 3000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <OnboardingLayout>
            <AnimatePresence mode="wait">
                {step === "splash" && <Splash key="splash" />}

                {step === "welcome" && (
                    <Welcome key="welcome" onNext={() => setStep("permissions")} />
                )}

                {step === "permissions" && (
                    <Permissions
                        key="permissions"
                        onNext={() => setStep("model")}
                    />
                )}

                {step === "model" && (
                    <ModelSetup
                        key="model"
                        onNext={() => setStep("cloud")}
                        onBack={() => setStep("permissions")}
                    />
                )}

                {step === "cloud" && (
                    <CloudRegistry
                        key="cloud"
                        onNext={() => setStep("personalization")}
                        onBack={() => setStep("model")}
                    />
                )}

                {step === "personalization" && (
                    <Personalization
                        key="personalization"
                        onNext={() => setStep("interaction")}
                    />
                )}

                {step === "interaction" && (
                    <FirstInteraction
                        key="interaction"
                        onComplete={onComplete}
                    />
                )}
            </AnimatePresence>

            {/* Skip Button (Persists across steps except splash) */}
            <AnimatePresence>
                {step !== "splash" && step !== "interaction" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-100"
                    >
                        <Button
                            variant="ghost"
                            onClick={onComplete}
                            className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition-all"
                        >
                            Skip to Dashboard
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </OnboardingLayout>
    );
}
