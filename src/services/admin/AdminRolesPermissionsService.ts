import ApiService from '@/services/ApiService'

export type AdminRole = {
    id: number
    name: string
    permissions_count?: number
}

export type AdminRoleDetail = {
    id: number
    name: string
    permissions: string[]
}

export type AdminPermission = {
    id: number
    name: string
}

export type AdminPermissionGroup = {
    group: string
    permissions: AdminPermission[]
}

export function apiGetAdminRoles() {
    return ApiService.fetchDataWithAxios<{ data: AdminRole[] }>({
        url: '/admin/roles',
    })
}

export function apiGetAdminRole(id: number) {
    return ApiService.fetchDataWithAxios<{ data: AdminRoleDetail }>({
        url: `/admin/roles/${id}`,
    })
}

export function apiCreateAdminRole(payload: { name: string; permissions: string[] }) {
    return ApiService.fetchDataWithAxios<{ data: AdminRoleDetail }>({
        url: '/admin/roles',
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminRole(
    id: number,
    payload: { name: string; permissions: string[] },
) {
    return ApiService.fetchDataWithAxios<{ data: AdminRoleDetail }>({
        url: `/admin/roles/${id}`,
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminRole(id: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/admin/roles/${id}`,
        method: 'delete',
    })
}

export function apiGetGroupedPermissions() {
    return ApiService.fetchDataWithAxios<{ data: AdminPermissionGroup[] }>({
        url: '/admin/permissions/grouped',
    })
}

export function apiGetAdminPermissions(params?: {
    page?: number
    per_page?: number
    query?: string
    sort?: string
    order?: string
}) {
    return ApiService.fetchDataWithAxios<{
        data: AdminPermission[]
        meta: { total: number; per_page: number; current_page: number; last_page: number }
    }>({
        url: '/admin/permissions',
        params,
    })
}

export function apiCreateAdminPermission(payload: { name: string }) {
    return ApiService.fetchDataWithAxios<{ data: AdminPermission }>({
        url: '/admin/permissions',
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminPermission(id: number, payload: { name: string }) {
    return ApiService.fetchDataWithAxios<{ data: AdminPermission }>({
        url: `/admin/permissions/${id}`,
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminPermission(id: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/admin/permissions/${id}`,
        method: 'delete',
    })
}
