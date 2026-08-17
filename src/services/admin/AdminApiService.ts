import ApiService from '@/services/ApiService'
import type { TableQueries } from '@/@types/common'

export type AdminListMeta = {
    total: number
    per_page: number
    current_page: number
    last_page: number
}

export type AdminListResponse<T> = {
    data: T[]
    meta: AdminListMeta
    counts?: Record<string, number>
}

export type AdminListFilters = Record<string, string | number | boolean | undefined>

/**
 * Maps this app's TableQueries shape to the admin API's query convention
 * (?query=&sort=&order=&page=&per_page=), established in
 * app/Http/Controllers/Api/Admin/Concerns/HandlesIndexQuery.php — no such
 * convention exists elsewhere in this codebase, so it lives here rather than
 * in the generic ApiService.
 */
export function buildAdminListParams(
    tableData: TableQueries,
    filters: AdminListFilters = {},
) {
    const params: Record<string, string | number | boolean> = {
        page: tableData.pageIndex ?? 1,
        per_page: tableData.pageSize ?? 20,
    }

    if (tableData.query) {
        params.query = tableData.query
    }

    if (tableData.sort?.key && tableData.sort.order) {
        params.sort = String(tableData.sort.key)
        params.order = tableData.sort.order
    }

    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== '') {
            params[key] = value
        }
    }

    return params
}

export type AdminBulkAction = 'delete' | 'restore' | 'force-delete'

export type AdminBulkResponse = {
    success: boolean
    affected: number
    skipped: Array<{ id: number | string; reason: string }>
}

export function apiAdminBulkAction(
    url: string,
    action: AdminBulkAction,
    ids: Array<number | string>,
) {
    return ApiService.fetchDataWithAxios<AdminBulkResponse>({
        url,
        method: 'post',
        data: { action, ids },
    })
}
