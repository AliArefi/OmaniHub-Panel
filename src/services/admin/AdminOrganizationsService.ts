import ApiService from '@/services/ApiService'
import { apiAdminBulkAction } from '@/services/admin/AdminApiService'
import type { AdminOrganization } from '@/@types/admin'
import type { AdminBulkAction } from '@/services/admin/AdminApiService'

export function apiGetAdminOrganization(slug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganization }>({
        url: `/admin/organizations/${encodeURIComponent(slug)}`,
    })
}

export function apiCreateAdminOrganization(payload: Record<string, unknown>) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganization }>({
        url: '/admin/organizations',
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminOrganization(
    slug: string,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganization }>({
        url: `/admin/organizations/${encodeURIComponent(slug)}`,
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminOrganization(slug: string) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/admin/organizations/${encodeURIComponent(slug)}`,
        method: 'delete',
    })
}

export function apiBulkAdminOrganizations(action: AdminBulkAction, ids: number[]) {
    return apiAdminBulkAction('/admin/organizations/bulk', action, ids)
}
