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
        'https://api.iranronagh.ir/api/1',
    urlImage:
        (import.meta.env.VITE_URL_IMAGE as string | undefined) ??
        '',
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    accessTokenPersistStrategy: 'localStorage',
    enableMock: readBoolEnv(import.meta.env.VITE_ENABLE_MOCK, false),
    activeNavTranslation: false,
}

export default appConfig
