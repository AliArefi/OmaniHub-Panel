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
import { TbPlus, TbRestore, TbSearch, TbTrash } from 'react-icons/tb'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import type { AdminListFilters } from '@/services/admin/AdminApiService'

export type AdminListPageProps<T extends { id: number }> = {
    title: string
    endpoint: string
    bulkEndpoint?: string
    columns: (helpers: { mutate: () => void; isTrash: boolean }) => ColumnDef<T>[]
    transformRows?: (rows: T[]) => T[]
    createPath?: string
    createPermission?: string
    deletePermission?: string
    viewPermission?: string
    filterData?: AdminListFilters
    extraFilters?: React.ReactNode
    searchPlaceholder?: string
    statusFilters?: string[]
    trashEnabled?: boolean
    initialPageSize?: number
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
        transformRows,
        createPath,
        createPermission,
        deletePermission,
        viewPermission,
        filterData = {},
        extraFilters,
        searchPlaceholder = 'Search…',
        statusFilters = [],
        trashEnabled = false,
        initialPageSize = 20,
    } = props

    const navigate = useNavigate()
    const { can } = usePermission()
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: initialPageSize,
        query: '',
        sort: { order: '', key: '' },
    })
    const [selected, setSelected] = useState<T[]>([])
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [status, setStatus] = useState('')
    const [isTrash, setIsTrash] = useState(false)
    const [bulkAction, setBulkAction] = useState<'delete' | 'force-delete' | null>(null)

    const activeFilters: AdminListFilters = {
        ...filterData,
        status: isTrash ? undefined : status || undefined,
        trashed: isTrash || undefined,
    }

    const { list, total, counts, isLoading, mutate } = useAdminList<T>(
        endpoint,
        tableData,
        activeFilters,
    )
    const visibleList = transformRows ? transformRows(list) : list

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

    const changeView = (trash: boolean) => {
        setIsTrash(trash)
        setStatus('')
        setSelected([])
        setTableData((prev) => ({ ...cloneDeep(prev), pageIndex: 1 }))
    }

    const changeStatus = (nextStatus: string) => {
        setStatus(nextStatus)
        setSelected([])
        setTableData((prev) => ({ ...cloneDeep(prev), pageIndex: 1 }))
    }

    const handleBulkAction = async (
        action: 'delete' | 'restore' | 'force-delete',
    ) => {
        setDeleting(true)
        try {
            const result = await apiAdminBulkAction(
                bulkEndpoint ?? `${endpoint}/bulk`,
                action,
                selected.map((row) => row.id),
            )
            toast.push(
                <Notification type="success" title="Deleted">
                    {result.affected} item(s){' '}
                    {action === 'restore' ? 'restored' : 'deleted'}.
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
            setBulkAction(null)
        }
    }

    const openDeleteConfirmation = (action: 'delete' | 'force-delete') => {
        setBulkAction(action)
        setConfirmOpen(true)
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
                                <>
                                    {isTrash && (
                                        <Button
                                            icon={<TbRestore />}
                                            loading={deleting}
                                            size="sm"
                                            variant="solid"
                                            onClick={() =>
                                                handleBulkAction('restore')
                                            }
                                        >
                                            Restore ({selected.length})
                                        </Button>
                                    )}
                                    <Button
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        icon={<TbTrash />}
                                        loading={deleting}
                                        size="sm"
                                        variant="solid"
                                        onClick={() =>
                                            openDeleteConfirmation(
                                                isTrash
                                                    ? 'force-delete'
                                                    : 'delete',
                                            )
                                        }
                                    >
                                        {isTrash ? 'Delete permanently' : 'Delete'} ({selected.length})
                                    </Button>
                                </>
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
                    {trashEnabled && (
                        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                            <button
                                className={`border-b-2 px-3 py-2 text-sm font-semibold ${!isTrash ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
                                type="button"
                                onClick={() => changeView(false)}
                            >
                                Active ({counts.all ?? 0})
                            </button>
                            <button
                                className={`border-b-2 px-3 py-2 text-sm font-semibold ${isTrash ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'}`}
                                type="button"
                                onClick={() => changeView(true)}
                            >
                                Trash ({counts.trash ?? 0})
                            </button>
                        </div>
                    )}
                    {!isTrash && statusFilters.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {[{ label: 'All', value: '' }, ...statusFilters.map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value }))].map((option) => (
                                <button
                                    key={option.value || 'all'}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${status === option.value ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-600 hover:border-primary hover:text-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
                                    type="button"
                                    onClick={() => changeStatus(option.value)}
                                >
                                    {option.label} ({counts[option.value || 'all'] ?? 0})
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-3">
                        <DebouceInput
                            placeholder={searchPlaceholder}
                            prefix={<TbSearch className="text-lg" />}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {extraFilters}
                    </div>
                    <DataTable
                        columns={columns({ mutate, isTrash })}
                        data={visibleList}
                        loading={isLoading}
                        noData={!isLoading && visibleList.length === 0}
                        selectable={canDelete}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex ?? 1,
                            pageSize: tableData.pageSize ?? initialPageSize,
                        }}
                        checkboxChecked={(row) =>
                            selected.some((s) => s.id === row.id)
                        }
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
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
                title={bulkAction === 'force-delete' ? 'Permanently delete selected items' : 'Delete selected items'}
                confirmButtonProps={{ loading: deleting }}
                onClose={() => {
                    setConfirmOpen(false)
                    setBulkAction(null)
                }}
                onCancel={() => {
                    setConfirmOpen(false)
                    setBulkAction(null)
                }}
                onConfirm={() => bulkAction && handleBulkAction(bulkAction)}
            >
                {bulkAction === 'force-delete'
                    ? `Are you sure you want to permanently delete ${selected.length} item(s)? This cannot be undone.`
                    : `Are you sure you want to delete ${selected.length} item(s)? This can be undone from the trash.`}
            </ConfirmDialog>
        </Container>
    )
}

export default AdminListPage
