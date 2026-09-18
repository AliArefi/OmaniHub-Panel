import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './lang/en.json'
import ar from './lang/ar.json'
import appConfig from '@/configs/app.config'
import type { Direction } from '@/@types/theme'

export type LocaleMetadata = {
    direction: Direction
    flag: string
    labelKey: string
}

export const localeMetadata: Record<string, LocaleMetadata> = {
    en: { direction: 'ltr', flag: 'US', labelKey: 'languages.en' },
    ar: { direction: 'rtl', flag: 'OM', labelKey: 'languages.ar' },
}

export const supportedLocales = Object.keys(localeMetadata)

const resources = {
    en: {
        translation: en,
    },
    ar: {
        translation: ar,
    },
}

i18n.use(initReactI18next).init({
    resources,
    fallbackLng: appConfig.locale,
    lng: appConfig.locale,
    interpolation: {
        escapeValue: false,
    },
})

export const dateLocales: {
    [key: string]: () => Promise<ILocale>
} = {
    en: () => import('dayjs/locale/en'),
    ar: () => import('dayjs/locale/ar'),
}

export default i18n
