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
import { apiDeleteAdminOrganization } from '@/services/admin/AdminOrganizationsService'
import type { AdminOrganization } from '@/@types/admin'
import type { ColumnDef } from '@/components/shared/DataTable'

const statusColor: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
}

const OrganizationsList = () => {
    const navigate = useNavigate()
    const { can } = usePermission()
    const [pendingDelete, setPendingDelete] = useState<{
        organization: AdminOrganization
        mutate: () => void
    } | null>(null)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!pendingDelete) return

        setDeleting(true)
        try {
            await apiDeleteAdminOrganization(pendingDelete.organization.slug)
            toast.push(<Notification type="success" title="Deleted" />)
            pendingDelete.mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setDeleting(false)
            setPendingDelete(null)
        }
    }

    const columns = ({
        mutate,
        isTrash,
    }: {
        mutate: () => void
        isTrash: boolean
    }): ColumnDef<AdminOrganization>[] => [
        { header: 'Title', accessorKey: 'title' },
        { header: 'Slug', accessorKey: 'slug' },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (props) => (
                <Tag className={statusColor[props.row.original.status]}>
                    {props.row.original.status}
                </Tag>
            ),
        },
        { header: 'Agencies', accessorKey: 'agencies_count' },
        {
            header: '',
            id: 'actions',
            cell: (props) => {
                const row = props.row.original
                return (
                    <div className="flex items-center gap-3">
                        {!isTrash && (
                            <AdminPreviewAction
                                label="organization"
                                slug={row.slug}
                            />
                        )}
                        {!isTrash && can('organizations.edit') && (
                            <Tooltip title="Edit">
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={() =>
                                        navigate(
                                            `/admin/organizations/${row.slug}/edit`,
                                        )
                                    }
                                >
                                    <TbEdit />
                                </button>
                            </Tooltip>
                        )}
                        {!isTrash && can('organizations.delete') && (
                            <Tooltip title="Delete">
                                <button
                                    type="button"
                                    className="text-lg text-red-600"
                                    onClick={() =>
                                        setPendingDelete({ organization: row, mutate })
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
            <AdminListPage<AdminOrganization>
                trashEnabled
                title="Organizations"
                endpoint="/admin/organizations"
                columns={columns}
                createPath="/admin/organizations/new"
                createPermission="organizations.create"
                deletePermission="organizations.delete"
                viewPermission="organizations.view"
                searchPlaceholder="Search organizations…"
                statusFilters={['published', 'draft', 'pending']}
            />
            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete organization"
                confirmButtonProps={{ loading: deleting }}
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Delete organization &quot;{pendingDelete?.organization.title}&quot;? It can be restored from the trash.
            </ConfirmDialog>
        </>
    )
}

export default OrganizationsList
