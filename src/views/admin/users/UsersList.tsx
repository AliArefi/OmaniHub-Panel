import { useNavigate } from 'react-router'
import AdminListPage from '@/components/admin/AdminListPage'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import { TbEdit, TbTrash, TbShieldCheck } from 'react-icons/tb'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiDeleteAdminUser,
    apiUpdateAdminUserAdminStatus,
} from '@/services/admin/AdminUsersService'
import type { AdminUser } from '@/@types/admin'
import type { ColumnDef } from '@/components/shared/DataTable'

const UsersList = () => {
    const navigate = useNavigate()
    const { can } = usePermission()

    const columns = ({ mutate }: { mutate: () => void }): ColumnDef<AdminUser>[] => [
        { header: 'Name', accessorKey: 'name' },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Admin',
            accessorKey: 'is_admin',
            cell: (props) =>
                props.row.original.is_admin ? (
                    <Tag className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100">
                        Admin
                    </Tag>
                ) : (
                    '—'
                ),
        },
        {
            header: 'Verified',
            id: 'verified',
            cell: (props) =>
                props.row.original.email_verified_at ? (
                    <Tag className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100">
                        Verified
                    </Tag>
                ) : (
                    <Tag className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                        Unverified
                    </Tag>
                ),
        },
        {
            header: '',
            id: 'actions',
            cell: (props) => {
                const row = props.row.original
                return (
                    <div className="flex items-center gap-3">
                        {can('users.edit') && (
                            <Tooltip title="Edit">
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={() =>
                                        navigate(`/admin/users/${row.id}/edit`)
                                    }
                                >
                                    <TbEdit />
                                </button>
                            </Tooltip>
                        )}
                        {can('admins') && (
                            <Tooltip
                                title={
                                    row.is_admin
                                        ? 'Revoke admin access'
                                        : 'Grant admin access'
                                }
                            >
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={async () => {
                                        try {
                                            await apiUpdateAdminUserAdminStatus(
                                                row.id,
                                                !row.is_admin,
                                            )
                                            toast.push(
                                                <Notification
                                                    type="success"
                                                    title="Updated"
                                                />,
                                            )
                                            mutate()
                                        } catch {
                                            toast.push(
                                                <Notification
                                                    type="danger"
                                                    title="Failed to update"
                                                />,
                                            )
                                        }
                                    }}
                                >
                                    <TbShieldCheck />
                                </button>
                            </Tooltip>
                        )}
                        {can('users.delete') && (
                            <Tooltip title="Delete">
                                <button
                                    type="button"
                                    className="text-lg text-red-600"
                                    onClick={async () => {
                                        try {
                                            await apiDeleteAdminUser(row.id)
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
        <AdminListPage<AdminUser>
            title="Users"
            endpoint="/admin/users"
            columns={columns}
            createPath="/admin/users/new"
            createPermission="users.create"
            deletePermission="users.delete"
            viewPermission="users.view"
            searchPlaceholder="Search users…"
        />
    )
}

export default UsersList
