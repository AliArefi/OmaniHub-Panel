import ApiService from '@/services/ApiService'

export type AdminAgencyReservation = {
    id: number
    agency_service_id: number
    agency_service_member_id: number | null
    customer_name: string
    customer_mobile: string
    date: string
    start_time: string
    end_time: string
    status: 'pending' | 'confirmed' | 'cancelled'
    note: string | null
    service?: { id: number; title: string; service?: { id: number; name: string } }
    member?: { id: number; name: string } | null
    user?: { id: number; name: string; email: string } | null
    chat_thread?: {
        id: number
        last_message_at: string | null
        last_message?: { id: number; body: string; sender?: { id: number; name: string } }
        messages?: AdminAgencyChatMessage[]
    } | null
}

export type AdminAgencyChatMessage = {
    id: number
    chat_thread_id: number
    sender_user_id: number
    body: string
    created_at: string
    sender?: { id: number; name: string }
}

function url(agencySlug: string, reservationId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/reservations`
    return reservationId ? `${base}/${reservationId}` : base
}

export function apiGetAdminAgencyReservations(
    agencySlug: string,
    params: { status?: string; q?: string; page?: number; per_page?: number },
) {
    return ApiService.fetchDataWithAxios<{
        data: AdminAgencyReservation[]
        meta: { total: number; per_page: number; current_page: number; last_page: number }
    }>({ url: url(agencySlug), params })
}

export function apiGetAdminAgencyReservation(agencySlug: string, reservationId: number) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyReservation }>({
        url: url(agencySlug, reservationId),
    })
}

export function apiUpdateAdminAgencyReservation(
    agencySlug: string,
    reservationId: number,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyReservation }>({
        url: url(agencySlug, reservationId),
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminAgencyReservation(agencySlug: string, reservationId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, reservationId),
        method: 'delete',
    })
}

export function apiSendAdminAgencyChatMessage(
    agencySlug: string,
    reservationId: number,
    body: string,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyChatMessage }>({
        url: `${url(agencySlug, reservationId)}/chat/messages`,
        method: 'post',
        data: { body },
    })
}

export function apiDeleteAdminAgencyChatMessage(
    agencySlug: string,
    reservationId: number,
    messageId: number,
) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `${url(agencySlug, reservationId)}/chat/messages/${messageId}`,
        method: 'delete',
    })
}
