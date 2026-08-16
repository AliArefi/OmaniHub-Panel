import { useMemo, useState } from 'react'
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
import { TbPlus, TbTrash } from 'react-icons/tb'
import {
    apiGetAdminAgencyCapabilities,
    apiSaveAdminAgencyCapability,
    apiDeleteAdminAgencyCapability,
} from '@/services/admin/AdminAgencyCapabilitiesService'
import { apiGetAdminAgencyServices } from '@/services/admin/AdminAgencyServicesService'
import { apiGetAdminAgencyMembers } from '@/services/admin/AdminAgencyMembersService'
import type { AdminAgencyCapability } from '@/services/admin/AdminAgencyCapabilitiesService'

type FormValues = {
    agency_service_id: number | null
    agency_service_member_id: number | null
    price: number | null
    duration_minutes: number | null
    is_active: boolean
}

const emptyValues: FormValues = {
    agency_service_id: null,
    agency_service_member_id: null,
    price: null,
    duration_minutes: null,
    is_active: true,
}

/**
 * React port of the agency "Member-Service Pricing & Duration" tab —
 * per (service, member) price/duration overrides, upserted one row per pair.
 */
function AgencyCapabilitiesTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<AdminAgencyCapability | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-capabilities', agencySlug],
        () => apiGetAdminAgencyCapabilities(agencySlug),
    )
    const { data: servicesData } = useSWR(
        ['admin-agency-services', agencySlug],
        () => apiGetAdminAgencyServices(agencySlug),
    )
    const { data: membersData } = useSWR(
        ['admin-agency-members', agencySlug],
        () => apiGetAdminAgencyMembers(agencySlug),
    )

    const { control, handleSubmit, reset, watch } = useForm<FormValues>({
        defaultValues: emptyValues,
    })

    const capabilities = data?.data ?? []
    const serviceOptions = (servicesData?.data ?? []).map((s) => ({
        value: s.id,
        label: s.title,
    }))
    const selectedServiceId = watch('agency_service_id')
    const memberOptions = useMemo(
        () =>
            (membersData?.data ?? [])
                .filter((m) => !selectedServiceId || m.agency_service_id === selectedServiceId)
                .map((m) => ({ value: m.id, label: m.name })),
        [membersData, selectedServiceId],
    )

    const openCreate = () => {
        reset(emptyValues)
        setDialogOpen(true)
    }

    const onSubmit = async (values: FormValues) => {
        if (!values.agency_service_id || !values.agency_service_member_id) return
        setSubmitting(true)
        try {
            await apiSaveAdminAgencyCapability(agencySlug, {
                agency_service_id: values.agency_service_id,
                agency_service_member_id: values.agency_service_member_id,
                price: values.price,
                duration_minutes: values.duration_minutes,
                is_active: values.is_active,
            })
            toast.push(<Notification type="success" title="Saved" />)
            setDialogOpen(false)
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to save">
                    Please check the form — an inactive member cannot have an
                    active capability unless explicitly allowed.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminAgencyCapability(agencySlug, pendingDelete.id)
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
                <h5>Member-Service Pricing &amp; Duration</h5>
                {canEdit && (
                    <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                        Add / update capability
                    </Button>
                )}
            </div>

            {!isLoading && capabilities.length === 0 && (
                <div className="text-center text-gray-400 py-8">No capabilities yet.</div>
            )}

            <div className="flex flex-col gap-2">
                {capabilities.map((cap) => (
                    <div
                        key={cap.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                        <div>
                            <div className="font-semibold">
                                {cap.member?.name ?? '—'} · {cap.service?.title ?? '—'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {cap.price != null ? `${cap.price} OMR` : 'No price override'} ·{' '}
                                {cap.duration_minutes != null
                                    ? `${cap.duration_minutes} min`
                                    : 'No duration override'}{' '}
                                · {cap.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>
                        {canEdit && (
                            <Button
                                size="xs"
                                icon={<TbTrash />}
                                onClick={() => setPendingDelete(cap)}
                            />
                        )}
                    </div>
                ))}
            </div>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">Add / update capability</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Service">
                        <Controller
                            name="agency_service_id"
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
                    <FormItem label="Member">
                        <Controller
                            name="agency_service_member_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={memberOptions}
                                    value={memberOptions.find((o) => o.value === field.value)}
                                    onChange={(option) => field.onChange(option?.value ?? null)}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Price override (OMR)">
                            <Controller
                                name="price"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        value={field.value ?? ''}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ''
                                                    ? null
                                                    : Number(e.target.value),
                                            )
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Duration override (minutes)">
                            <Controller
                                name="duration_minutes"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        value={field.value ?? ''}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ''
                                                    ? null
                                                    : Number(e.target.value),
                                            )
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                    <FormItem label="Active">
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={value} onChange={onChange} />
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
                title="Delete capability"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this capability override?
            </ConfirmDialog>
        </Card>
    )
}

export default AgencyCapabilitiesTab
