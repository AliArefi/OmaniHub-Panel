import ApiService from '@/services/ApiService'
import { apiAdminBulkAction } from '@/services/admin/AdminApiService'
import type { AdminService, AdminServiceTreeOption } from '@/@types/admin'
import type { AdminBulkAction } from '@/services/admin/AdminApiService'

export function apiGetAdminServiceTree(excludeId?: number) {
    return ApiService.fetchDataWithAxios<{ data: AdminServiceTreeOption[] }>({
        url: '/admin/services/tree',
        params: excludeId ? { exclude: excludeId } : undefined,
    })
}

export function apiGetAdminService(slug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminService }>({
        url: `/admin/services/${encodeURIComponent(slug)}`,
    })
}

export function apiCreateAdminService(formData: FormData) {
    return ApiService.fetchDataWithAxios<{ data: AdminService }>({
        url: '/admin/services',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiUpdateAdminService(slug: string, formData: FormData) {
    // The backend registers this same action under both PATCH and POST
    // (routes/admin-api.php) — POST is used here because multipart file
    // uploads via PATCH are unreliable across browsers/axios.
    return ApiService.fetchDataWithAxios<{ data: AdminService }>({
        url: `/admin/services/${encodeURIComponent(slug)}`,
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiDeleteAdminService(slug: string) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/admin/services/${encodeURIComponent(slug)}`,
        method: 'delete',
    })
}

export function apiBulkAdminServices(action: AdminBulkAction, ids: number[]) {
    return apiAdminBulkAction('/admin/services/bulk', action, ids)
}
