import ApiService from '@/services/ApiService'

export type AdminAgencyServiceItem = {
    id: number
    slug: string
    title: string
    sub_title: string | null
    price: number
    pricing_type: string
    estimate_time: number
    duration_unit: string
    agency_service_category_id: number | null
    service_id: number
    translations?: Record<string, Record<string, string>>
}

export type AdminAgencyServicePayload = {
    service_id: number
    agency_service_category_id?: number | null
    price?: number
    pricing_type?: string
    estimate_time?: number
    duration_unit?: string
    slug?: string
    translations?: Record<string, Record<string, string>>
}

function url(agencySlug: string, serviceSlug?: string) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/services`
    return serviceSlug ? `${base}/${encodeURIComponent(serviceSlug)}` : base
}

export function apiGetAdminAgencyServices(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyServiceItem[] }>({
        url: url(agencySlug),
    })
}

export type AdminAgencyServiceOption = { id: number; label: string }

export function apiGetAdminAgencyServiceServiceOptions(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyServiceOption[] }>({
        url: `${url(agencySlug)}/options`,
    })
}

export function apiCreateAdminAgencyService(
    agencySlug: string,
    payload: AdminAgencyServicePayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyServiceItem }>({
        url: url(agencySlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminAgencyService(
    agencySlug: string,
    serviceSlug: string,
    payload: AdminAgencyServicePayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyServiceItem }>({
        url: url(agencySlug, serviceSlug),
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminAgencyService(agencySlug: string, serviceSlug: string) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, serviceSlug),
        method: 'delete',
    })
}
