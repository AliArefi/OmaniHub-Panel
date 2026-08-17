import { useNavigate } from 'react-router'
import AdminListPage from '@/components/admin/AdminListPage'
import AdminPreviewAction from '@/components/admin/AdminPreviewAction'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
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

    const columns = ({ mutate }: { mutate: () => void }): ColumnDef<AdminService>[] => [
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
                        <AdminPreviewAction label="service" slug={row.slug} />
                        {can('services.edit') && (
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
                        {can('services.delete') && (
                            <Tooltip title="Delete">
                                <button
                                    type="button"
                                    className="text-lg text-red-600"
                                    onClick={async () => {
                                        try {
                                            await apiDeleteAdminService(row.slug)
                                            toast.push(
                                                <Notification
                                                    type="success"
                                                    title="Deleted"
                                                />,
                                            )
                                            mutate()
                                        } catch {
                                            toast.push(
                                                <Notification
                                                    type="danger"
                                                    title="Failed to delete"
                                                />,
                                            )
                                        }
                                    }}
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
        <AdminListPage<AdminService>
            title="Services"
            endpoint="/admin/services"
            columns={columns}
            createPath="/admin/services/new"
            createPermission="services.create"
            deletePermission="services.delete"
            viewPermission="services.view"
            searchPlaceholder="Search services…"
        />
    )
}

export default ServicesList
