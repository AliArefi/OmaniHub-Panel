import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthChallengeMeta, AuthUser } from '@/@types/auth'
import { safeAuthReturnPath } from '@/utils/authIdentity'

export type PendingAuthChallenge = {
    challenge_id: string
    expires_at: string | null
    meta: AuthChallengeMeta | Record<string, never>
    user: AuthUser | null
    returnPath?: string
}

type AuthChallengeState = {
    pending: PendingAuthChallenge | null
}

type AuthChallengeActions = {
    setPending: (pending: PendingAuthChallenge) => void
    clear: () => void
}

export const useAuthChallengeStore = create<AuthChallengeState & AuthChallengeActions>()(
    persist(
        (set) => ({
            pending: null,
            setPending: (pending) => set((state) => {
                const candidate = state.pending?.returnPath ?? new URLSearchParams(window.location.search).get('redirectUrl')
                const returnPath = safeAuthReturnPath(candidate)
                return { pending: { ...pending, returnPath } }
            }),
            clear: () => set({ pending: null }),
        }),
        {
            name: 'pendingAuthChallenge',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
)

