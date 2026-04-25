export type AppConfig = {
    apiPrefix: string
    urlImage: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    locale: string
    accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies'
    enableMock: boolean
    activeNavTranslation: boolean
}

const readBoolEnv = (value: unknown, fallback: boolean) => {
    if (typeof value !== 'string') {
        return fallback
    }

    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
        return true
    }
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
        return false
    }

    return fallback
}

const appConfig: AppConfig = {
    apiPrefix:
        (import.meta.env.VITE_API_PREFIX as string | undefined) ??
        (import.meta.env.DEV ? '/api/1' : 'https://admin.omanihub.com/api/1'),
    urlImage: (() => {
        const fromEnv = (import.meta.env.VITE_URL_IMAGE as string | undefined)
        if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim()

        const apiPrefix =
            (import.meta.env.VITE_API_PREFIX as string | undefined) ??
            (import.meta.env.DEV ? '/api/1' : 'https://admin.omanihub.com/api/1')

        if (typeof apiPrefix === 'string' && /^https?:\/\//i.test(apiPrefix)) {
            try {
                return new URL(apiPrefix).origin
            } catch {
                return ''
            }
        }

        return ''
    })(),
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'ar',
    accessTokenPersistStrategy: 'localStorage',
    enableMock: readBoolEnv(import.meta.env.VITE_ENABLE_MOCK, false),
    activeNavTranslation: false,
}

export default appConfig
