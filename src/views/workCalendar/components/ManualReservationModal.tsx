import type { Booking } from '@/@types/booking'
import type { MyAgencyService, TeamMemberApiResponse } from '@/@types/center'
import { Button, Dialog, Input, Notification } from '@/components/ui'
import { apiGetMyServices, apiGetServiceMembers } from '@/services/CenterService'
import {
    createAgencyReservation,
    deleteAgencyReservation,
    type ManualAgencyReservationPayload,
    updateAgencyReservation,
} from '@/services/BookingService'
import { useEffect, useMemo, useState } from 'react'
import { HiOutlineTrash, HiX } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'

type ManualReservationModalProps = {
    isOpen: boolean
    onClose: () => void
    agencyId: number
    agencySlug: string
    selectedDate: string
    reservation?: Booking | null
    onSaved: (reservation: Booking) => void
    onDeleted: (reservationId: number) => void
}

type FormState = {
    service_id: string
    member_id: string
    customer_name: string
    customer_mobile: string
    date: string
    start_time: string
    end_time: string
    status: Booking['status']
    note: string
    price: string
}

const defaultForm = (selectedDate: string): FormState => ({
    service_id: '',
    member_id: '',
    customer_name: '',
    customer_mobile: '',
    date: selectedDate,
    start_time: '09:00',
    end_time: '09:30',
    status: 'confirmed',
    note: '',
    price: '',
})

const toTimeInput = (time?: string | null) => (time ? time.slice(0, 5) : '')

const extractApiMessage = (error: unknown, fallback: string) => {
    if (typeof error !== 'object' || error === null) return fallback
    const response = (error as { response?: unknown }).response
    if (typeof response !== 'object' || response === null) return fallback
    const data = (response as { data?: unknown }).data
    if (typeof data !== 'object' || data === null) return fallback
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message.trim()
    const errors = (data as { errors?: unknown }).errors
    if (typeof errors !== 'object' || errors === null) return fallback
    const first = Object.values(errors as Record<string, unknown>)[0]
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
    return fallback
}

export default function ManualReservationModal({
    isOpen,
    onClose,
    agencyId,
    agencySlug,
    selectedDate,
    reservation,
    onSaved,
    onDeleted,
}: ManualReservationModalProps) {
    const { t } = useTranslation()

    const [services, setServices] = useState<MyAgencyService[]>([])
    const [members, setMembers] = useState<TeamMemberApiResponse[]>([])
    const [form, setForm] = useState<FormState>(defaultForm(selectedDate))
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isEditing = Boolean(reservation)

    useEffect(() => {
        if (!isOpen) return

        const nextForm = reservation
            ? {
                  service_id: reservation.service?.id
                      ? String(reservation.service.id)
                      : '',
                  member_id: reservation.member?.id
                      ? String(reservation.member.id)
                      : '',
                  customer_name: reservation.customer?.name || '',
                  customer_mobile: reservation.customer?.mobile || '',
                  date: reservation.date || selectedDate,
                  start_time: toTimeInput(reservation.start_time) || '09:00',
                  end_time: toTimeInput(reservation.end_time) || '09:30',
                  status: reservation.status,
                  note: reservation.note || '',
                  price:
                      reservation.final_price?.toString() ||
                      reservation.quoted_price?.toString() ||
                      '',
              }
            : defaultForm(selectedDate)

        setForm(nextForm)
        setError(null)
    }, [isOpen, reservation, selectedDate])

    useEffect(() => {
        if (!isOpen || !agencyId) return

        const loadServices = async () => {
            setLoadingOptions(true)
            try {
                const response = await apiGetMyServices({
                    agency_id: agencyId,
                    per_page: 200,
                })
                setServices(response.data || [])
            } catch (err) {
                setError(
                    extractApiMessage(
                        err,
                        t('workCalendar.modal.errors.loadServices'),
                    ),
                )
            } finally {
                setLoadingOptions(false)
            }
        }

        loadServices()
    }, [agencyId, isOpen, t])

    useEffect(() => {
        const serviceId = Number(form.service_id)
        if (!isOpen || !serviceId) {
            setMembers([])
            return
        }

        const loadMembers = async () => {
            try {
                const response = await apiGetServiceMembers(serviceId)
                setMembers(response.data || [])
            } catch (err) {
                setMembers([])
                setError(
                    extractApiMessage(
                        err,
                        t('workCalendar.modal.errors.loadMembers'),
                    ),
                )
            }
        }

        loadMembers()
    }, [form.service_id, isOpen, t])

    const selectedService = useMemo(
        () => services.find((service) => String(service.id) === form.service_id),
        [form.service_id, services],
    )

    const updateField = <K extends keyof FormState>(
        field: K,
        value: FormState[K],
    ) => {
        setForm((current) => ({ ...current, [field]: value }))
    }

    const buildPayload = (): ManualAgencyReservationPayload | null => {
        const serviceId = Number(form.service_id)
        if (!serviceId) {
            setError(t('workCalendar.modal.validation.selectService'))
            return null
        }

        if (!form.customer_name.trim() || !form.customer_mobile.trim()) {
            setError(t('workCalendar.modal.validation.customerRequired'))
            return null
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
            setError(t('workCalendar.modal.validation.validDate'))
            return null
        }

        if (!form.start_time || !form.end_time || form.start_time >= form.end_time) {
            setError(t('workCalendar.modal.validation.validTime'))
            return null
        }

        const price = form.price.trim() === '' ? null : Number(form.price.trim())
        if (price !== null && (!Number.isFinite(price) || price < 0)) {
            setError(t('workCalendar.modal.validation.validPrice'))
            return null
        }

        return {
            service_id: serviceId,
            member_id: form.member_id ? Number(form.member_id) : null,
            customer_name: form.customer_name.trim(),
            customer_mobile: form.customer_mobile.trim(),
            date: form.date,
            start_time: form.start_time,
            end_time: form.end_time,
            status: form.status,
            note: form.note.trim() || null,
            price,
            currency: 'OMR',
        }
    }

    const handleSave = async () => {
        const payload = buildPayload()
        if (!payload) return

        setSaving(true)
        setError(null)
        try {
            const response =
                reservation && reservation.id
                    ? await updateAgencyReservation(agencySlug, reservation.id, payload)
                    : await createAgencyReservation(agencySlug, payload)

            onSaved(response.data)
            onClose()
        } catch (err) {
            setError(
                extractApiMessage(err, t('workCalendar.modal.errors.saveReservation')),
            )
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!reservation?.id) return
        const confirmed = window.confirm(t('workCalendar.modal.confirmDelete'))
        if (!confirmed) return

        setDeleting(true)
        setError(null)
        try {
            await deleteAgencyReservation(agencySlug, reservation.id)
            onDeleted(reservation.id)
            onClose()
        } catch (err) {
            setError(
                extractApiMessage(err, t('workCalendar.modal.errors.deleteReservation')),
            )
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} className="max-w-3xl">
            <div className="fixed inset-0 bg-black/60 z-[9999]" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[10000] max-w-3xl w-full mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {isEditing
                                ? t('workCalendar.modal.titleEdit')
                                : t('workCalendar.modal.titleCreate')}
                        </h3>
                        {selectedService ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedService.duration_label}
                            </div>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        aria-label={t('workCalendar.modal.close')}
                    >
                        <HiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
                    {error ? (
                        <Notification type="danger">{error}</Notification>
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.service')}
                            </span>
                            <select
                                value={form.service_id}
                                disabled={loadingOptions}
                                onChange={(event) => {
                                    updateField('service_id', event.target.value)
                                    updateField('member_id', '')
                                }}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">
                                    {t('workCalendar.modal.placeholders.selectService')}
                                </option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.member')}
                            </span>
                            <select
                                value={form.member_id}
                                onChange={(event) =>
                                    updateField('member_id', event.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">
                                    {t('workCalendar.modal.placeholders.noMember')}
                                </option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.customerName')}
                            </span>
                            <Input
                                value={form.customer_name}
                                onChange={(event) =>
                                    updateField('customer_name', event.target.value)
                                }
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.customerMobile')}
                            </span>
                            <Input
                                value={form.customer_mobile}
                                onChange={(event) =>
                                    updateField('customer_mobile', event.target.value)
                                }
                                inputMode="tel"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.date')}
                            </span>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={(event) =>
                                    updateField('date', event.target.value)
                                }
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.status')}
                            </span>
                            <select
                                value={form.status}
                                onChange={(event) =>
                                    updateField(
                                        'status',
                                        event.target.value as Booking['status'],
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="pending">
                                    {t('workCalendar.modal.status.pending')}
                                </option>
                                <option value="confirmed">
                                    {t('workCalendar.modal.status.confirmed')}
                                </option>
                                <option value="cancelled">
                                    {t('workCalendar.modal.status.cancelled')}
                                </option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.startTime')}
                            </span>
                            <Input
                                type="time"
                                value={form.start_time}
                                onChange={(event) =>
                                    updateField('start_time', event.target.value)
                                }
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.endTime')}
                            </span>
                            <Input
                                type="time"
                                value={form.end_time}
                                onChange={(event) =>
                                    updateField('end_time', event.target.value)
                                }
                            />
                        </label>

                        <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.finalPrice')}
                            </span>
                            <Input
                                value={form.price}
                                onChange={(event) =>
                                    updateField(
                                        'price',
                                        event.target.value.replace(/[^\d.]/g, ''),
                                    )
                                }
                                inputMode="decimal"
                                placeholder={t('workCalendar.modal.placeholders.priceOptional')}
                            />
                        </label>

                        <label className="block md:col-span-2">
                            <span className="mb-1 block text-sm font-medium">
                                {t('workCalendar.modal.fields.notes')}
                            </span>
                            <Input
                                textArea
                                value={form.note}
                                onChange={(event) =>
                                    updateField('note', event.target.value)
                                }
                            />
                        </label>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {isEditing ? (
                            <Button
                                variant="plain"
                                icon={<HiOutlineTrash />}
                                loading={deleting}
                                onClick={handleDelete}
                                className="text-red-600 hover:text-red-700"
                            >
                                {t('workCalendar.modal.actions.delete')}
                            </Button>
                        ) : null}
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <Button onClick={onClose}>
                            {t('workCalendar.modal.actions.cancel')}
                        </Button>
                        <Button variant="solid" loading={saving} onClick={handleSave}>
                            {t('workCalendar.modal.actions.save')}
                        </Button>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}
