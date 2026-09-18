import appConfig from '@/configs/app.config'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import i18n from 'i18next'
import { dateLocales, localeMetadata, supportedLocales } from '@/locales'
import dayjs from 'dayjs'

type LocaleState = {
    currentLang: string
    setLang: (payload: string) => void
}

const initialLocale = (): string => {
    if (typeof document !== 'undefined') {
        const cookie = document.cookie
            .split('; ')
            .find((entry) => entry.startsWith('locale='))
            ?.split('=')[1]
        if (cookie && supportedLocales.includes(cookie)) return cookie
    }

    if (typeof window !== 'undefined') {
        try {
            const persisted = JSON.parse(window.localStorage.getItem('locale') || '{}')
            if (supportedLocales.includes(persisted?.state?.currentLang)) {
                return persisted.state.currentLang
            }
        } catch {
            // Ignore malformed persisted preferences and use the configured default.
        }
    }

    return appConfig.locale
}

export const useLocaleStore = create<LocaleState>()(
    devtools(
        persist(
            (set) => ({
                currentLang: initialLocale(),
                setLang: (lang: string) => {
                    if (!supportedLocales.includes(lang)) return

                    const formattedLang = lang.replace(
                        /-([a-z])/g,
                        function (g) {
                            return g[1].toUpperCase()
                        },
                    )

                    i18n.changeLanguage(formattedLang)

                    if (typeof document !== 'undefined') {
                        document.cookie = `locale=${encodeURIComponent(lang)}; path=/; SameSite=Lax`
                        document.documentElement.lang = lang
                        document.documentElement.dir =
                            localeMetadata[lang]?.direction ?? 'ltr'
                    }

                    const loadDateLocale =
                        dateLocales[formattedLang] ?? dateLocales[appConfig.locale]

                    loadDateLocale?.().then(() => {
                        dayjs.locale(formattedLang)
                    })

                    return set({ currentLang: lang })
                },
            }),
            { name: 'locale' },
        ),
    ),
)
