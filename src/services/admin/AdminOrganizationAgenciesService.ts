import ApiService from '@/services/ApiService'

export type AdminOrganizationAgencyRow = {
    id: number
    slug: string
    title: string
    status: string
    service?: { id: number; name: string }
    city?: { id: number; name: string } | null
}

export function apiGetAdminOrganizationAgencies(organizationSlug: string) {
    return ApiService.fetchDataWithAxios<{
        data: AdminOrganizationAgencyRow[]
        meta: { total: number; per_page: number; current_page: number; last_page: number }
    }>({
        url: `/admin/organizations/${encodeURIComponent(organizationSlug)}/agencies`,
    })
}
