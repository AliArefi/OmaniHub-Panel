import ApiService from '@/services/ApiService'

export type AdminAgencyCapability = {
    id: number
    agency_service_id: number
    agency_service_member_id: number
    price: number | null
    duration_minutes: number | null
    is_active: boolean
    service?: { id: number; title: string }
    member?: { id: number; name: string }
}

export type AdminAgencyCapabilityPayload = {
    agency_service_id: number
    agency_service_member_id: number
    price?: number | null
    duration_minutes?: number | null
    is_active?: boolean
}

function url(agencySlug: string, capabilityId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/capabilities`
    return capabilityId ? `${base}/${capabilityId}` : base
}

export function apiGetAdminAgencyCapabilities(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyCapability[] }>({
        url: url(agencySlug),
    })
}

export function apiSaveAdminAgencyCapability(
    agencySlug: string,
    payload: AdminAgencyCapabilityPayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyCapability }>({
        url: url(agencySlug),
        method: 'post',
        data: payload,
    })
}

export function apiDeleteAdminAgencyCapability(agencySlug: string, capabilityId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, capabilityId),
        method: 'delete',
    })
}
