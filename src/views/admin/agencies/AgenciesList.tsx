import { useState } from 'react'
import { useNavigate } from 'react-router'
import AdminListPage from '@/components/admin/AdminListPage'
import AdminPreviewAction from '@/components/admin/AdminPreviewAction'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { TbEdit, TbTrash } from 'react-icons/tb'
import axios from 'axios'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { apiDeleteAdminAgency } from '@/services/admin/AdminAgenciesService'
import type { AdminAgency } from '@/@types/admin'
import type { ColumnDef } from '@/components/shared/DataTable'

const statusColor: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
}

const AgenciesList = () => {
    const navigate = useNavigate()
    const { can } = usePermission()
    const [pendingDelete, setPendingDelete] = useState<{
        agency: AdminAgency
        mutate: () => void
    } | null>(null)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!pendingDelete) return

        setDeleting(true)
        try {
            await apiDeleteAdminAgency(pendingDelete.agency.slug)
            toast.push(<Notification type="success" title="Deleted" />)
            pendingDelete.mutate()
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                pendingDelete.mutate()
                toast.push(
                    <Notification type="success" title="Already deleted" />,
                )
            } else {
                toast.push(
                    <Notification type="danger" title="Failed to delete" />,
                )
            }
        } finally {
            setDeleting(false)
            setPendingDelete(null)
        }
    }

    const columns = ({ mutate, isTrash }: { mutate: () => void; isTrash: boolean }): ColumnDef<AdminAgency>[] => [
        {
            header: 'Agency',
            accessorKey: 'title',
            cell: (props) => (
                <div className="flex items-center gap-2">
                    <Avatar shape="round" size={28} src={props.row.original.logo ?? undefined} />
                    <span>{props.row.original.title}</span>
                </div>
            ),
        },
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
        {
            header: 'Organization',
            id: 'organization',
            cell: (props) => props.row.original.organization?.title ?? '—',
        },
        {
            header: '',
            id: 'actions',
            cell: (props) => {
                const row = props.row.original
                return (
                    <div className="flex items-center gap-3">
                        {!isTrash && <AdminPreviewAction label="agency" slug={row.slug} />}
                        {!isTrash && can('agencies.edit') && (
                            <Tooltip title="Edit">
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={() =>
                                        navigate(`/admin/agencies/${row.slug}/edit`)
                                    }
                                >
                                    <TbEdit />
                                </button>
                            </Tooltip>
                        )}
                        {!isTrash && can('agencies.delete') && (
                            <Tooltip title="Delete">
                                <button
                                    type="button"
                                    className="text-lg text-red-600"
                                    onClick={() =>
                                        setPendingDelete({ agency: row, mutate })
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
            <AdminListPage<AdminAgency>
                trashEnabled
                title="Agencies"
                endpoint="/admin/agencies"
                columns={columns}
                createPath="/admin/agencies/new"
                createPermission="agencies.create"
                deletePermission="agencies.delete"
                viewPermission="agencies.view"
                searchPlaceholder="Search agencies…"
                statusFilters={['published', 'draft', 'pending']}
            />
            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete agency"
                confirmButtonProps={{ loading: deleting }}
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Delete agency &quot;{pendingDelete?.agency.title}&quot;? It can be restored from the trash.
            </ConfirmDialog>
        </>
    )
}

export default AgenciesList
