import { useState } from 'react'
import useSWR from 'swr'
import { useNavigate } from 'react-router'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbPlus, TbEdit, TbTrash } from 'react-icons/tb'
import {
    apiGetAdminRoles,
    apiDeleteAdminRole,
} from '@/services/admin/AdminRolesPermissionsService'
import type { AdminRole } from '@/services/admin/AdminRolesPermissionsService'

const RolesList = (): React.JSX.Element => {
    const navigate = useNavigate()
    const { can } = usePermission()
    const { data, mutate } = useSWR('admin-roles-list', apiGetAdminRoles)
    const [pendingDelete, setPendingDelete] = useState<AdminRole | null>(null)

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminRole(pendingDelete.id)
            toast.push(<Notification type="success" title="Deleted" />)
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to delete" />,
            )
        } finally {
            setPendingDelete(null)
        }
    }

    if (!can('roles.view')) return <></>

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex items-center justify-between mb-6">
                    <h3>Roles</h3>
                    {can('roles.create') && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={() => navigate('/admin/roles/new')}
                        >
                            New
                        </Button>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    {(data?.data ?? []).map((role) => (
                        <div
                            key={role.id}
                            className="flex items-center justify-between border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3"
                        >
                            <div>
                                <div className="font-semibold">{role.name}</div>
                                <div className="text-xs text-gray-500">
                                    {role.permissions_count ?? 0} permissions
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {can('roles.edit') && (
                                    <Tooltip title="Edit">
                                        <button
                                            type="button"
                                            className="text-lg"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/roles/${role.id}/edit`,
                                                )
                                            }
                                        >
                                            <TbEdit />
                                        </button>
                                    </Tooltip>
                                )}
                                {can('roles.delete') && (
                                    <Tooltip title="Delete">
                                        <button
                                            type="button"
                                            className="text-lg text-red-600"
                                            onClick={() => setPendingDelete(role)}
                                        >
                                            <TbTrash />
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </AdaptiveCard>
            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete role"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Delete role &quot;{pendingDelete?.name}&quot;? All admins holding
                it will lose its permissions.
            </ConfirmDialog>
        </Container>
    )
}

export default RolesList
