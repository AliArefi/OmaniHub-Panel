import { Badge, Button, Card, Spinner, Table } from '@/components/ui'
import TBody from '@/components/ui/Table/TBody'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import THead from '@/components/ui/Table/THead'
import Tr from '@/components/ui/Table/Tr'
import { CalendarView } from '@/components/shared'
import type { Agency } from '@/@types/center'
import type { Booking } from '@/@types/booking'
import type { ReservationDailyCount } from '@/@types/reservations'
import { getAgencyReservationsV2 } from '@/services/BookingService'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { HiOutlineEye, HiOutlinePencil, HiPlus } from 'react-icons/hi'
import BookingDetailsModal from '@/views/bookings/components/BookingDetailsModal'
import ManualReservationModal from './ManualReservationModal'

interface AgencyCalendarProps {
    agency: Agency | null
}
const formatDateAr = (dateString: string) =>
    new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateString))

const formatTimeAr = (time: string) => time?.toString().slice(0, 5)

export function AgencyCalendar({ agency }: AgencyCalendarProps) {
    const slug = agency?.slug || ''
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [dailyCounts, setDailyCounts] = useState<ReservationDailyCount[]>([])
    const [selectedDate, setSelectedDate] = useState<string>(
        dayjs().format('YYYY-MM-DD'),
    )
    const [calendarView, setCalendarView] = useState('dayGridMonth')
    const [dayReservations, setDayReservations] = useState<Booking[]>([])
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [manualModalOpen, setManualModalOpen] = useState(false)
    const [editingReservation, setEditingReservation] =
        useState<Booking | null>(null)

    const [monthReservations, setMonthReservations] = useState<any[]>([])

    const fetchMonth = async (month: string) => {
        if (!slug) return
        const resp = await getAgencyReservationsV2({
            agencySlug: String(slug),
            view: 'month',
            month,
            include_daily_counts: true,
            include_reservations: true,
        })
        setDailyCounts(resp.daily_counts || [])
        setMonthReservations(resp.reservations?.data || [])
    }

    const fetchDay = async (date: string) => {
        if (!slug) return
        const resp = await getAgencyReservationsV2({
            agencySlug: String(slug),
            view: 'day',
            date,
            include_daily_counts: false,
            include_reservations: true,
            per_page: 100,
        })
        setDayReservations(resp.reservations?.data || [])
    }

    useEffect(() => {
        const run = async () => {
            setInitialLoading(true)
            setError(null)
            try {
                await Promise.all([
                    fetchMonth(dayjs().format('YYYY-MM')),
                    fetchDay(selectedDate),
                ])
            } catch (err: unknown) {
                const apiMessage = (() => {
                    if (typeof err !== 'object' || err === null)
                        return undefined
                    const response = (err as { response?: unknown }).response
                    if (typeof response !== 'object' || response === null)
                        return undefined
                    const data = (response as { data?: unknown }).data
                    if (typeof data !== 'object' || data === null)
                        return undefined
                    const message = (data as { message?: unknown }).message
                    return typeof message === 'string' && message.trim()
                        ? message.trim()
                        : undefined
                })()
                setError(apiMessage || 'حدث خطأ أثناء تحميل الإحصائيات')
            } finally {
                setInitialLoading(false)
            }
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug])

    const monthEvents = useMemo(() => {
        const reservationEvents = monthReservations.map((reservation) => ({
            id: `reservation-${reservation.id}`,
            title: reservation.customer.name || 'رزرو',
            start: `${reservation.date}T${reservation.start_time}`,
            end: `${reservation.date}T${reservation.end_time}`,
            allDay: false,
            extendedProps: {
                reservationId: reservation.id,
                eventColor:
                    reservation.status === 'confirmed'
                        ? 'green'
                        : reservation.status === 'pending'
                          ? 'orange'
                          : 'gray',
            },
        }))

        const countEvents = (dailyCounts || []).map((d) => ({
            id: `count-${d.date}`,
            title: `${d.count} حجز`,
            start: d.date,
            allDay: true,
            display: 'background',
            extendedProps: { eventColor: 'blue' },
        }))

        return [...reservationEvents, ...countEvents]
    }, [dailyCounts, monthReservations])

    const reservationEvents = useMemo(() => {
        return dayReservations.map((reservation) => ({
            id: String(reservation.id),
            title:
                reservation.customer?.name ||
                reservation.service?.title ||
                `#${reservation.id}`,
            start: `${reservation.date}T${formatTimeAr(reservation.start_time)}`,
            end: `${reservation.date}T${formatTimeAr(reservation.end_time)}`,
            extendedProps: {
                reservationId: reservation.id,
                eventColor:
                    reservation.status === 'cancelled'
                        ? 'red'
                        : reservation.status === 'confirmed'
                          ? 'green'
                          : 'yellow',
            },
        }))
    }, [dayReservations])

    const openBookingDetails = (booking: Booking) => {
        setSelectedBooking(booking)
        setShowDetailsModal(true)
    }

    const openManualReservation = (booking?: Booking | null, date?: string) => {
        if (date) setSelectedDate(date)
        setEditingReservation(booking || null)
        setManualModalOpen(true)
    }

    const refreshCalendarData = async (date = selectedDate) => {
        await Promise.all([
            fetchMonth(dayjs(date).format('YYYY-MM')),
            fetchDay(date),
        ])
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            { label: string; className: string }
        > = {
            pending: {
                label: 'قيد الانتظار',
                className:
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            },
            confirmed: {
                label: 'مؤكد',
                className:
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
            },
            completed: {
                label: 'مكتمل',
                className:
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            },
            cancelled: {
                label: 'ملغي',
                className:
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            },
        }
        const config = statusConfig[status] || statusConfig.pending
        return (
            <Badge
                className={`${config.className} px-3 py-1 rounded-full text-xs font-medium`}
            >
                {config.label}
            </Badge>
        )
    }

    if (initialLoading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>جاري التحميل...</div>
            </div>
        )

    if (error)
        return <div className="text-red-600 dark:text-red-400">{error}</div>

    return (
        <div className="space-y-6">
            <Card>
                <CalendarView
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'title',
                        center: '',
                        right: 'dayGridMonth,timeGridDay prev,next',
                    }}
                    selectable={false}
                    events={
                        calendarView === 'timeGridDay'
                            ? reservationEvents
                            : monthEvents
                    }
                    eventClick={(arg) => {
                        const reservationId =
                            arg.event.extendedProps.reservationId

                        if (typeof reservationId !== 'number') return

                        const booking =
                            calendarView === 'dayGridMonth'
                                ? monthReservations.find(
                                      (item) => item.id === reservationId,
                                  )
                                : dayReservations.find(
                                      (item) => item.id === reservationId,
                                  )
                        if (booking) openManualReservation(booking)
                    }}
                    datesSet={async (arg) => {
                        setCalendarView(arg.view.type)

                        if (arg.view.type === 'dayGridMonth') {
                            const m = dayjs(arg.view.currentStart).format(
                                'YYYY-MM',
                            )
                            try {
                                await fetchMonth(m)
                            } catch {
                                // ignore
                            }
                        }

                        if (arg.view.type === 'timeGridDay') {
                            const date = dayjs(arg.start).format('YYYY-MM-DD')
                            setSelectedDate(date)
                            try {
                                await fetchDay(date)
                            } catch {
                                // ignore
                            }
                        }
                    }}
                    dateClick={async (arg) => {
                        const date = dayjs(arg.date).format('YYYY-MM-DD')
                        setSelectedDate(date)
                        try {
                            await fetchDay(date)
                        } catch {
                            // ignore
                        }
                    }}
                />
            </Card>

            <Card>
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="font-semibold text-lg">حجوزات يوم</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDateAr(selectedDate)}
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiPlus />}
                        onClick={() => openManualReservation(null)}
                    >
                        حجز جديد
                    </Button>
                </div>

                {dayReservations.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        لا توجد حجوزات في هذا اليوم
                    </div>
                ) : (
                    <Table>
                        <THead>
                            <Tr>
                                <Th>العميل</Th>
                                <Th>الخدمة</Th>
                                <Th>الوقت</Th>
                                <Th>الحالة</Th>
                                <Th className="text-left">الإجراءات</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {dayReservations.map((r) => (
                                <Tr key={r.id}>
                                    <Td>
                                        <div className="font-medium">
                                            {r.customer?.name || 'غير محدد'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {r.customer?.mobile || ''}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="font-medium">
                                            {r.service?.title || 'غير محدد'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {r.member?.name || 'غير محدد'}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="text-sm">
                                            {formatTimeAr(r.start_time)} -{' '}
                                            {formatTimeAr(r.end_time)}
                                        </div>
                                    </Td>
                                    <Td>{getStatusBadge(r.status)}</Td>
                                    <Td>
                                        <div className="flex items-center justify-end">
                                            <Button
                                                size="xs"
                                                className="me-2"
                                                icon={<HiOutlinePencil />}
                                                onClick={() =>
                                                    openManualReservation(r)
                                                }
                                            >
                                                تعديل
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="solid"
                                                icon={<HiOutlineEye />}
                                                onClick={() =>
                                                    openBookingDetails(r)
                                                }
                                            >
                                                عرض
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                )}
            </Card>

            {selectedBooking ? (
                <BookingDetailsModal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false)
                        setSelectedBooking(null)
                    }}
                    booking={selectedBooking}
                    canQuote
                    onBookingUpdated={(updatedBooking) => {
                        setDayReservations((current) =>
                            current.map((item) =>
                                item.id === updatedBooking.id
                                    ? updatedBooking
                                    : item,
                            ),
                        )
                        setSelectedBooking(updatedBooking)
                    }}
                />
            ) : null}

            {agency ? (
                <ManualReservationModal
                    isOpen={manualModalOpen}
                    onClose={() => {
                        setManualModalOpen(false)
                        setEditingReservation(null)
                    }}
                    agencyId={agency.id}
                    agencySlug={agency.slug}
                    selectedDate={selectedDate}
                    reservation={editingReservation}
                    onSaved={async (reservation) => {
                        setSelectedDate(reservation.date)
                        await refreshCalendarData(reservation.date)
                    }}
                    onDeleted={async () => {
                        await refreshCalendarData()
                    }}
                />
            ) : null}
        </div>
    )
}
