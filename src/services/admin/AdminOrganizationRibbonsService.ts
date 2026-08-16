import ApiService from '@/services/ApiService'

export type AdminOrganizationRibbonItem = {
    id: number
    text: string
    is_active: boolean
    sort_order: number
}

function url(organizationSlug: string, ribbonId?: number) {
    const base = `/admin/organizations/${encodeURIComponent(organizationSlug)}/ribbons`
    return ribbonId ? `${base}/${ribbonId}` : base
}

export function apiGetAdminOrganizationRibbons(organizationSlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationRibbonItem[] }>({
        url: url(organizationSlug),
    })
}

export function apiCreateAdminOrganizationRibbon(
    organizationSlug: string,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationRibbonItem }>({
        url: url(organizationSlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminOrganizationRibbon(
    organizationSlug: string,
    ribbonId: number,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationRibbonItem }>({
        url: url(organizationSlug, ribbonId),
        method: 'post',
        data: payload,
    })
}

export function apiDeleteAdminOrganizationRibbon(organizationSlug: string, ribbonId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(organizationSlug, ribbonId),
        method: 'delete',
    })
}
