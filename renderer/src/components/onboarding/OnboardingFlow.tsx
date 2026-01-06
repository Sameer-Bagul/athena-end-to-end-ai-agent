import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
// Steps
import { OnboardingLayout } from "./OnboardingLayout";
import { Splash } from "./steps/Splash";
import { Welcome } from "./steps/Welcome";
import { Permissions } from "./steps/Permissions";
import { VoiceSetup } from "./steps/VoiceSetup";
import { ModelSetup } from "./steps/ModelSetup";
import { Personalization } from "./steps/Personalization";
import { DashboardIntro } from "./steps/DashboardIntro";
import { FirstInteraction } from "./steps/FirstInteraction";

export type OnboardingStep =
    | "splash"
    | "welcome"
    | "permissions"
    | "voice"
    | "model"
    | "personalization"
    | "intro"
    | "interaction";

interface OnboardingFlowProps {
    onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState<OnboardingStep>("splash");
    const [userName, setUserName] = useState("User");

    // Auto-advance Splash
    useEffect(() => {
        if (step === "splash") {
            const timer = setTimeout(() => setStep("welcome"), 3000); // 3s splash
            return () => clearTimeout(timer);
        }
    }, [step]);

    const nextStep = (next: OnboardingStep) => setStep(next);

    return (
        <OnboardingLayout>
            <AnimatePresence mode="wait">
                {step === "splash" && <Splash key="splash" />}

                {step === "welcome" && (
                    <Welcome key="welcome" onNext={() => nextStep("permissions")} />
                )}

                {step === "permissions" && (
                    <Permissions key="permissions" onNext={() => nextStep("voice")} />
                )}

                {step === "voice" && (
                    <VoiceSetup key="voice" onNext={() => nextStep("model")} />
                )}

                {step === "model" && (
                    <ModelSetup key="model" onNext={() => nextStep("personalization")} />
                )}

                {step === "personalization" && (
                    <Personalization
                        key="personalization"
                        onNext={(name) => {
                            setUserName(name || "User");
                            nextStep("intro");
                        }}
                    />
                )}

                {step === "intro" && (
                    <DashboardIntro key="intro" onNext={() => nextStep("interaction")} />
                )}

                {step === "interaction" && (
                    <FirstInteraction
                        key="interaction"
                        userName={userName}
                        onComplete={onComplete}
                    />
                )}
            </AnimatePresence>
        </OnboardingLayout>
    );
}
