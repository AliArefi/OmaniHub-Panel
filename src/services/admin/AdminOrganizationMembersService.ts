import ApiService from '@/services/ApiService'

export type AdminOrganizationMember = {
    id: number
    name: string
    slug: string
    position: string | null
    description: string
    image: string | null
    is_active: boolean
    sort_order: number
    translations?: Record<string, Record<string, string>>
}

function url(organizationSlug: string, memberId?: number) {
    const base = `/admin/organizations/${encodeURIComponent(organizationSlug)}/members`
    return memberId ? `${base}/${memberId}` : base
}

export function apiGetAdminOrganizationMembers(organizationSlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationMember[] }>({
        url: url(organizationSlug),
    })
}

export function apiCreateAdminOrganizationMember(organizationSlug: string, formData: FormData) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationMember }>({
        url: url(organizationSlug),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiUpdateAdminOrganizationMember(
    organizationSlug: string,
    memberId: number,
    formData: FormData,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationMember }>({
        url: url(organizationSlug, memberId),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiDeleteAdminOrganizationMember(organizationSlug: string, memberId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(organizationSlug, memberId),
        method: 'delete',
    })
}
