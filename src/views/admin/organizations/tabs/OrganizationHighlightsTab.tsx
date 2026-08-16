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
    apiGetAdminOrganizationHighlights,
    apiCreateAdminOrganizationHighlight,
    apiUpdateAdminOrganizationHighlight,
    apiDeleteAdminOrganizationHighlight,
} from '@/services/admin/AdminOrganizationHighlightsService'
import type { AdminOrganizationHighlight } from '@/services/admin/AdminOrganizationHighlightsService'

type FormValues = { value: string; label: string; is_active: boolean; sort_order: number }
const emptyValues: FormValues = { value: '', label: '', is_active: true, sort_order: 0 }

/**
 * React port of the organization "Highlights" tab — short value/label stat
 * pairs (e.g. "10+ / Years of experience") shown on the public page.
 */
function OrganizationHighlightsTab({ organizationSlug }: { organizationSlug: string }) {
    const { can } = usePermission()
    const canEdit = can('organizations.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<AdminOrganizationHighlight | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminOrganizationHighlight | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { data, mutate, isLoading } = useSWR(
        ['admin-organization-highlights', organizationSlug],
        () => apiGetAdminOrganizationHighlights(organizationSlug),
    )
    const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: emptyValues })
    const highlights = data?.data ?? []

    const openCreate = () => {
        setEditing(null)
        reset(emptyValues)
        setDialogOpen(true)
    }

    const openEdit = (highlight: AdminOrganizationHighlight) => {
        setEditing(highlight)
        reset({
            value: highlight.value,
            label: highlight.label,
            is_active: highlight.is_active,
            sort_order: highlight.sort_order,
        })
        setDialogOpen(true)
    }

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true)
        try {
            if (editing) {
                await apiUpdateAdminOrganizationHighlight(organizationSlug, editing.id, values)
            } else {
                await apiCreateAdminOrganizationHighlight(organizationSlug, values)
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
            await apiDeleteAdminOrganizationHighlight(organizationSlug, pendingDelete.id)
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
                <h5>Highlights</h5>
                {canEdit && (
                    <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                        Add highlight
                    </Button>
                )}
            </div>

            {!isLoading && highlights.length === 0 && (
                <div className="text-center text-gray-400 py-8">No highlights yet.</div>
            )}

            <div className="flex flex-col gap-2">
                {highlights.map((h) => (
                    <div
                        key={h.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                        <div>
                            <div className="font-semibold">
                                {h.value} — {h.label}
                            </div>
                            <div className="text-xs text-gray-500">
                                Order {h.sort_order} · {h.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="xs" icon={<TbEdit />} onClick={() => openEdit(h)} />
                                <Button
                                    size="xs"
                                    icon={<TbTrash />}
                                    onClick={() => setPendingDelete(h)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">{editing ? 'Edit highlight' : 'New highlight'}</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Value (e.g. 10+)">
                        <Controller
                            name="value"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Label">
                        <Controller
                            name="label"
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
                title="Delete highlight"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this highlight?
            </ConfirmDialog>
        </Card>
    )
}

export default OrganizationHighlightsTab
