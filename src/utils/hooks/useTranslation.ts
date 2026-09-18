import { useTranslation as useReactI18NextTranslation } from 'react-i18next'

type I18nextTranslation = ReturnType<typeof useReactI18NextTranslation>

type PlaceholderTranslation = Pick<I18nextTranslation, 'ready' | 'i18n'> & {
    t: (key: string, fallback?: string) => string
}

export function useTranslation(): I18nextTranslation
export function useTranslation(usePlaceholder: true): PlaceholderTranslation
export function useTranslation(
    usePlaceholder: boolean,
): I18nextTranslation | PlaceholderTranslation
export function useTranslation(usePlaceholder = false) {
    const translation = useReactI18NextTranslation()

    if (!usePlaceholder) return translation

    return {
        i18n: translation.i18n,
        ready: true,
        t: (key: string, fallback?: string) => fallback ?? key,
    }
}

export default useTranslation
