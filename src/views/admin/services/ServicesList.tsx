import { useState } from 'react'
import { useNavigate } from 'react-router'
import AdminListPage from '@/components/admin/AdminListPage'
import AdminPreviewAction from '@/components/admin/AdminPreviewAction'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { TbEdit, TbTrash } from 'react-icons/tb'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { apiDeleteAdminService } from '@/services/admin/AdminServicesService'
import type { AdminService } from '@/@types/admin'
import type { ColumnDef } from '@/components/shared/DataTable'

const statusColor: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
}

const ServicesList = () => {
    const navigate = useNavigate()
    const { can } = usePermission()
    const [pendingDelete, setPendingDelete] = useState<{
        service: AdminService
        mutate: () => void
    } | null>(null)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!pendingDelete) return

        setDeleting(true)
        try {
            await apiDeleteAdminService(pendingDelete.service.slug)
            toast.push(<Notification type="success" title="Deleted" />)
            pendingDelete.mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setDeleting(false)
            setPendingDelete(null)
        }
    }

    const columns = ({ mutate, isTrash }: { mutate: () => void; isTrash: boolean }): ColumnDef<AdminService>[] => [
        {
            header: 'Name',
            accessorKey: 'name',
            cell: (props) => props.row.original.name ?? props.row.original.title,
        },
        {
            header: 'Slug',
            accessorKey: 'slug',
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (props) => (
                <Tag className={statusColor[props.row.original.status]}>
                    {props.row.original.status}
                </Tag>
            ),
        },
        {
            header: 'Order',
            accessorKey: 'order_number',
        },
        {
            header: '',
            id: 'actions',
            cell: (props) => {
                const row = props.row.original
                return (
                    <div className="flex items-center gap-3">
                        {!isTrash && <AdminPreviewAction label="service" slug={row.slug} />}
                        {!isTrash && can('services.edit') && (
                            <Tooltip title="Edit">
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={() =>
                                        navigate(`/admin/services/${row.slug}/edit`)
                                    }
                                >
                                    <TbEdit />
                                </button>
                            </Tooltip>
                        )}
                        {!isTrash && can('services.delete') && (
                            <Tooltip title="Delete">
                                <button
                                    type="button"
                                    className="text-lg text-red-600"
                                    onClick={() =>
                                        setPendingDelete({ service: row, mutate })
                                    }
                                >
                                    <TbTrash />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <>
            <AdminListPage<AdminService>
                trashEnabled
                title="Services"
                endpoint="/admin/services"
                columns={columns}
                createPath="/admin/services/new"
                createPermission="services.create"
                deletePermission="services.delete"
                viewPermission="services.view"
                searchPlaceholder="Search services…"
                statusFilters={['published', 'draft', 'pending']}
            />
            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete service"
                confirmButtonProps={{ loading: deleting }}
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Delete service &quot;{pendingDelete?.service.name ?? pendingDelete?.service.title}&quot;? It can be restored from the trash.
            </ConfirmDialog>
        </>
    )
}

export default ServicesList
