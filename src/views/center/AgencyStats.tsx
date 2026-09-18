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
import useTranslation from '@/utils/hooks/useTranslation'

const formatDate = (dateString: string, locale: string) =>
    new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateString))

const formatTime = (time: string) => time?.toString().slice(0, 5)

export default function AgencyStats() {
    const { t, i18n } = useTranslation()
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
                setError(apiMessage || t('centerStats.loadError'))
            } finally {
                setLoading(false)
            }
        }
        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agencySlug, t])

    const monthEvents = useMemo(() => {
        return (dailyCounts || []).map((d) => ({
            id: d.date,
            title: t('centerStats.count', { count: d.count }),
            start: d.date,
            allDay: true,
            extendedProps: { eventColor: 'blue' },
        }))
    }, [dailyCounts, t])

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { labelKey: string; className: string }> =
            {
                pending: {
                    labelKey: 'centerStats.statusPending',
                    className:
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                },
                confirmed: {
                    labelKey: 'centerStats.statusConfirmed',
                    className:
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
                },
                completed: {
                    labelKey: 'centerStats.statusCompleted',
                    className:
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                },
                cancelled: {
                    labelKey: 'centerStats.statusCancelled',
                    className:
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                },
            }
        const config = statusConfig[status] || statusConfig.pending
        return (
            <Badge
                className={`${config.className} px-3 py-1 rounded-full text-xs font-medium`}
            >
                {t(config.labelKey)}
            </Badge>
        )
    }

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>{t('centerStats.loading')}</div>
            </div>
        )

    if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>

    return (
        <div className="space-y-6">
            <Card>
                <div className="mb-6">
                    <h2 className="mb-2">{t('centerStats.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('centerStats.subtitle')}
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
                        if (arg.view.type === 'dayGridMonth') {
                            const m = dayjs(arg.view.currentStart).format('YYYY-MM')
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
                        setLoading(true)
                        try {
                            await fetchDay(date)
                        } finally {
                            setLoading(false)
                        }
                    }}
                />
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{t('centerStats.dayReservations')}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(selectedDate, i18n.language)}
                    </div>
                </div>

                {dayReservations.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        {t('centerStats.empty')}
                    </div>
                ) : (
                    <Table>
                        <THead>
                            <Tr>
                                <Th>{t('centerStats.customer')}</Th>
                                <Th>{t('centerStats.service')}</Th>
                                <Th>{t('centerStats.time')}</Th>
                                <Th>{t('centerStats.status')}</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {dayReservations.map((r) => (
                                <Tr key={r.id}>
                                    <Td>
                                        <div className="font-medium">
                                            {r.customer?.name || t('centerStats.unassigned')}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {r.customer?.mobile || ''}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="font-medium">
                                            {r.service?.title || t('centerStats.unassigned')}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {r.member?.name || t('centerStats.unassigned')}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="text-sm">
                                            {formatTime(r.start_time)} -{' '}
                                            {formatTime(r.end_time)}
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
