import ApiService from '@/services/ApiService'

export type AdminOrganizationReview = {
    id: number
    reviewer_name: string
    reviewer_avatar: string | null
    comment: string
    rates: string
    status: boolean
    created_at: string
    user?: { id: number; name: string; email: string } | null
}

function url(organizationSlug: string, reviewId?: number) {
    const base = `/admin/organizations/${encodeURIComponent(organizationSlug)}/reviews`
    return reviewId ? `${base}/${reviewId}` : base
}

export function apiGetAdminOrganizationReviews(organizationSlug: string) {
    return ApiService.fetchDataWithAxios<{
        data: AdminOrganizationReview[]
        meta: { total: number; per_page: number; current_page: number; last_page: number }
    }>({ url: url(organizationSlug) })
}

export function apiCreateAdminOrganizationReview(
    organizationSlug: string,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationReview }>({
        url: url(organizationSlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminOrganizationReview(
    organizationSlug: string,
    reviewId: number,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationReview }>({
        url: url(organizationSlug, reviewId),
        method: 'post',
        data: payload,
    })
}

export function apiDeleteAdminOrganizationReview(organizationSlug: string, reviewId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(organizationSlug, reviewId),
        method: 'delete',
    })
}
