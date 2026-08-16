import { useState } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useNavigate } from 'react-router'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import DebouceInput from '@/components/shared/DebouceInput'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/ui/Button'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import useAdminList from '@/utils/hooks/useAdminList'
import { apiAdminBulkAction } from '@/services/admin/AdminApiService'
import { TbPlus, TbTrash, TbSearch } from 'react-icons/tb'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import type { AdminListFilters } from '@/services/admin/AdminApiService'

export type AdminListPageProps<T extends { id: number }> = {
    title: string
    endpoint: string
    bulkEndpoint?: string
    columns: (helpers: { mutate: () => void }) => ColumnDef<T>[]
    createPath?: string
    createPermission?: string
    deletePermission?: string
    viewPermission?: string
    filterData?: AdminListFilters
    extraFilters?: React.ReactNode
    searchPlaceholder?: string
}

/**
 * Shared list-page shell used by every admin area (services, agencies,
 * organizations, users, roles, permissions): search + sortable/paginated
 * DataTable + row-selection bulk delete + a Create button, all gated by
 * permission. Areas provide their own column defs and endpoint; everything
 * else — table state, search debouncing, bulk-delete flow — lives here once
 * instead of being re-implemented per area.
 */
function AdminListPage<T extends { id: number }>(props: AdminListPageProps<T>) {
    const {
        title,
        endpoint,
        bulkEndpoint,
        columns,
        createPath,
        createPermission,
        deletePermission,
        viewPermission,
        filterData = {},
        extraFilters,
        searchPlaceholder = 'Search…',
    } = props

    const navigate = useNavigate()
    const { can } = usePermission()
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 20,
        query: '',
        sort: { order: '', key: '' },
    })
    const [selected, setSelected] = useState<T[]>([])
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const { list, total, isLoading, mutate } = useAdminList<T>(
        endpoint,
        tableData,
        filterData,
    )

    const canCreate = !createPermission || can(createPermission)
    const canDelete = !deletePermission || can(deletePermission)
    const canView = !viewPermission || can(viewPermission)

    const handlePaginationChange = (page: number) => {
        setTableData((prev) => ({ ...cloneDeep(prev), pageIndex: page }))
    }

    const handleSelectChange = (value: number) => {
        setTableData((prev) => ({
            ...cloneDeep(prev),
            pageSize: Number(value),
            pageIndex: 1,
        }))
    }

    const handleSort = (sort: OnSortParam) => {
        setTableData((prev) => ({ ...cloneDeep(prev), sort }))
    }

    const handleSearch = (value: string) => {
        setTableData((prev) => ({ ...cloneDeep(prev), query: value, pageIndex: 1 }))
    }

    const handleBulkDelete = async () => {
        setDeleting(true)
        try {
            const result = await apiAdminBulkAction(
                bulkEndpoint ?? `${endpoint}/bulk`,
                'delete',
                selected.map((row) => row.id),
            )
            toast.push(
                <Notification type="success" title="Deleted">
                    {result.affected} item(s) deleted.
                </Notification>,
            )
            setSelected([])
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Failed">
                    Could not delete the selected items.
                </Notification>,
            )
        } finally {
            setDeleting(false)
            setConfirmOpen(false)
        }
    }

    if (!canView) {
        return null
    }

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h3>{title}</h3>
                        <div className="flex items-center gap-2">
                            {selected.length > 0 && canDelete && (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    icon={<TbTrash />}
                                    loading={deleting}
                                    onClick={() => setConfirmOpen(true)}
                                >
                                    Delete ({selected.length})
                                </Button>
                            )}
                            {createPath && canCreate && (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<TbPlus />}
                                    onClick={() => navigate(createPath)}
                                >
                                    New
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                        <DebouceInput
                            placeholder={searchPlaceholder}
                            prefix={<TbSearch className="text-lg" />}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {extraFilters}
                    </div>
                    <DataTable
                        columns={columns({ mutate })}
                        data={list}
                        loading={isLoading}
                        noData={!isLoading && list.length === 0}
                        selectable={canDelete}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex ?? 1,
                            pageSize: tableData.pageSize ?? 20,
                        }}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        checkboxChecked={(row) =>
                            selected.some((s) => s.id === row.id)
                        }
                        onCheckBoxChange={(checked, row) => {
                            setSelected((prev) =>
                                checked
                                    ? [...prev, row]
                                    : prev.filter((r) => r.id !== row.id),
                            )
                        }}
                        onIndeterminateCheckBoxChange={(checked, rows) => {
                            setSelected(
                                checked ? rows.map((r) => r.original) : [],
                            )
                        }}
                    />
                </div>
            </AdaptiveCard>
            <ConfirmDialog
                isOpen={confirmOpen}
                type="danger"
                title="Delete selected items"
                confirmButtonProps={{ loading: deleting }}
                onClose={() => setConfirmOpen(false)}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={handleBulkDelete}
            >
                Are you sure you want to delete {selected.length} item(s)? This
                can be undone from the trash while soft-deleted.
            </ConfirmDialog>
        </Container>
    )
}

export default AdminListPage
