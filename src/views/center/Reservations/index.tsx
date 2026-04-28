import { Card, Spinner, Table, Badge } from '@/components/ui'
import TBody from '@/components/ui/Table/TBody'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import THead from '@/components/ui/Table/THead'
import Tr from '@/components/ui/Table/Tr'
import { CalendarView } from '@/components/shared'
import type { Booking } from '@/@types/booking'
import type { ReservationDailyCount } from '@/@types/reservations'
import { getAgencyReservationsV2 } from '@/services/BookingService'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import dayjs from 'dayjs'

const formatDateAr = (dateString: string) =>
    new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateString))

const formatTimeAr = (time: string) =>
    time?.toString().slice(0, 5) // HH:mm from HH:mm:ss

export default function ReservationsCalendar() {
    const { agencySlug } = useParams()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [dailyCounts, setDailyCounts] = useState<ReservationDailyCount[]>([])
    const [selectedDate, setSelectedDate] = useState<string>(
        dayjs().format('YYYY-MM-DD'),
    )
    const [dayReservations, setDayReservations] = useState<Booking[]>([])

    const fetchMonth = async (month: string) => {
        if (!agencySlug) return
        const resp = await getAgencyReservationsV2({
            agencySlug: String(agencySlug),
            view: 'month',
            month,
            include_daily_counts: true,
            include_reservations: false,
        })
        setDailyCounts(resp.daily_counts || [])
    }

    const fetchDay = async (date: string) => {
        if (!agencySlug) return
        const resp = await getAgencyReservationsV2({
            agencySlug: String(agencySlug),
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
            setLoading(true)
            setError(null)
            try {
                await Promise.all([
                    fetchMonth(dayjs().format('YYYY-MM')),
                    fetchDay(selectedDate),
                ])
            } catch (err: unknown) {
                const apiMessage = (() => {
                    if (typeof err !== 'object' || err === null) return undefined
                    const response = (err as { response?: unknown }).response
                    if (typeof response !== 'object' || response === null)
                        return undefined
                    const data = (response as { data?: unknown }).data
                    if (typeof data !== 'object' || data === null) return undefined
                    const message = (data as { message?: unknown }).message
                    return typeof message === 'string' && message.trim()
                        ? message.trim()
                        : undefined
                })()
                setError(apiMessage || 'حدث خطأ أثناء تحميل الحجوزات')
            } finally {
                setLoading(false)
            }
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agencySlug])

    const monthEvents = useMemo(() => {
        return (dailyCounts || []).map((d) => ({
            id: d.date,
            title: `${d.count} حجز`,
            start: d.date,
            allDay: true,
            extendedProps: { eventColor: 'blue' },
        }))
    }, [dailyCounts])

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> =
            {
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

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>جاري التحميل...</div>
            </div>
        )

    if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>

    return (
        <div className="space-y-6">
            <Card>
                <div className="mb-6">
                    <h2 className="mb-2">الحجوزات</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        عرض الحجوزات حسب الشهر أو اليوم
                    </p>
                </div>

                <CalendarView
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'title',
                        center: '',
                        right: 'dayGridMonth,timeGridDay prev,next',
                    }}
                    selectable={false}
                    events={monthEvents}
                    datesSet={async (arg) => {
                        // Month view: fetch counts for the displayed month.
                        if (arg.view.type === 'dayGridMonth') {
                            const m = dayjs(arg.view.currentStart).format('YYYY-MM')
                            try {
                                await fetchMonth(m)
                            } catch {
                                // ignore; error is handled by initial load path
                            }
                        }

                        // Day view: fetch reservations for the selected day.
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
                        setLoading(true)
                        try {
                            await fetchDay(date)
                        } catch (err: unknown) {
                            const apiMessage = (() => {
                                if (typeof err !== 'object' || err === null)
                                    return undefined
                                const response = (err as { response?: unknown })
                                    .response
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
                            setError(apiMessage || 'تعذر تحميل حجوزات اليوم')
                        } finally {
                            setLoading(false)
                        }
                    }}
                />
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">حجوزات يوم</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateAr(selectedDate)}
                    </div>
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
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                )}
            </Card>
        </div>
    )
}

