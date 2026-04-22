
import { Booking } from '@/@types/booking'
import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'

export async function getAgencyBookings() {
    return ApiService.fetchDataWithAxios<{ data: Booking[] }>({
        url: endpointConfig.getMyBooking,
    })
}