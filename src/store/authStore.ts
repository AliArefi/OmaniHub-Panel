import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/@types/auth'

type Session = {
    signedIn: boolean
    accessToken: string | null
}

type AuthState = {
    session: Session
    user: User
    // Device-level flag (not per-user): whether we've already auto-switched
    // the UI to EN/LTR once for an admin on this browser. See AuthProvider's
    // /auth/me bootstrap — an admin's own later language choice always wins
    // after this first seed.
    adminUiSeeded: boolean
}

type AuthAction = {
    setSessionSignedIn: (payload: boolean) => void
    setAccessToken: (token: string | null) => void
    setUser: (payload: User) => void
    setAdminUiSeeded: (payload: boolean) => void
    reset: () => void
}

const normalizeFlag = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
        if (['0', 'false', 'no', 'n', 'off', ''].includes(normalized))
            return false
    }
    return undefined
}

const normalizeUser = (payload: User): User => {
    const hasActiveAgency = normalizeFlag(payload.has_active_agency)
    const hasActiveStore = normalizeFlag(payload.has_active_store)

    return {
        ...payload,
        ...(hasActiveAgency === undefined
            ? null
            : { has_active_agency: hasActiveAgency }),
        ...(hasActiveStore === undefined
            ? null
            : { has_active_store: hasActiveStore }),
    }
}

const initialState: AuthState = {
    session: {
        signedIn: false,
        accessToken: null,
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
    adminUiSeeded: false,
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
            setAccessToken: (token) =>
                set((state) => ({
                    session: {
                        ...state.session,
                        accessToken: token,
                    },
                })),
            setUser: (payload) =>
                set((state) => ({
                    user: {
                        ...state.user,
                        ...normalizeUser(payload),
                    },
                })),
            setAdminUiSeeded: (payload) =>
                set(() => ({ adminUiSeeded: payload })),
            reset: () => set(() => ({ ...initialState })),
        }),
        { name: 'sessionUser', storage: createJSONStorage(() => localStorage) },
    ),
)
