import ApiService from '@/services/ApiService'

export type AdminAgencyServiceCategory = {
    id: number
    user_id: number
    parent_id: number | null
    title: string
    order_number: number
}

export type AdminAgencyServiceCategoryPayload = {
    title: string
    parent_id?: number | null
    order_number?: number
}

function url(agencySlug: string, categoryId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/service-categories`
    return categoryId ? `${base}/${categoryId}` : base
}

export function apiGetAdminAgencyServiceCategories(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyServiceCategory[] }>({
        url: url(agencySlug),
    })
}

export function apiCreateAdminAgencyServiceCategory(
    agencySlug: string,
    payload: AdminAgencyServiceCategoryPayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyServiceCategory }>({
        url: url(agencySlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminAgencyServiceCategory(
    agencySlug: string,
    categoryId: number,
    payload: AdminAgencyServiceCategoryPayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyServiceCategory }>({
        url: url(agencySlug, categoryId),
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminAgencyServiceCategory(agencySlug: string, categoryId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, categoryId),
        method: 'delete',
    })
}
