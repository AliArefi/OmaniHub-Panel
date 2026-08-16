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
    apiGetAdminAgencyServices,
    apiGetAdminAgencyServiceServiceOptions,
    apiCreateAdminAgencyService,
    apiUpdateAdminAgencyService,
    apiDeleteAdminAgencyService,
} from '@/services/admin/AdminAgencyServicesService'
import { apiGetAdminAgencyServiceCategories } from '@/services/admin/AdminAgencyServiceCategoriesService'
import type { AdminAgencyServiceItem } from '@/services/admin/AdminAgencyServicesService'

const DURATION_UNITS = ['minute', 'hour', 'day', 'week', 'month'].map((v) => ({
    value: v,
    label: v,
}))
const PRICING_TYPES = ['fixed', 'coordination', 'member_based'].map((v) => ({
    value: v,
    label: v.replace('_', ' '),
}))

type FormValues = {
    service_id: number | null
    agency_service_category_id: number | null
    title_en: string
    title_ar: string
    price: number
    pricing_type: string
    estimate_time: number
    duration_unit: string
}

const emptyValues: FormValues = {
    service_id: null,
    agency_service_category_id: null,
    title_en: '',
    title_ar: '',
    price: 0,
    pricing_type: 'fixed',
    estimate_time: 30,
    duration_unit: 'minute',
}

/**
 * React port of the agency "Services" module tab (AgencyModulesController::
 * services) — offered services (AgencyService), each tied to a node in the
 * global service tree that must descend from the agency's main category.
 */
function AgencyServicesTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<AdminAgencyServiceItem | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminAgencyServiceItem | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-services', agencySlug],
        () => apiGetAdminAgencyServices(agencySlug),
    )
    const { data: serviceOptionsData } = useSWR(
        ['admin-agency-service-service-options', agencySlug],
        () => apiGetAdminAgencyServiceServiceOptions(agencySlug),
    )
    const { data: categoriesData } = useSWR(
        ['admin-agency-service-categories', agencySlug],
        () => apiGetAdminAgencyServiceCategories(agencySlug),
    )

    const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: emptyValues })

    const services = data?.data ?? []
    const serviceOptions = (serviceOptionsData?.data ?? []).map((o) => ({
        value: o.id,
        label: o.label,
    }))
    const categoryOptions = (categoriesData?.data ?? []).map((c) => ({
        value: c.id,
        label: c.title,
    }))

    const openCreate = () => {
        setEditing(null)
        reset(emptyValues)
        setDialogOpen(true)
    }

    const openEdit = (item: AdminAgencyServiceItem) => {
        setEditing(item)
        reset({
            service_id: item.service_id,
            agency_service_category_id: item.agency_service_category_id,
            title_en: item.translations?.en?.title ?? item.title ?? '',
            title_ar: item.translations?.ar?.title ?? '',
            price: item.price,
            pricing_type: item.pricing_type,
            estimate_time: item.estimate_time,
            duration_unit: item.duration_unit,
        })
        setDialogOpen(true)
    }

    const onSubmit = async (values: FormValues) => {
        if (!values.service_id) return
        setSubmitting(true)
        try {
            const payload = {
                service_id: values.service_id,
                agency_service_category_id: values.agency_service_category_id,
                price: values.price,
                pricing_type: values.pricing_type,
                estimate_time: values.estimate_time,
                duration_unit: values.duration_unit,
                translations: {
                    en: { title: values.title_en },
                    ar: { title: values.title_ar },
                },
            }
            if (editing) {
                await apiUpdateAdminAgencyService(agencySlug, editing.slug, payload)
            } else {
                await apiCreateAdminAgencyService(agencySlug, payload)
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
            await apiDeleteAdminAgencyService(agencySlug, pendingDelete.slug)
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
                <h5>Services</h5>
                {canEdit && (
                    <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                        Add service
                    </Button>
                )}
            </div>

            {!isLoading && services.length === 0 && (
                <div className="text-center text-gray-400 py-8">No services yet.</div>
            )}

            <div className="flex flex-col gap-2">
                {services.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                        <div>
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-xs text-gray-500">
                                {item.price} OMR · {item.estimate_time} {item.duration_unit}
                                (s) · {item.pricing_type}
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
                <h4 className="mb-4">{editing ? 'Edit service' : 'New service'}</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Service (from tree)">
                        <Controller
                            name="service_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={serviceOptions}
                                    value={serviceOptions.find((o) => o.value === field.value)}
                                    onChange={(option) => field.onChange(option?.value ?? null)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Category">
                        <Controller
                            name="agency_service_category_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isClearable
                                    options={categoryOptions}
                                    value={categoryOptions.find((o) => o.value === field.value)}
                                    onChange={(option) => field.onChange(option?.value ?? null)}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Title (English)">
                            <Controller
                                name="title_en"
                                control={control}
                                render={({ field }) => <Input {...field} />}
                            />
                        </FormItem>
                        <FormItem label="Title (Arabic)">
                            <Controller
                                name="title_ar"
                                control={control}
                                render={({ field }) => <Input dir="rtl" {...field} />}
                            />
                        </FormItem>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Pricing type">
                            <Controller
                                name="pricing_type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        options={PRICING_TYPES}
                                        value={PRICING_TYPES.find((o) => o.value === field.value)}
                                        onChange={(option) => field.onChange(option?.value)}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Price (OMR)">
                            <Controller
                                name="price"
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Duration">
                            <Controller
                                name="estimate_time"
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
                        <FormItem label="Duration unit">
                            <Controller
                                name="duration_unit"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        options={DURATION_UNITS}
                                        value={DURATION_UNITS.find((o) => o.value === field.value)}
                                        onChange={(option) => field.onChange(option?.value)}
                                    />
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
                title="Delete service"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this service?
            </ConfirmDialog>
        </Card>
    )
}

export default AgencyServicesTab
