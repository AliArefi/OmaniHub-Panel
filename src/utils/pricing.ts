export type PricingType = 'fixed' | 'coordination' | 'member_based'
export type PricingStatus = 'needs_quote' | 'priced'

type PricingShape = {
    pricing_type?: PricingType | null
    needs_coordination?: boolean | null
    price?: number | null
    price_min?: number | null
    price_max?: number | null
    quoted_price?: number | null
    final_price?: number | null
    pricing_status?: PricingStatus | null
    currency?: string | null
}

function toAmount(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    return null
}

function formatAmount(value: number, currency = 'OMR'): string {
    return `${value.toFixed(2)} ${currency}`
}

export function getServicePricingLabel(pricing: PricingShape): string {
    if (pricing.needs_coordination) return i18n.t('pricing.coordination')

    const fixed = toAmount(pricing.price)
    if (fixed !== null) return formatAmount(fixed)

    const min = toAmount(pricing.price_min)
    const max = toAmount(pricing.price_max)

    if (min !== null && max !== null) {
        if (min === max) return formatAmount(min)
        return i18n.t('pricing.range', { min: min.toFixed(2), max: max.toFixed(2), currency: 'OMR' })
    }

    if (min !== null) return i18n.t('pricing.startsFrom', { min: min.toFixed(2), currency: 'OMR' })

    return i18n.t('pricing.coordination')
}

export function getPricingTypeLabel(type?: PricingType | null): string {
    if (type === 'coordination') return i18n.t('pricing.coordination')
    if (type === 'member_based') return i18n.t('pricing.memberBased')
    return i18n.t('pricing.fixed')
}

export function getReservationPricingLabel(pricing: PricingShape): string {
    const currency = pricing.currency || 'OMR'
    const finalPrice = toAmount(pricing.final_price)
    const quotedPrice = toAmount(pricing.quoted_price)

    if (finalPrice !== null) return formatAmount(finalPrice, currency)
    if (quotedPrice !== null) return formatAmount(quotedPrice, currency)
    if (pricing.pricing_status === 'needs_quote') return i18n.t('pricing.needsQuote')

    return i18n.t('pricing.unspecified')
}

export function getReservationPricingStatusLabel(
    status?: PricingStatus | null,
): string {
    if (status === 'needs_quote') return i18n.t('pricing.needsQuote')
    if (status === 'priced') return i18n.t('pricing.priced')
    return i18n.t('pricing.unspecified')
}
import i18n from '@/locales'
