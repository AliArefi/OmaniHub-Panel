import ApiService from '@/services/ApiService'

export type AdminOrganizationHighlight = {
    id: number
    value: string
    label: string
    is_active: boolean
    sort_order: number
}

function url(organizationSlug: string, highlightId?: number) {
    const base = `/admin/organizations/${encodeURIComponent(organizationSlug)}/highlights`
    return highlightId ? `${base}/${highlightId}` : base
}

export function apiGetAdminOrganizationHighlights(organizationSlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationHighlight[] }>({
        url: url(organizationSlug),
    })
}

export function apiCreateAdminOrganizationHighlight(
    organizationSlug: string,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationHighlight }>({
        url: url(organizationSlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminOrganizationHighlight(
    organizationSlug: string,
    highlightId: number,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationHighlight }>({
        url: url(organizationSlug, highlightId),
        method: 'post',
        data: payload,
    })
}

export function apiDeleteAdminOrganizationHighlight(organizationSlug: string, highlightId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(organizationSlug, highlightId),
        method: 'delete',
    })
}
