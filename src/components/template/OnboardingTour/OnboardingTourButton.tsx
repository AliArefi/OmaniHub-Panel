import { HiOutlineQuestionMarkCircle } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import useTranslation from '@/utils/hooks/useTranslation'
import { useOnboardingTourStore } from './onboardingTourStore'
import useOnboardingTourEligibility from './useOnboardingTourEligibility'

const OnboardingTourButton = () => {
    const { t } = useTranslation()
    const start = useOnboardingTourStore((state) => state.start)
    const { canUseTour } = useOnboardingTourEligibility()

    if (!canUseTour) return null

    return (
        <Button
            size="sm"
            variant="plain"
            data-tour="tour-help-button"
            title={t('onboardingTour.actions.replay')}
            aria-label={t('onboardingTour.actions.replay')}
            onClick={start}
        >
            <HiOutlineQuestionMarkCircle size={24} />
        </Button>
    )
}

export default OnboardingTourButton
