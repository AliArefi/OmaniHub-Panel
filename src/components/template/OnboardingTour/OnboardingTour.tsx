import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    type Placement,
} from '@floating-ui/react'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    useOnboardingTourStore,
    hasSeenOnboardingTour,
    markOnboardingTourSeen,
} from './onboardingTourStore'
import useOnboardingTourEligibility from './useOnboardingTourEligibility'

type TourStep = {
    key: string
    getTarget?: () => HTMLElement | null
    // Used when the desktop target is hidden (below sm the side nav and
    // header are gone and the bottom bar takes over). Its card text comes
    // from `steps.<key>Mobile`.
    getMobileTarget?: () => HTMLElement | null
    // 'side' sits beside the target, mirrored for RTL.
    placement?: 'side' | 'bottom'
    // Drop the step entirely when no target is on screen. Steps without
    // this flag fall back to a centered card instead.
    requiresTarget?: boolean
    isFinal?: boolean
}

type ResolvedTarget = { el: HTMLElement; mobile: boolean }

const query = (selector: string) =>
    document.querySelector<HTMLElement>(selector)

const TOUR_STEPS: TourStep[] = [
    { key: 'welcome' },
    {
        key: 'menu',
        getTarget: () => query('.side-nav'),
        getMobileTarget: () => query('[data-tour="mobile-bottom-nav"]'),
        placement: 'side',
    },
    {
        key: 'myCenters',
        getTarget: () =>
            query('.side-nav a[href="/new-center"]')?.closest<HTMLElement>(
                '.menu-collapse',
            ) ?? null,
        getMobileTarget: () => query('[data-tour="mobile-centers"]'),
        placement: 'side',
    },
    {
        key: 'helpButton',
        getTarget: () => query('[data-tour="tour-help-button"]'),
        getMobileTarget: () => query('[data-tour="mobile-bottom-nav"] .avatar'),
        placement: 'bottom',
        requiresTarget: true,
    },
    { key: 'createCenter', isFinal: true },
]

const AUTO_OPEN_DELAY = 800
const SPOTLIGHT_PADDING = 6

const isOnScreen = (el: HTMLElement | null | undefined): el is HTMLElement => {
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
}

const resolveTarget = (step?: TourStep): ResolvedTarget | null => {
    const el = step?.getTarget?.()
    if (isOnScreen(el)) return { el, mobile: false }
    const mobileEl = step?.getMobileTarget?.()
    if (isOnScreen(mobileEl)) return { el: mobileEl, mobile: true }
    return null
}

const OnboardingTour = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const direction = useThemeStore((state) => state.direction)
    const userId = useSessionUser((state) => state.user.id)
    const { canUseTour, shouldAutoOpen } = useOnboardingTourEligibility()

    const open = useOnboardingTourStore((state) => state.open)
    const stepIndex = useOnboardingTourStore((state) => state.step)
    const start = useOnboardingTourStore((state) => state.start)
    const close = useOnboardingTourStore((state) => state.close)
    const setStep = useOnboardingTourStore((state) => state.setStep)

    const [steps, setSteps] = useState<TourStep[]>(TOUR_STEPS)
    const [target, setTarget] = useState<HTMLElement | null>(null)
    const [isMobileTarget, setIsMobileTarget] = useState(false)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const nextButtonRef = useRef<HTMLButtonElement>(null)

    // Auto-open once per user. The delay lets /auth/me refresh the persisted
    // user first; if the flags change meanwhile, the timer is rescheduled.
    useEffect(() => {
        if (!shouldAutoOpen || userId == null || hasSeenOnboardingTour(userId))
            return
        const timer = window.setTimeout(start, AUTO_OPEN_DELAY)
        return () => window.clearTimeout(timer)
    }, [shouldAutoOpen, userId, start])

    useEffect(() => {
        if (open && !canUseTour) close()
    }, [open, canUseTour, close])

    useEffect(() => {
        if (!open) return
        setSteps(
            TOUR_STEPS.filter(
                (step) => !step.requiresTarget || resolveTarget(step),
            ),
        )
    }, [open])

    const step = steps[Math.min(stepIndex, steps.length - 1)]
    const isFirst = stepIndex === 0
    const isLast = stepIndex >= steps.length - 1

    useLayoutEffect(() => {
        if (!open) return
        const updateTarget = () => {
            const resolved = resolveTarget(step)
            setTarget(resolved?.el ?? null)
            setIsMobileTarget(!!resolved?.mobile)
        }
        updateTarget()
        window.addEventListener('resize', updateTarget)
        return () => window.removeEventListener('resize', updateTarget)
    }, [open, step])

    useLayoutEffect(() => {
        if (!target) {
            setRect(null)
            return
        }
        target.scrollIntoView({ block: 'nearest' })
        const updateRect = () => setRect(target.getBoundingClientRect())
        updateRect()
        const observer = new ResizeObserver(updateRect)
        observer.observe(target)
        window.addEventListener('scroll', updateRect, true)
        window.addEventListener('resize', updateRect)
        return () => {
            observer.disconnect()
            window.removeEventListener('scroll', updateRect, true)
            window.removeEventListener('resize', updateRect)
        }
    }, [target])

    const isRtl = direction === 'rtl'
    // The mobile bottom bar sits at the bottom edge, so its card goes above.
    const placement: Placement = isMobileTarget
        ? 'top'
        : step?.placement === 'bottom'
          ? isRtl
                ? 'bottom-start'
                : 'bottom-end'
            : isRtl
              ? 'left-start'
              : 'right-start'

    const { refs, floatingStyles } = useFloating({
        open: open && !!target,
        placement,
        middleware: [offset(16), flip(), shift({ padding: 16 })],
        whileElementsMounted: autoUpdate,
        elements: { reference: target },
    })

    const finish = () => {
        if (userId != null) markOnboardingTourSeen(userId)
        close()
    }

    const goNext = () => (isLast ? finish() : setStep(stepIndex + 1))
    const goBack = () => !isFirst && setStep(stepIndex - 1)

    const createCenter = () => {
        finish()
        navigate('/new-center')
    }

    useEffect(() => {
        if (!open) return
        nextButtonRef.current?.focus()
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') finish()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, stepIndex])

    if (!open || !step) return null

    const textKey = isMobileTarget ? `${step.key}Mobile` : step.key

    const card = (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-tour-title"
            className="card card-border w-[340px] max-w-[calc(100vw-32px)] shadow-xl"
        >
            <div className="card-body relative">
                <CloseButton
                    absolute
                    className="top-4 ltr:right-4 rtl:left-4"
                    aria-label={t('onboardingTour.actions.close')}
                    onClick={finish}
                />
                <div className="text-xs font-semibold text-primary mb-2">
                    {t('onboardingTour.progress', {
                        current: stepIndex + 1,
                        total: steps.length,
                    })}
                </div>
                <h5 id="onboarding-tour-title" className="mb-2 ltr:pr-6 rtl:pl-6">
                    {t(`onboardingTour.steps.${textKey}.title`)}
                </h5>
                <p className="mb-6">
                    {t(`onboardingTour.steps.${textKey}.description`)}
                </p>
                <div className="flex items-center justify-between gap-2">
                    {step.isFinal ? (
                        <Button size="sm" variant="plain" onClick={finish}>
                            {t('onboardingTour.actions.later')}
                        </Button>
                    ) : (
                        <Button size="sm" variant="plain" onClick={finish}>
                            {t('onboardingTour.actions.skip')}
                        </Button>
                    )}
                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <Button size="sm" onClick={goBack}>
                                {t('onboardingTour.actions.back')}
                            </Button>
                        )}
                        {step.isFinal ? (
                            <Button
                                ref={nextButtonRef}
                                size="sm"
                                variant="solid"
                                onClick={createCenter}
                            >
                                {t('onboardingTour.actions.createCenter')}
                            </Button>
                        ) : (
                            <Button
                                ref={nextButtonRef}
                                size="sm"
                                variant="solid"
                                onClick={goNext}
                            >
                                {t('onboardingTour.actions.next')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(
        <div className="fixed inset-0 z-[60]">
            {target && rect ? (
                <>
                    {/* Blocks clicks on the page while the tour is open. */}
                    <div className="absolute inset-0" />
                    <div
                        className="fixed rounded-xl pointer-events-none transition-all duration-200"
                        style={{
                            top: rect.top - SPOTLIGHT_PADDING,
                            left: rect.left - SPOTLIGHT_PADDING,
                            width: rect.width + SPOTLIGHT_PADDING * 2,
                            height: rect.height + SPOTLIGHT_PADDING * 2,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        }}
                    />
                    <div ref={refs.setFloating} style={floatingStyles}>
                        {card}
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                    {card}
                </div>
            )}
        </div>,
        document.body,
    )
}

export default OnboardingTour
