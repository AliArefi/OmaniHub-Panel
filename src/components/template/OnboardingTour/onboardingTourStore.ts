import { create } from 'zustand'

const SEEN_KEY_PREFIX = 'omanihub:onboarding-tour:v1:'

type OnboardingTourState = {
    open: boolean
    step: number
}

type OnboardingTourAction = {
    start: () => void
    close: () => void
    setStep: (step: number) => void
}

export const useOnboardingTourStore = create<
    OnboardingTourState & OnboardingTourAction
>((set) => ({
    open: false,
    step: 0,
    // Always restarts from the first step, whether auto-opened or replayed
    // from the header button.
    start: () => set(() => ({ open: true, step: 0 })),
    close: () => set(() => ({ open: false, step: 0 })),
    setStep: (step) => set(() => ({ step })),
}))

// Storage can throw (private mode, blocked site data); a failed read means
// "not seen" and a failed write just lets the tour show again next visit.
export const hasSeenOnboardingTour = (userId: number | string) => {
    try {
        return window.localStorage.getItem(SEEN_KEY_PREFIX + userId) !== null
    } catch {
        return false
    }
}

export const markOnboardingTourSeen = (userId: number | string) => {
    try {
        window.localStorage.setItem(
            SEEN_KEY_PREFIX + userId,
            new Date().toISOString(),
        )
    } catch {
        // ignore
    }
}
