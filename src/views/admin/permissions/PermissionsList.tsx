import { useState } from 'react'
import AdminListPage from '@/components/admin/AdminListPage'
import Tooltip from '@/components/ui/Tooltip'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Form, FormItem } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { TbEdit, TbTrash, TbPlus } from 'react-icons/tb'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiCreateAdminPermission,
    apiDeleteAdminPermission,
    apiUpdateAdminPermission,
} from '@/services/admin/AdminRolesPermissionsService'
import type { AdminPermission } from '@/services/admin/AdminRolesPermissionsService'
import type { ColumnDef } from '@/components/shared/DataTable'

type DialogState = { mode: 'create' | 'edit'; permission: AdminPermission | null }

const PermissionsList = () => {
    const { can } = usePermission()
    const [dialog, setDialog] = useState<DialogState | null>(null)
    const [saving, setSaving] = useState(false)
    const { control, handleSubmit, reset } = useForm<{ name: string }>({
        defaultValues: { name: '' },
    })

    const openCreate = () => {
        setDialog({ mode: 'create', permission: null })
        reset({ name: '' })
    }

    const openEdit = (permission: AdminPermission) => {
        setDialog({ mode: 'edit', permission })
        reset({ name: permission.name })
    }

    // AdminListPage owns its own SWR key internally, so a rename/create here
    // can't trigger its revalidation directly; the list picks up the change
    // on the next natural refetch (page/search/sort change).
    const onSubmit = async (values: { name: string }) => {
        setSaving(true)
        try {
            if (dialog?.mode === 'edit' && dialog.permission) {
                await apiUpdateAdminPermission(dialog.permission.id, values)
            } else {
                await apiCreateAdminPermission(values)
            }
            toast.push(<Notification type="success" title="Saved" />)
            setDialog(null)
        } catch {
            toast.push(<Notification type="danger" title="Failed to save" />)
        } finally {
            setSaving(false)
        }
    }

    const columns = ({
        mutate,
    }: {
        mutate: () => void
    }): ColumnDef<AdminPermission>[] => [
        { header: 'Name', accessorKey: 'name' },
        {
            header: '',
            id: 'actions',
            cell: (props) => {
                const row = props.row.original
                return (
                    <div className="flex items-center gap-3">
                        {can('permissions.edit') && (
                            <Tooltip title="Edit">
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={() => openEdit(row)}
                                >
                                    <TbEdit />
                                </button>
                            </Tooltip>
                        )}
                        {can('permissions.delete') && (
                            <Tooltip title="Delete">
                                <button
                                    type="button"
                                    className="text-lg text-red-600"
                                    onClick={async () => {
                                        try {
                                            await apiDeleteAdminPermission(row.id)
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
        <>
            {can('permissions.create') && (
                <div className="mb-4 flex justify-end max-w-6xl mx-auto px-4">
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<TbPlus />}
                        onClick={openCreate}
                    >
                        New
                    </Button>
                </div>
            )}
            <AdminListPage<AdminPermission>
                title="Permissions"
                endpoint="/admin/permissions"
                columns={columns}
                deletePermission="permissions.delete"
                viewPermission="permissions.view"
                searchPlaceholder="Search permissions…"
            />
            <Dialog
                isOpen={Boolean(dialog)}
                onClose={() => setDialog(null)}
                onRequestClose={() => setDialog(null)}
            >
                <h5 className="mb-4">
                    {dialog?.mode === 'edit' ? 'Edit permission' : 'New permission'}
                </h5>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Name">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => setDialog(null)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="solid" loading={saving}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}

export default PermissionsList
