import { useNavigate } from 'react-router'
import AdminListPage from '@/components/admin/AdminListPage'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import { TbEdit, TbTrash } from 'react-icons/tb'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { apiDeleteAdminUser } from '@/services/admin/AdminUsersService'
import type { AdminUser } from '@/@types/admin'
import type { ColumnDef } from '@/components/shared/DataTable'

const UsersList = () => {
    const navigate = useNavigate()
    const { can } = usePermission()

    const columns = ({ mutate }: { mutate: () => void }): ColumnDef<AdminUser>[] => [
        { header: 'Name', accessorKey: 'name' },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Roles',
            accessorKey: 'roles',
            cell: (props) => {
                const roles = props.row.original.roles

                return roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {roles.map((role) => (
                            <Tag
                                key={role}
                                className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100"
                            >
                                {role}
                            </Tag>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-500">No admin role</span>
                )
            },
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
