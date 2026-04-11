import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthChallengeMeta, AuthUser } from '@/@types/auth'

export type PendingAuthChallenge = {
    challenge_id: string
    expires_at: string | null
    meta: AuthChallengeMeta | Record<string, never>
    user: AuthUser | null
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
            setPending: (pending) => set({ pending }),
            clear: () => set({ pending: null }),
        }),
        {
            name: 'pendingAuthChallenge',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
)

