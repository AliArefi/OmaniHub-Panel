const EASTERN_ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const FULLWIDTH_DIGITS = '０１２３４５６７８９'

const normalizeDigitChar = (char: string) => {
    const easternArabicIndex = EASTERN_ARABIC_DIGITS.indexOf(char)
    if (easternArabicIndex >= 0) {
        return String(easternArabicIndex)
    }

    const persianIndex = PERSIAN_DIGITS.indexOf(char)
    if (persianIndex >= 0) {
        return String(persianIndex)
    }

    const fullwidthIndex = FULLWIDTH_DIGITS.indexOf(char)
    if (fullwidthIndex >= 0) {
        return String(fullwidthIndex)
    }

    return char
}

export const normalizeDigits = (value: string) => {
    return Array.from(value).map(normalizeDigitChar).join('')
}

export const extractDigits = (value: string) => {
    return normalizeDigits(value).replace(/\D+/g, '')
}

export const normalizePhoneNumberInput = (value: string) => {
    const normalized = normalizeDigits(value)
    const hasLeadingPlus = normalized.trimStart().startsWith('+')
    const digitsOnly = normalized.replace(/[^\d]/g, '')

    return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly
}

export const containsOnlySingleDigit = (value: string) => {
    return /^\d$/.test(normalizeDigits(value))
}
