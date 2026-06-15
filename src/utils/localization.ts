import appConfig from '@/configs/app.config'
import { useLocaleStore } from '@/store/localeStore'
import type { SupportedLocale } from '@/@types/localization'

export const supportedLocales: SupportedLocale[] = ['ar', 'en']
export const fallbackLocale: SupportedLocale = 'ar'

export function normalizeLocale(locale?: string | null): SupportedLocale {
    if (!locale) return fallbackLocale
    const base = locale.toLowerCase().split(/[-_,;]/)[0]
    return supportedLocales.includes(base as SupportedLocale)
        ? (base as SupportedLocale)
        : fallbackLocale
}

export function getActiveLocale(): SupportedLocale {
    return normalizeLocale(useLocaleStore.getState().currentLang || appConfig.locale)
}
