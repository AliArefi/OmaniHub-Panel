import { useState } from 'react'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Tag from '@/components/ui/Tag'
import Dialog from '@/components/ui/Dialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbTrash, TbSend } from 'react-icons/tb'
import {
    apiGetAdminAgencyReservations,
    apiGetAdminAgencyReservation,
    apiUpdateAdminAgencyReservation,
    apiDeleteAdminAgencyReservation,
    apiSendAdminAgencyChatMessage,
} from '@/services/admin/AdminAgencyReservationsService'
import type { AdminAgencyReservation } from '@/services/admin/AdminAgencyReservationsService'

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
    confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
}

/**
 * React port of the agency "Bookings" tab (AgencyReservationsController) —
 * a searchable/status-filterable reservation list, with a detail dialog
 * that includes the per-booking chat thread.
 */
function AgencyBookingsTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const [status, setStatus] = useState('')
    const [query, setQuery] = useState('')
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminAgencyReservation | null>(null)

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-reservations', agencySlug, status, query],
        () => apiGetAdminAgencyReservations(agencySlug, { status: status || undefined, q: query || undefined }),
    )

    const reservations = data?.data ?? []

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminAgencyReservation(agencySlug, pendingDelete.id)
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h5>Bookings</h5>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search name / mobile / id"
                        value={query}
                        className="w-56"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="w-40">
                        <Select
                            options={STATUS_OPTIONS}
                            value={STATUS_OPTIONS.find((o) => o.value === status)}
                            onChange={(option) => setStatus(option?.value ?? '')}
                        />
                    </div>
                </div>
            </div>

            {!isLoading && reservations.length === 0 && (
                <div className="text-center text-gray-400 py-8">No bookings found.</div>
            )}

            <div className="flex flex-col gap-2">
                {reservations.map((r) => (
                    <div
                        key={r.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-400"
                        onClick={() => setSelectedId(r.id)}
                    >
                        <div>
                            <div className="font-semibold">
                                {r.customer_name} · {r.customer_mobile}
                            </div>
                            <div className="text-xs text-gray-500">
                                {r.service?.title ?? '—'} · {r.date} {r.start_time}-{r.end_time}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Tag className={STATUS_COLORS[r.status]}>{r.status}</Tag>
                            {canEdit && (
                                <Button
                                    size="xs"
                                    icon={<TbTrash />}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setPendingDelete(r)
                                    }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedId && (
                <BookingDetailDialog
                    agencySlug={agencySlug}
                    reservationId={selectedId}
                    canEdit={canEdit}
                    onClose={() => setSelectedId(null)}
                    onChanged={() => mutate()}
                />
            )}

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete booking"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this booking?
            </ConfirmDialog>
        </Card>
    )
}

function BookingDetailDialog({
    agencySlug,
    reservationId,
    canEdit,
    onClose,
    onChanged,
}: {
    agencySlug: string
    reservationId: number
    canEdit: boolean
    onClose: () => void
    onChanged: () => void
}) {
    const [messageBody, setMessageBody] = useState('')
    const [sending, setSending] = useState(false)
    const [statusValue, setStatusValue] = useState<string | null>(null)
    const [savingStatus, setSavingStatus] = useState(false)

    const { data, mutate } = useSWR(
        ['admin-agency-reservation', agencySlug, reservationId],
        () => apiGetAdminAgencyReservation(agencySlug, reservationId),
    )

    const reservation = data?.data

    const handleSend = async () => {
        if (!messageBody.trim()) return
        setSending(true)
        try {
            await apiSendAdminAgencyChatMessage(agencySlug, reservationId, messageBody.trim())
            setMessageBody('')
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to send message" />)
        } finally {
            setSending(false)
        }
    }

    const handleStatusChange = async (next: string) => {
        if (!reservation) return
        setSavingStatus(true)
        try {
            await apiUpdateAdminAgencyReservation(agencySlug, reservationId, {
                customer_name: reservation.customer_name,
                customer_mobile: reservation.customer_mobile,
                date: reservation.date,
                start_time: reservation.start_time,
                end_time: reservation.end_time,
                status: next,
                note: reservation.note,
            })
            toast.push(<Notification type="success" title="Status updated" />)
            mutate()
            onChanged()
        } catch {
            toast.push(<Notification type="danger" title="Failed to update status" />)
        } finally {
            setSavingStatus(false)
        }
    }

    return (
        <Dialog isOpen width={640} onClose={onClose}>
            {!reservation ? (
                <div className="py-8 text-center text-gray-400">Loading…</div>
            ) : (
                <div>
                    <h4 className="mb-4">
                        Booking #{reservation.id} — {reservation.customer_name}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                            <span className="text-gray-500">Mobile:</span>{' '}
                            {reservation.customer_mobile}
                        </div>
                        <div>
                            <span className="text-gray-500">Service:</span>{' '}
                            {reservation.service?.title ?? '—'}
                        </div>
                        <div>
                            <span className="text-gray-500">Date:</span> {reservation.date}
                        </div>
                        <div>
                            <span className="text-gray-500">Time:</span> {reservation.start_time}–
                            {reservation.end_time}
                        </div>
                        <div>
                            <span className="text-gray-500">Member:</span>{' '}
                            {reservation.member?.name ?? '—'}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Status:</span>
                            {canEdit ? (
                                <div className="w-40">
                                    <Select
                                        isDisabled={savingStatus}
                                        options={STATUS_OPTIONS.slice(1)}
                                        value={STATUS_OPTIONS.find(
                                            (o) => o.value === (statusValue ?? reservation.status),
                                        )}
                                        onChange={(option) => {
                                            if (!option) return
                                            setStatusValue(option.value)
                                            handleStatusChange(option.value)
                                        }}
                                    />
                                </div>
                            ) : (
                                <Tag className={STATUS_COLORS[reservation.status]}>
                                    {reservation.status}
                                </Tag>
                            )}
                        </div>
                    </div>

                    <h6 className="mb-2">Chat</h6>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 max-h-64 overflow-y-auto flex flex-col gap-2 mb-3">
                        {(reservation.chat_thread?.messages ?? []).length === 0 && (
                            <div className="text-gray-400 text-sm">No messages yet.</div>
                        )}
                        {(reservation.chat_thread?.messages ?? []).map((m) => (
                            <div key={m.id} className="text-sm">
                                <span className="font-semibold">
                                    {m.sender?.name ?? 'Unknown'}:
                                </span>{' '}
                                {m.body}
                            </div>
                        ))}
                    </div>
                    {canEdit && (
                        <div className="flex items-center gap-2">
                            <Input
                                value={messageBody}
                                placeholder="Type a message…"
                                onChange={(e) => setMessageBody(e.target.value)}
                            />
                            <Button
                                icon={<TbSend />}
                                loading={sending}
                                onClick={handleSend}
                            />
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    )
}

export default AgencyBookingsTab
