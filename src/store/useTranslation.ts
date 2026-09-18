import { TEXT_CONSTANT } from '@/constants/text.constant'
import { useLocaleStore } from '@/store/localeStore'

type TextConstant = typeof TEXT_CONSTANT
type PlainKey = {
    [K in keyof TextConstant]: TextConstant[K] extends Record<string, string> ? K : never
}[keyof TextConstant]
type FnKey = {
    [K in keyof TextConstant]: TextConstant[K] extends (...args: any[]) => Record<string, string> ? K : never
}[keyof TextConstant]

export function useTranslation() {
    const locale = useLocaleStore((state) => state.currentLang)
    const setLocale = useLocaleStore((state) => state.setLang)
    const lang = locale.toLowerCase().startsWith('ar') ? 'AR' : 'EN'

    function t(key: PlainKey): string
    function t<K extends FnKey>(key: K, ...args: Parameters<TextConstant[K]>): string
    function t(key: string, ...args: unknown[]): string {
        const entry = (TEXT_CONSTANT as Record<string, unknown>)[key]

        if (!entry) {
            if (import.meta.env.DEV) {
                console.warn(`[i18n] Missing translation key: "${key}"`)
            }
            return key
        }

        const record =
            typeof entry === 'function'
                ? (entry as (...a: unknown[]) => Record<string, string>)(...args)
                : (entry as Record<string, string>)

        return record[lang] ?? record.EN ?? Object.values(record)[0] ?? key
    }

    return {
        t,
        lang,
        setLang: (next: keyof typeof TEXT_CONSTANT.loading) =>
            setLocale(next.toLowerCase() === 'ar' ? 'ar' : 'en'),
    }
}
