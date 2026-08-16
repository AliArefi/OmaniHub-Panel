import useSWR from 'swr'
import { buildAdminListParams } from '@/services/admin/AdminApiService'
import type { AdminListFilters, AdminListResponse } from '@/services/admin/AdminApiService'
import type { TableQueries } from '@/@types/common'

/**
 * Shared data-fetching shape for every admin list page: SWR keyed on the
 * endpoint + current table/filter state, revalidated on demand via the
 * returned `mutate`. Mirrors the pattern in
 * src/views/members/hooks/useRolePermissonsUsers.ts.
 */
function useAdminList<T>(
    endpoint: string,
    tableData: TableQueries,
    filterData: AdminListFilters = {},
) {
    const params = buildAdminListParams(tableData, filterData)

    const { data, error, isLoading, mutate } = useSWR<AdminListResponse<T>>(
        [endpoint, params],
        ([url, queryParams]) =>
            import('@/services/ApiService').then(({ default: ApiService }) =>
                ApiService.fetchDataWithAxios<AdminListResponse<T>>({
                    url: url as string,
                    params: queryParams,
                }),
            ),
        { revalidateOnFocus: false, revalidateIfStale: false },
    )

    return {
        list: data?.data ?? [],
        total: data?.meta?.total ?? 0,
        pageSize: data?.meta?.per_page ?? tableData.pageSize ?? 20,
        currentPage: data?.meta?.current_page ?? tableData.pageIndex ?? 1,
        error,
        isLoading,
        mutate,
    }
}

export default useAdminList
