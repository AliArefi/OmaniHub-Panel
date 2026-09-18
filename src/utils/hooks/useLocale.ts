import { useEffect } from 'react'
import i18n from 'i18next'
import { useLocaleStore } from '@/store/localeStore'

const useLocale = () => {
    const currentLang = useLocaleStore((state) => state.currentLang)

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = currentLang
        }

        if (i18n.language !== currentLang) {
            const formattedLang = currentLang.replace(
                /-([a-z])/g,
                function (g) {
                    return g[1].toUpperCase()
                },
            )
            i18n.changeLanguage(formattedLang)
        }
    }, [currentLang])

    useEffect(() => {
        if (typeof document === 'undefined') return

        const syncCookieLocale = () => {
            const value = document.cookie
                .split('; ')
                .find((entry) => entry.startsWith('locale='))
                ?.split('=')[1]

            if ((value === 'ar' || value === 'en') && value !== currentLang) {
                useLocaleStore.getState().setLang(value)
            }
        }

        const interval = window.setInterval(syncCookieLocale, 750)
        return () => window.clearInterval(interval)
    }, [currentLang])

    return {
        locale: currentLang,
    }
}

export default useLocale
