import ApiService from '@/services/ApiService'

export type AdminAgencyReview = {
    id: number
    reviewer_name: string
    reviewer_avatar: string | null
    comment: string
    rates: string
    status: boolean
    created_at: string
    user?: { id: number; name: string; email: string } | null
    reservation?: { id: number; customer_name: string; date: string; status: string } | null
}

export type AdminAgencySeedStats = {
    review_seed_1_count: number
    review_seed_2_count: number
    review_seed_3_count: number
    review_seed_4_count: number
    review_seed_5_count: number
}

function url(agencySlug: string, reviewId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/reviews`
    return reviewId ? `${base}/${reviewId}` : base
}

export function apiGetAdminAgencyReviews(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{
        data: AdminAgencyReview[]
        meta: { total: number; per_page: number; current_page: number; last_page: number }
        seed_stats: AdminAgencySeedStats
    }>({ url: url(agencySlug) })
}

export function apiCreateAdminAgencyReview(agencySlug: string, payload: Record<string, unknown>) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyReview }>({
        url: url(agencySlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminAgencyReview(
    agencySlug: string,
    reviewId: number,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyReview }>({
        url: url(agencySlug, reviewId),
        method: 'post',
        data: payload,
    })
}

export function apiDeleteAdminAgencyReview(agencySlug: string, reviewId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, reviewId),
        method: 'delete',
    })
}

export function apiUpdateAdminAgencySeedStats(
    agencySlug: string,
    payload: Partial<AdminAgencySeedStats> & {
        review_seed_average?: number
        review_seed_total_count?: number
    },
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencySeedStats }>({
        url: `${url(agencySlug)}/seed-stats`,
        method: 'post',
        data: payload,
    })
}
