import ApiService from '@/services/ApiService'
import type { BillingIconName } from '@/configs/billingIcons'

export type LocalizedText = Record<'en' | 'ar', string>

export type BillingPlanFeature = {
    id: string
    icon: BillingIconName
    title: LocalizedText
    description: LocalizedText
    active: boolean
    sort_order: number
}

export type AdminBillingProvider = {
    id: number
    key: string
    name: string
    enabled: boolean
    test_mode: boolean
    capabilities?: Record<string, boolean>
}

export type AdminBillingPlan = {
    id: number
    key: string
    name: Record<string, string>
    icon?: BillingIconName | null
    currency: string
    active: boolean
    description?: Record<string, string>
    features?: Array<BillingPlanFeature | string> | null
    sort_order: number
    prices: Array<{ id: number; interval: string; amount_minor: number; active?: boolean }>
}

export type BillingPlanPayload = {
    key: string
    name: Record<string, string>
    description?: Record<string, string>
    icon: BillingIconName
    currency: string
    features: BillingPlanFeature[]
    active: boolean
    sort_order: number
    prices: Array<{ interval: string; amount_minor: number }>
}

export const apiGetBillingSettings = () =>
    ApiService.fetchDataWithAxios<{ providers: AdminBillingProvider[]; plans: AdminBillingPlan[] }>({
        url: '/admin/billing/settings',
        method: 'get',
    })

export const apiUpdateBillingProvider = (
    id: number,
    payload: { enabled: boolean; test_mode: boolean; configuration: Record<string, string> },
) => ApiService.fetchDataWithAxios({
    url: `/admin/billing/providers/${id}/update`,
    method: 'post',
    data: payload,
})

export const apiCheckBillingProviderHealth = (id: number) =>
    ApiService.fetchDataWithAxios<{ health: { reachable: boolean; configured: boolean; authorized: boolean } }>({
        url: `/admin/billing/providers/${id}/health`,
        method: 'post',
    })

export const apiCreateBillingPlan = (payload: BillingPlanPayload) =>
    ApiService.fetchDataWithAxios({
        url: '/admin/billing/plans',
        method: 'post',
        data: payload,
    })

export const apiUpdateBillingPlan = (id: number, payload: BillingPlanPayload) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/billing/plans/${id}/update`,
        method: 'post',
        data: payload,
    })
