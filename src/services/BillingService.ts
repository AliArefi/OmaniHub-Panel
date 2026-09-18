import ApiService from './ApiService'

export type BillingInterval = 'monthly' | 'annually' | 'one_time'

export type BillingPlanPrice = {
    id: number
    interval: BillingInterval
    amount_minor: number
    active: boolean
}

export type BillingPlan = {
    id: number
    key: string
    name: Record<string, string>
    description?: Record<string, string> | null
    currency: string
    features?: string[] | null
    prices: BillingPlanPrice[]
}

export type BillingCheckoutResponse = {
    order_id: number
    checkout: {
        checkout_url?: string | null
        client_secret?: string | null
    }
}

export function apiGetBillingPlans() {
    return ApiService.fetchDataWithAxios<{ plans: BillingPlan[] }>({
        url: '/billing/plans',
        method: 'get',
    })
}

export function apiCreateBillingCheckout(payload: {
    plan_id: number
    interval: BillingInterval
    mode: 'one_time' | 'subscription'
    provider?: string
}) {
    return ApiService.fetchDataWithAxios<BillingCheckoutResponse, typeof payload>({
        url: '/billing/checkout',
        method: 'post',
        data: payload,
        headers: { 'Idempotency-Key': crypto.randomUUID() },
    })
}
