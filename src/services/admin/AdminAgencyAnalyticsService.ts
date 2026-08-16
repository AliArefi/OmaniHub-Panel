import ApiService from '@/services/ApiService'

export type AdminAgencyVisitsResponse = {
    data: Array<{ date: string; visits: number }>
    meta: { from: string; to: string; tz: string; interval: string }
}

export type AdminAgencyReservationsAnalytics = {
    labels: string[]
    series: number[]
    totals: { reservations: number }
    range: { from: string; to: string; tz: string; interval: string }
}

export type AdminAgencyWhatsappAnalytics = {
    labels: string[]
    series: Array<{ name: string; data: number[] }>
    totals: { clicks: number; messages: number }
    range: { from: string; to: string; tz: string; interval: string }
}

function base(agencySlug: string) {
    return `/admin/agencies/${encodeURIComponent(agencySlug)}/analytics`
}

export function apiGetAdminAgencyVisits(
    agencySlug: string,
    params: { from: string; to: string; tz: string },
) {
    return ApiService.fetchDataWithAxios<AdminAgencyVisitsResponse>({
        url: `${base(agencySlug)}/visits`,
        params: { ...params, interval: 'day' },
    })
}

export function apiGetAdminAgencyReservationsAnalytics(
    agencySlug: string,
    params: { from: string; to: string; tz: string },
) {
    return ApiService.fetchDataWithAxios<AdminAgencyReservationsAnalytics>({
        url: `${base(agencySlug)}/reservations`,
        params: { ...params, interval: 'day' },
    })
}

export function apiGetAdminAgencyWhatsappAnalytics(
    agencySlug: string,
    params: { from: string; to: string; tz: string },
) {
    return ApiService.fetchDataWithAxios<AdminAgencyWhatsappAnalytics>({
        url: `${base(agencySlug)}/whatsapp`,
        params: { ...params, interval: 'day' },
    })
}
