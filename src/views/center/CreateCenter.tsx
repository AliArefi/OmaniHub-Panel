import { Card } from "@/components/ui";
import { TimeLineCreateCenter } from "./TimeLineCreateCenter";
import { useState } from "react";
import { ProgressCreatingCenter } from "./ProgressCreatingCenter";
import { HojraInformation } from "./steps/HojraInformations";
import { HojraServices } from "./steps/HojraServices";
import { HojraTeamMembers } from "./steps/HojraTeamMembers";
import { HojraWorkSchedule } from "./steps/HojraWorkSchedule";

export default function CreateStoreWizard() {

  const [step, setStep] = useState<number>(1);
  return (
    <div className="grid lg:grid-cols-4 gap-4">
      <div>

        <Card>
          <TimeLineCreateCenter step={step} />
        </Card>

      </div>
      <div className="lg:col-span-2">
        {
          step == 1 && <HojraInformation changeState={(state) => setStep(state)} />}
        {
          step == 2 && <HojraServices changeState={(state) => setStep(state)} />}
        {
          step == 3 && <HojraTeamMembers changeState={(state) => setStep(state)} />
        }
        {
          step == 4 && <HojraWorkSchedule changeState={(state) => setStep(state)} />
        }
      </div>
      <div className="w-full">
        <ProgressCreatingCenter step={step} />
      </div>
    </div>
  );
}