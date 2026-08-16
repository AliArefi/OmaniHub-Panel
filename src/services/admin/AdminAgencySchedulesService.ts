import ApiService from '@/services/ApiService'

export type AdminAgencySchedule = {
    id: number
    agency_service_member_id: number
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
    member?: { id: number; name: string }
}

export type AdminAgencySchedulePayload = {
    agency_service_member_id: number
    day_of_week: number
    start_time: string
    end_time: string
    is_active?: boolean
}

export type AdminAgencySchedulePreview = {
    member_id: number
    member_name: string
    date: string
    duration_minutes: number
    slot_interval: number
    slots: string[]
}

function url(agencySlug: string, scheduleId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/schedules`
    return scheduleId ? `${base}/${scheduleId}` : base
}

export function apiGetAdminAgencySchedules(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencySchedule[] }>({
        url: url(agencySlug),
    })
}

export function apiCreateAdminAgencySchedule(
    agencySlug: string,
    payload: AdminAgencySchedulePayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencySchedule }>({
        url: url(agencySlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminAgencySchedule(
    agencySlug: string,
    scheduleId: number,
    payload: AdminAgencySchedulePayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencySchedule }>({
        url: url(agencySlug, scheduleId),
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminAgencySchedule(agencySlug: string, scheduleId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, scheduleId),
        method: 'delete',
    })
}

export function apiGetAdminAgencySchedulePreview(
    agencySlug: string,
    params: { member_id: number; date?: string; duration_minutes?: number; slot_interval?: number },
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencySchedulePreview }>({
        url: `${url(agencySlug)}/preview`,
        params,
    })
}
