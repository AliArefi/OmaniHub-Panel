import { useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Dialog from '@/components/ui/Dialog'
import { Form, FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbPlus, TbEdit, TbTrash } from 'react-icons/tb'
import {
    apiGetAdminOrganizationRibbons,
    apiCreateAdminOrganizationRibbon,
    apiUpdateAdminOrganizationRibbon,
    apiDeleteAdminOrganizationRibbon,
} from '@/services/admin/AdminOrganizationRibbonsService'
import type { AdminOrganizationRibbonItem } from '@/services/admin/AdminOrganizationRibbonsService'

type FormValues = { text: string; is_active: boolean; sort_order: number }
const emptyValues: FormValues = { text: '', is_active: true, sort_order: 0 }

/**
 * React port of the organization "Ribbons" tab — short rotating text items
 * shown in the organization page's ribbon/marquee banner.
 */
function OrganizationRibbonsTab({ organizationSlug }: { organizationSlug: string }) {
    const { can } = usePermission()
    const canEdit = can('organizations.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<AdminOrganizationRibbonItem | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminOrganizationRibbonItem | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { data, mutate, isLoading } = useSWR(
        ['admin-organization-ribbons', organizationSlug],
        () => apiGetAdminOrganizationRibbons(organizationSlug),
    )
    const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: emptyValues })
    const items = data?.data ?? []

    const openCreate = () => {
        setEditing(null)
        reset(emptyValues)
        setDialogOpen(true)
    }

    const openEdit = (item: AdminOrganizationRibbonItem) => {
        setEditing(item)
        reset({ text: item.text, is_active: item.is_active, sort_order: item.sort_order })
        setDialogOpen(true)
    }

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true)
        try {
            if (editing) {
                await apiUpdateAdminOrganizationRibbon(organizationSlug, editing.id, values)
            } else {
                await apiCreateAdminOrganizationRibbon(organizationSlug, values)
            }
            toast.push(<Notification type="success" title="Saved" />)
            setDialogOpen(false)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to save" />)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminOrganizationRibbon(organizationSlug, pendingDelete.id)
            toast.push(<Notification type="success" title="Deleted" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setPendingDelete(null)
        }
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h5>Ribbons</h5>
                {canEdit && (
                    <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                        Add ribbon item
                    </Button>
                )}
            </div>

            {!isLoading && items.length === 0 && (
                <div className="text-center text-gray-400 py-8">No ribbon items yet.</div>
            )}

            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                        <div>
                            <div className="font-semibold">{item.text}</div>
                            <div className="text-xs text-gray-500">
                                Order {item.sort_order} · {item.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="xs" icon={<TbEdit />} onClick={() => openEdit(item)} />
                                <Button
                                    size="xs"
                                    icon={<TbTrash />}
                                    onClick={() => setPendingDelete(item)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">{editing ? 'Edit ribbon item' : 'New ribbon item'}</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Text">
                        <Controller
                            name="text"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Sort order">
                            <Controller
                                name="sort_order"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Active">
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher checked={value} onChange={onChange} />
                                )}
                            />
                        </FormItem>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="plain" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="solid" loading={submitting}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete ribbon item"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this ribbon item?
            </ConfirmDialog>
        </Card>
    )
}

export default OrganizationRibbonsTab
