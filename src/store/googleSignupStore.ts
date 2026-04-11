import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type GoogleSignupPrefill = {
    email: string | null
    name: string | null
    avatar_url: string | null
}

type GoogleSignupState = {
    id_token: string | null
    prefill: GoogleSignupPrefill | null
}

type GoogleSignupActions = {
    set: (payload: { id_token: string; prefill: GoogleSignupPrefill }) => void
    clear: () => void
}

export const useGoogleSignupStore = create<GoogleSignupState & GoogleSignupActions>()(
    persist(
        (set) => ({
            id_token: null,
            prefill: null,
            set: ({ id_token, prefill }) => set({ id_token, prefill }),
            clear: () => set({ id_token: null, prefill: null }),
        }),
        {
            name: 'googleSignup',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
)

