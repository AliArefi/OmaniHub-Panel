// CreateStoreWizard.tsx
import { Card } from "@/components/ui";
import { TimeLineCreateCenter } from "./TimeLineCreateCenter";
import { useState } from "react";
import { ProgressCreatingCenter } from "./ProgressCreatingCenter";
import { HojraInformation } from "./steps/HojraInformations";
import { HojraServices } from "./steps/HojraServices";
import { CreateStoreProvider } from "@/context/createStoreContext";
import { HojraAssignServices } from "./steps/HojraAssignServices";
import { HojraSummary } from "./steps/HojraSummary";

export default function CreateStoreWizard() {
    const [step, setStep] = useState<number>(1);

    return (
        <CreateStoreProvider>
            <div className="grid lg:grid-cols-4 gap-4">
                <div>
                    <Card>
                        <TimeLineCreateCenter step={step} />
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    {step === 1 && (
                        <HojraInformation changeState={(state) => setStep(state)} />
                    )}
                    {step === 2 && (
                        <HojraServices changeState={(state) => setStep(state)} />
                    )}
                    {step === 3 && (
                        <HojraAssignServices changeState={(state) => setStep(state)} />
                    )}
                    {step === 4 && (
                        <HojraSummary changeState={(state) => setStep(state)} />
                    )}
                </div>
                <div className="w-full">
                    <ProgressCreatingCenter step={step} />
                </div>
            </div>
        </CreateStoreProvider>
    );
}
