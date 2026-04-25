import { Booking } from '@/@types/booking'
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
