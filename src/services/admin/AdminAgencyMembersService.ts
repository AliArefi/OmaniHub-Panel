import ApiService from '@/services/ApiService'

export type AdminAgencyMember = {
    id: number
    name: string
    position: string
    image: string
    agency_service_id: number
    is_active: boolean
    allow_inactive_bookable_capabilities: boolean
    agency_service?: { id: number; title: string }
}

function url(agencySlug: string, memberId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/members`
    return memberId ? `${base}/${memberId}` : base
}

export function apiGetAdminAgencyMembers(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyMember[] }>({
        url: url(agencySlug),
    })
}

export function apiCreateAdminAgencyMember(agencySlug: string, formData: FormData) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyMember }>({
        url: url(agencySlug),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiUpdateAdminAgencyMember(
    agencySlug: string,
    memberId: number,
    formData: FormData,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyMember }>({
        url: url(agencySlug, memberId),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiDeleteAdminAgencyMember(agencySlug: string, memberId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, memberId),
        method: 'delete',
    })
}
