import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/@types/auth'

type Session = {
    signedIn: boolean
}

type AuthState = {
    session: Session
    user: User
}

type AuthAction = {
    setSessionSignedIn: (payload: boolean) => void
    setUser: (payload: User) => void
    reset: () => void
}

const initialState: AuthState = {
    session: {
        signedIn: false,
    },
    user: {
        id: null,
        name: null,
        email: null,
        avatar: null,
        has_active_store: false,
        has_active_agency: false,
        created_at: null,
        authority: [],
    },
}

export const useSessionUser = create<AuthState & AuthAction>()(
    persist(
        (set) => ({
            ...initialState,
            setSessionSignedIn: (payload) =>
                set((state) => ({
                    session: {
                        ...state.session,
                        signedIn: payload,
                    },
                })),
            setUser: (payload) =>
                set((state) => ({
                    user: {
                        ...state.user,
                        ...payload,
                    },
                })),
            reset: () => set(() => ({ ...initialState })),
        }),
        { name: 'sessionUser', storage: createJSONStorage(() => localStorage) },
    ),
)
