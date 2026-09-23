import ApiService from '@/services/ApiService'

export type AdminAgencyMember = {
    id: number
    name: string
    position: string
    image: string
    agency_service_id: number
    agency_service_ids: number[]
    is_active: boolean
    allow_inactive_bookable_capabilities: boolean
    agency_service?: { id: number; title: string }
    agency_services: Array<{ id: number; title: string }>
    user_id: number | null
    linked: boolean
    linked_user?: { id: number; name: string; email?: string; mobile?: string } | null
    roles: Array<{ id: number; name: string }>
}

export type MemberUserOption = { id: number; name: string; email?: string; mobile?: string }

function url(agencySlug: string, memberId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/members`
    return memberId ? `${base}/${memberId}` : base
}

export function apiGetAdminAgencyMembers(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyMember[] }>({
        url: url(agencySlug),
    })
}

export function apiSearchMemberUsers(agencySlug: string, search: string) {
    return ApiService.fetchDataWithAxios<{ data: MemberUserOption[] }>({
        url: `/admin/agencies/${encodeURIComponent(agencySlug)}/member-user-options`,
        params: { search },
    })
}

export function apiCreateAdminAgencyMember(
    agencySlug: string,
    formData: FormData,
) {
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

export function apiDeleteAdminAgencyMember(
    agencySlug: string,
    memberId: number,
) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, memberId),
        method: 'delete',
    })
}
