const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** Shows Western digits as Arabic-Indic (٠١٢٣…) when the language is Arabic. */
export const localizeDigits = (value: string | number | null | undefined, lang: string) => {
    const text = String(value ?? '')
    return lang === 'ar' ? text.replace(/[0-9]/g, (digit) => ARABIC_DIGITS[Number(digit)]) : text
}

/** Intl locale for numbers and dates: Omani Arabic with Arabic-Indic digits, or English. */
export const numberLocale = (lang: string) => (lang === 'ar' ? 'ar-OM-u-nu-arab' : 'en-OM')
