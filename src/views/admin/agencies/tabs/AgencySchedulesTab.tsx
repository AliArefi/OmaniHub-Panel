import { useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Dialog from '@/components/ui/Dialog'
import { Form, FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbPlus, TbTrash } from 'react-icons/tb'
import {
    apiGetAdminAgencySchedules,
    apiCreateAdminAgencySchedule,
    apiDeleteAdminAgencySchedule,
    apiGetAdminAgencySchedulePreview,
} from '@/services/admin/AdminAgencySchedulesService'
import { apiGetAdminAgencyMembers } from '@/services/admin/AdminAgencyMembersService'
import type { AdminAgencySchedule } from '@/services/admin/AdminAgencySchedulesService'

const DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
]

type FormValues = {
    agency_service_member_id: number | null
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

const emptyValues: FormValues = {
    agency_service_member_id: null,
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_active: true,
}

/**
 * React port of the agency "Member Schedules" tab — weekly working-hour
 * rules per member, plus a bookable-slot preview
 * (MemberAvailabilityPipeline::buildBookableSlots).
 */
function AgencySchedulesTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<AdminAgencySchedule | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [previewMemberId, setPreviewMemberId] = useState<number | null>(null)
    const [previewDate, setPreviewDate] = useState(
        () => new Date().toISOString().slice(0, 10),
    )

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-schedules', agencySlug],
        () => apiGetAdminAgencySchedules(agencySlug),
    )
    const { data: membersData } = useSWR(
        ['admin-agency-members', agencySlug],
        () => apiGetAdminAgencyMembers(agencySlug),
    )
    const { data: previewData, isLoading: previewLoading } = useSWR(
        previewMemberId
            ? ['admin-agency-schedule-preview', agencySlug, previewMemberId, previewDate]
            : null,
        () =>
            apiGetAdminAgencySchedulePreview(agencySlug, {
                member_id: previewMemberId as number,
                date: previewDate,
            }),
    )

    const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: emptyValues })

    const schedules = data?.data ?? []
    const memberOptions = (membersData?.data ?? []).map((m) => ({ value: m.id, label: m.name }))

    const openCreate = () => {
        reset(emptyValues)
        setDialogOpen(true)
    }

    const onSubmit = async (values: FormValues) => {
        if (!values.agency_service_member_id) return
        setSubmitting(true)
        try {
            await apiCreateAdminAgencySchedule(agencySlug, values as never)
            toast.push(<Notification type="success" title="Saved" />)
            setDialogOpen(false)
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to save">
                    End time must be after start time.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminAgencySchedule(agencySlug, pendingDelete.id)
            toast.push(<Notification type="success" title="Deleted" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setPendingDelete(null)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h5>Member Schedules</h5>
                    {canEdit && (
                        <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                            Add schedule
                        </Button>
                    )}
                </div>

                {!isLoading && schedules.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No schedules yet.</div>
                )}

                <div className="flex flex-col gap-2">
                    {schedules.map((schedule) => (
                        <div
                            key={schedule.id}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                        >
                            <div>
                                <div className="font-semibold">
                                    {schedule.member?.name ?? '—'} · {DAYS[schedule.day_of_week]}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {schedule.start_time} – {schedule.end_time}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!schedule.is_active && (
                                    <Tag className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                                        Inactive
                                    </Tag>
                                )}
                                {canEdit && (
                                    <Button
                                        size="xs"
                                        icon={<TbTrash />}
                                        onClick={() => setPendingDelete(schedule)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <h5 className="mb-4">Slot preview</h5>
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="w-full md:w-64">
                        <Select
                            placeholder="Select member"
                            options={memberOptions}
                            value={memberOptions.find((o) => o.value === previewMemberId)}
                            onChange={(option) => setPreviewMemberId(option?.value ?? null)}
                        />
                    </div>
                    <Input
                        type="date"
                        value={previewDate}
                        className="w-full md:w-48"
                        onChange={(e) => setPreviewDate(e.target.value)}
                    />
                </div>

                {previewMemberId && previewLoading && (
                    <div className="text-gray-400">Loading slots…</div>
                )}
                {previewMemberId && !previewLoading && (
                    <div className="flex flex-wrap gap-2">
                        {(previewData?.data.slots ?? []).length === 0 && (
                            <span className="text-gray-400">No bookable slots for this date.</span>
                        )}
                        {(previewData?.data.slots ?? []).map((slot) => (
                            <Tag key={slot} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100">
                                {slot}
                            </Tag>
                        ))}
                    </div>
                )}
            </Card>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">New schedule</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
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
                    <FormItem label="Day of week">
                        <Controller
                            name="day_of_week"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={DAYS.map((d, i) => ({ value: i, label: d }))}
                                    value={{ value: field.value, label: DAYS[field.value] }}
                                    onChange={(option) => field.onChange(option?.value ?? 0)}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Start time">
                            <Controller
                                name="start_time"
                                control={control}
                                render={({ field }) => <Input type="time" {...field} />}
                            />
                        </FormItem>
                        <FormItem label="End time">
                            <Controller
                                name="end_time"
                                control={control}
                                render={({ field }) => <Input type="time" {...field} />}
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
                title="Delete schedule"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this schedule?
            </ConfirmDialog>
        </div>
    )
}

export default AgencySchedulesTab
