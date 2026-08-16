import ApiService from '@/services/ApiService'
import { apiAdminBulkAction } from '@/services/admin/AdminApiService'
import type { AdminAgency, AdminServiceTreeOption } from '@/@types/admin'
import type { AdminBulkAction } from '@/services/admin/AdminApiService'

export function apiGetAdminAgencyServiceOptions() {
    return ApiService.fetchDataWithAxios<{ data: AdminServiceTreeOption[] }>({
        url: '/admin/agencies/service-options',
    })
}

export function apiGetAdminAgency(slug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgency }>({
        url: `/admin/agencies/${encodeURIComponent(slug)}`,
    })
}

export function apiCreateAdminAgency(formData: FormData) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgency }>({
        url: '/admin/agencies',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiUpdateAdminAgency(slug: string, formData: FormData) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgency }>({
        url: `/admin/agencies/${encodeURIComponent(slug)}`,
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiDeleteAdminAgency(slug: string) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/admin/agencies/${encodeURIComponent(slug)}`,
        method: 'delete',
    })
}

export function apiBulkAdminAgencies(action: AdminBulkAction, ids: number[]) {
    return apiAdminBulkAction('/admin/agencies/bulk', action, ids)
}
