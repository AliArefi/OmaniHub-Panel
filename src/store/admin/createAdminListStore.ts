import { create } from 'zustand'
import type { TableQueries } from '@/@types/common'

export type AdminDialogState = {
    open: boolean
    type: '' | 'new' | 'edit'
    id: number | string | null
}

export type AdminListState<Filters extends object> = {
    tableData: TableQueries
    filterData: Filters
    selectedIds: Array<number | string>
    dialog: AdminDialogState
}

export type AdminListActions<Filters extends object> = {
    setTableData: (data: TableQueries) => void
    setFilterData: (data: Filters) => void
    setSelectedIds: (ids: Array<number | string>) => void
    toggleSelected: (id: number | string, checked: boolean) => void
    clearSelected: () => void
    openDialog: (type: 'new' | 'edit', id?: number | string | null) => void
    closeDialog: () => void
}

const defaultTableData: TableQueries = {
    pageIndex: 1,
    pageSize: 20,
    query: '',
    sort: { order: '', key: '' },
}

/**
 * Every admin list page (services, agencies, organizations, users, roles,
 * permissions) needs the same shape of state — pagination/search/sort,
 * a bulk-selection set, and a create/edit dialog toggle. Rather than
 * hand-write six nearly-identical zustand stores (the pattern
 * src/views/members/store/rolePermissionsStore.ts uses per-feature), this
 * factory builds one per area from a single implementation.
 */
export function createAdminListStore<Filters extends object>(
    initialFilterData: Filters,
) {
    return create<AdminListState<Filters> & AdminListActions<Filters>>(
        (set) => ({
            tableData: { ...defaultTableData },
            filterData: { ...initialFilterData },
            selectedIds: [],
            dialog: { open: false, type: '', id: null },
            setTableData: (data) => set({ tableData: data }),
            setFilterData: (data) =>
                set({
                    filterData: data,
                    tableData: { ...defaultTableData, sort: undefined },
                }),
            setSelectedIds: (ids) => set({ selectedIds: ids }),
            toggleSelected: (id, checked) =>
                set((state) => ({
                    selectedIds: checked
                        ? [...state.selectedIds, id]
                        : state.selectedIds.filter((x) => x !== id),
                })),
            clearSelected: () => set({ selectedIds: [] }),
            openDialog: (type, id = null) =>
                set({ dialog: { open: true, type, id } }),
            closeDialog: () =>
                set({ dialog: { open: false, type: '', id: null } }),
        }),
    )
}
