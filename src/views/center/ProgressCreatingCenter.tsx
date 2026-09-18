import { Alert, Card, Progress } from "@/components/ui";
import { HiFire } from "react-icons/hi";
import useTranslation from '@/utils/hooks/useTranslation';

interface ProgressCreatingCenterProps {
    step: number;
}

const CircleCustomInfo = ({ percent, completed }: { percent: number; completed: string }) => {
    return (
        <div className="text-center">
            <div className="text-xl"><span className="text-3xl font-bold text-primary-mild">{percent}</span> / 6</div>
            <span>{completed}</span>
        </div>
    )
}

export function ProgressCreatingCenter({ step }: ProgressCreatingCenterProps) {
    const { t } = useTranslation()
    const hints = [
        'centerCreation.stepOneHint',
        'centerCreation.stepTwoHint',
        'centerCreation.stepThreeHint',
        'centerCreation.stepFourHint',
        'centerCreation.stepFiveHint',
        'centerCreation.stepSixHint',
    ]

    return (
        <div className="w-full">
            <Card
                className="w-full"
                header={{
                    content: t('centerCreation.progressTitle'),
                    bordered: false,
                }}>
                <Progress
                    variant="circle"
                    percent={(step / 6) * 100}
                    width={150}
                    className="flex items-center justify-center"
                    customInfo={<CircleCustomInfo percent={step} completed={t('centerCreation.completed')} />}
                />

                <div className="mt-5">
                    {step >= 1 && step <= 6 && (
                        <Alert
                            showIcon
                            className={step === 1 ? 'mb-4' : undefined}
                            type={step === 1 ? 'info' : 'success'}
                            customIcon={step === 1 ? undefined : <HiFire />}
                        >
                            {t(hints[step - 1])}
                        </Alert>
                    )}
                </div>

            </Card>
        </div>
    )

}
