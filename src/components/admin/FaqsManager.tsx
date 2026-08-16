import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Dialog from '@/components/ui/Dialog'
import { Form, FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import useAdminLocales from '@/utils/hooks/useAdminLocales'
import { TbPlus, TbEdit, TbTrash } from 'react-icons/tb'
import {
    apiGetAdminFaqs,
    apiCreateAdminFaq,
    apiUpdateAdminFaq,
    apiDeleteAdminFaq,
} from '@/services/admin/AdminFaqsService'
import type { AdminFaq, AdminFaqParent } from '@/services/admin/AdminFaqsService'

type FaqsManagerProps = {
    parent: AdminFaqParent
    parentSlug: string
    permission: string
}

type FaqFormValues = {
    question: string
    answer: string
    locale: string
    is_active: boolean
    sort_order: number
}

const emptyValues = (locale: string): FaqFormValues => ({
    question: '',
    answer: '',
    locale,
    is_active: true,
    sort_order: 0,
})

/**
 * Shared FAQs tab for Agencies/Organizations/Services — Faq rows are one row
 * per locale (see App\Models\Faq), so the list is scoped to a single locale
 * at a time via a switcher, matching the old Blade admin's per-locale FAQ tab.
 */
function FaqsManager(props: FaqsManagerProps) {
    const { parent, parentSlug, permission } = props
    const { can } = usePermission()
    const canEdit = can(permission)
    const { locales, fallbackLocale } = useAdminLocales()
    const [locale, setLocale] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<AdminFaq | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminFaq | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!locale && fallbackLocale) setLocale(fallbackLocale)
    }, [fallbackLocale, locale])

    const { data, mutate, isLoading } = useSWR(
        locale ? [`admin-faqs-${parent}`, parentSlug, locale] : null,
        () => apiGetAdminFaqs(parent, parentSlug, locale),
    )

    const { control, handleSubmit, reset } = useForm<FaqFormValues>({
        defaultValues: emptyValues(locale || fallbackLocale),
    })

    const localeOptions = Object.entries(locales).map(([value, label]) => ({
        value,
        label,
    }))

    const openCreate = () => {
        setEditing(null)
        reset(emptyValues(locale))
        setDialogOpen(true)
    }

    const openEdit = (faq: AdminFaq) => {
        setEditing(faq)
        reset({
            question: faq.question,
            answer: faq.answer,
            locale: faq.locale,
            is_active: faq.is_active,
            sort_order: faq.sort_order,
        })
        setDialogOpen(true)
    }

    const onSubmit = async (values: FaqFormValues) => {
        setSubmitting(true)
        try {
            if (editing) {
                await apiUpdateAdminFaq(parent, parentSlug, editing.id, values)
            } else {
                await apiCreateAdminFaq(parent, parentSlug, values)
            }
            toast.push(
                <Notification type="success" title="Saved">
                    FAQ saved successfully.
                </Notification>,
            )
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
            await apiDeleteAdminFaq(parent, parentSlug, pendingDelete.id)
            toast.push(<Notification type="success" title="Deleted" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setPendingDelete(null)
        }
    }

    const faqs = data?.data ?? []

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h5>FAQs</h5>
                <div className="flex items-center gap-2">
                    <div className="w-40">
                        <Select
                            options={localeOptions}
                            value={localeOptions.find((o) => o.value === locale)}
                            onChange={(option) => option && setLocale(option.value)}
                        />
                    </div>
                    {canEdit && (
                        <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                            Add FAQ
                        </Button>
                    )}
                </div>
            </div>

            {!isLoading && faqs.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    No FAQs for this locale yet.
                </div>
            )}

            <div className="flex flex-col gap-3">
                {faqs.map((faq) => (
                    <div
                        key={faq.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-start justify-between gap-4"
                    >
                        <div className="min-w-0">
                            <div className="font-semibold truncate">
                                {faq.question}
                                {!faq.is_active && (
                                    <span className="ml-2 text-xs text-amber-600">
                                        (inactive)
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {faq.answer}
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    size="xs"
                                    icon={<TbEdit />}
                                    onClick={() => openEdit(faq)}
                                />
                                <Button
                                    size="xs"
                                    icon={<TbTrash />}
                                    onClick={() => setPendingDelete(faq)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">{editing ? 'Edit FAQ' : 'New FAQ'}</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Question">
                        <Controller
                            name="question"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Answer">
                        <Controller
                            name="answer"
                            control={control}
                            render={({ field }) => (
                                <Input textArea rows={4} {...field} />
                            )}
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
                                        onChange={(e) =>
                                            field.onChange(Number(e.target.value))
                                        }
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
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => setDialogOpen(false)}
                        >
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
                title="Delete FAQ"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this FAQ?
            </ConfirmDialog>
        </Card>
    )
}

export default FaqsManager
