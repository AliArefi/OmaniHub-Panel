import { Language, TEXT_CONSTANT } from '@/constants/text.constant'
import { useState } from 'react'

export function useTranslation(defaultLang: Language = 'AR') {
    const [lang, setLang] = useState<Language>(defaultLang)

    function t(key: keyof typeof TEXT_CONSTANT): string
    function t(key: string): string
    function t(key: string): string {
        const record = (TEXT_CONSTANT as Record<string, Record<string, string> | undefined>)[key]

        if (!record) {
            if (import.meta.env.DEV) {
                console.warn(`[i18n] Missing translation key: "${key}"`)
            }
            return key
        }

        return record[lang] ?? record.EN ?? Object.values(record)[0] ?? key
    }

    return { t, lang, setLang }
}
