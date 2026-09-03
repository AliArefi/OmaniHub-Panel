import ApiService from '@/services/ApiService'
import { apiAdminBulkAction } from '@/services/admin/AdminApiService'
import type { AdminUser, AdminAuthSummary } from '@/@types/admin'
import type { AdminBulkAction } from '@/services/admin/AdminApiService'

export function apiGetAdminUser(id: number) {
    return ApiService.fetchDataWithAxios<{ data: AdminUser }>({
        url: `/admin/users/${id}`,
    })
}

export function apiGetAdminUserAuthSummary(id: number) {
    return ApiService.fetchDataWithAxios<{ data: AdminAuthSummary }>({
        url: `/admin/users/${id}/auth-summary`,
    })
}

export function apiCreateAdminUser(payload: {
    name: string
    email: string
    bio?: string
    password: string
    password_confirmation: string
    role_ids?: number[]
}) {
    return ApiService.fetchDataWithAxios<{ data: AdminUser }>({
        url: '/admin/users',
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminUser(
    id: number,
    payload: {
        name: string
        email: string
        bio?: string
        password?: string
        password_confirmation?: string
    },
) {
    return ApiService.fetchDataWithAxios<{ data: AdminUser }>({
        url: `/admin/users/${id}`,
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminUser(id: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/admin/users/${id}`,
        method: 'delete',
    })
}

export function apiBulkAdminUsers(action: AdminBulkAction, ids: number[]) {
    return apiAdminBulkAction('/admin/users/bulk', action, ids)
}

export function apiUpdateAdminUserRoles(id: number, roleIds: number[]) {
    return ApiService.fetchDataWithAxios<{ data: AdminUser }>({
        url: `/admin/users/${id}/roles`,
        method: 'put',
        data: { roles: roleIds },
    })
}
