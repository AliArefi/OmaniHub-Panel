import ApiService from '@/services/ApiService'

export type AdminOwnerOption = {
    id: number
    name: string
    email: string
    mobile: string | null
    avatar: string | null
    email_verified_at: string | null
}

export function apiGetAdminOwnerOptions(query = '') {
    return ApiService.fetchDataWithAxios<{ data: AdminOwnerOption[] }>({
        url: '/admin/owner-options',
        params: query ? { query } : undefined,
    })
}
