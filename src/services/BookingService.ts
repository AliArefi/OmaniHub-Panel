import { Booking } from '@/@types/booking'
import type { AgencyReservationsV2Response } from '@/@types/reservations'
import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'

export async function getAgencyBookings(agencySlug?: string) {
    return ApiService.fetchDataWithAxios<{ data: Booking[] }>({
        url: agencySlug
            ? `/my-agencies/${encodeURIComponent(agencySlug)}/reservations`
            : endpointConfig.getMyAgencyBookings,
        method: 'get',
    })
}

export async function getMyBookings() {
    return ApiService.fetchDataWithAxios<{ data: Booking[] }>({
        url: '/my-reservations/list',
        method: 'get',
    })
}

export async function getSingleAgencyBookings(agencySlug: string) {
    return getAgencyBookings(agencySlug)
}

export async function getAgencyReservationsV2(params: {
    agencySlug: string
    view: 'month' | 'day'
    month?: string
    date?: string
    status?: string
    member_id?: number
    service_id?: number
    q?: string
    include_daily_counts?: boolean
    include_reservations?: boolean
    per_page?: number
    page?: number
}) {
    const { agencySlug, ...query } = params
    return ApiService.fetchDataWithAxios<AgencyReservationsV2Response>({
        url: `/my-agencies/${encodeURIComponent(agencySlug)}/reservations-v2`,
        method: 'get',
        params: query,
    })
}
