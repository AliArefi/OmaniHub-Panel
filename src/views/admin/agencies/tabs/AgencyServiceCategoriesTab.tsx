import { useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Dialog from '@/components/ui/Dialog'
import { Form, FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbPlus, TbEdit, TbTrash } from 'react-icons/tb'
import {
    apiGetAdminAgencyServiceCategories,
    apiCreateAdminAgencyServiceCategory,
    apiUpdateAdminAgencyServiceCategory,
    apiDeleteAdminAgencyServiceCategory,
} from '@/services/admin/AdminAgencyServiceCategoriesService'
import type { AdminAgencyServiceCategory } from '@/services/admin/AdminAgencyServiceCategoriesService'

type CategoryFormValues = {
    title: string
    parent_id: number | null
    order_number: number
}

const emptyValues: CategoryFormValues = { title: '', parent_id: null, order_number: 1 }

/**
 * React port of the "Service Categories" agency module tab
 * (AgencyModulesController::serviceCategories) — a self-referential tree,
 * scoped by the agency owner's user_id rather than agency_id. Rendered as a
 * flat, indented list (parent shown inline) rather than a nested tree widget
 * since the theme has no tree component and the old Blade admin also used a
 * flat ordered table.
 */
function AgencyServiceCategoriesTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<AdminAgencyServiceCategory | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminAgencyServiceCategory | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-service-categories', agencySlug],
        () => apiGetAdminAgencyServiceCategories(agencySlug),
    )

    const { control, handleSubmit, reset } = useForm<CategoryFormValues>({
        defaultValues: emptyValues,
    })

    const categories = data?.data ?? []
    const parentOptions = categories
        .filter((c) => c.id !== editing?.id)
        .map((c) => ({ value: c.id, label: c.title }))

    const parentTitle = (parentId: number | null) =>
        categories.find((c) => c.id === parentId)?.title ?? '—'

    const openCreate = () => {
        setEditing(null)
        reset(emptyValues)
        setDialogOpen(true)
    }

    const openEdit = (category: AdminAgencyServiceCategory) => {
        setEditing(category)
        reset({
            title: category.title,
            parent_id: category.parent_id,
            order_number: category.order_number,
        })
        setDialogOpen(true)
    }

    const onSubmit = async (values: CategoryFormValues) => {
        setSubmitting(true)
        try {
            if (editing) {
                await apiUpdateAdminAgencyServiceCategory(agencySlug, editing.id, values)
            } else {
                await apiCreateAdminAgencyServiceCategory(agencySlug, values)
            }
            toast.push(<Notification type="success" title="Saved" />)
            setDialogOpen(false)
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to save">
                    Please check the form for errors.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminAgencyServiceCategory(agencySlug, pendingDelete.id)
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
                <h5>Service Categories</h5>
                {canEdit && (
                    <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                        Add category
                    </Button>
                )}
            </div>

            {!isLoading && categories.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    No service categories yet.
                </div>
            )}

            <div className="flex flex-col gap-2">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                        <div>
                            <div className="font-semibold">{category.title}</div>
                            <div className="text-xs text-gray-500">
                                Parent: {parentTitle(category.parent_id)} · Order:{' '}
                                {category.order_number}
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    size="xs"
                                    icon={<TbEdit />}
                                    onClick={() => openEdit(category)}
                                />
                                <Button
                                    size="xs"
                                    icon={<TbTrash />}
                                    onClick={() => setPendingDelete(category)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">{editing ? 'Edit category' : 'New category'}</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Title">
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Parent category">
                        <Controller
                            name="parent_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isClearable
                                    options={parentOptions}
                                    value={parentOptions.find((o) => o.value === field.value)}
                                    onChange={(option) => field.onChange(option?.value ?? null)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Order number">
                        <Controller
                            name="order_number"
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
                title="Delete category"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this category? Sub-categories and
                services assigned to it will be affected.
            </ConfirmDialog>
        </Card>
    )
}

export default AgencyServiceCategoriesTab
