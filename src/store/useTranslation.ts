import { Language, TEXT_CONSTANT } from '@/constants/text.constant'
import { useState } from 'react'

export function useTranslation(defaultLang: Language = 'AR') {
    const [lang, setLang] = useState<Language>(defaultLang)

    const t = (key: keyof typeof TEXT_CONSTANT): string => {
        return TEXT_CONSTANT[key][lang]
    }

    return { t, lang, setLang }
}
