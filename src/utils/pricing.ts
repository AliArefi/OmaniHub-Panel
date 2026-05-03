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
    if (pricing.needs_coordination) return 'بحسب التنسيق'

    const fixed = toAmount(pricing.price)
    if (fixed !== null) return formatAmount(fixed)

    const min = toAmount(pricing.price_min)
    const max = toAmount(pricing.price_max)

    if (min !== null && max !== null) {
        if (min === max) return formatAmount(min)
        return `من ${min.toFixed(2)} إلى ${max.toFixed(2)} OMR`
    }

    if (min !== null) return `يبدأ من ${min.toFixed(2)} OMR`

    return 'بحسب التنسيق'
}

export function getPricingTypeLabel(type?: PricingType | null): string {
    if (type === 'coordination') return 'بحسب التنسيق'
    if (type === 'member_based') return 'بحسب العضو'
    return 'سعر ثابت'
}

export function getReservationPricingLabel(pricing: PricingShape): string {
    const currency = pricing.currency || 'OMR'
    const finalPrice = toAmount(pricing.final_price)
    const quotedPrice = toAmount(pricing.quoted_price)

    if (finalPrice !== null) return formatAmount(finalPrice, currency)
    if (quotedPrice !== null) return formatAmount(quotedPrice, currency)
    if (pricing.pricing_status === 'needs_quote') return 'بانتظار التسعير'

    return 'غير محدد'
}

export function getReservationPricingStatusLabel(
    status?: PricingStatus | null,
): string {
    if (status === 'needs_quote') return 'بانتظار التسعير'
    if (status === 'priced') return 'تم التسعير'
    return 'غير محدد'
}
