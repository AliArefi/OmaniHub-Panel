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

const appConfig: AppConfig = {
    apiPrefix: 'https://api.iranronagh.ir/api/1',
    urlImage: 'https://api.iranronagh.ir',
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    accessTokenPersistStrategy: 'localStorage',
    enableMock: true,
    activeNavTranslation: false,
}

export default appConfig
