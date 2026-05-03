import type { Booking } from '@/@types/booking'
import { Avatar, Badge, Button, Card, Spinner, Table, Tabs } from '@/components/ui'
import TBody from '@/components/ui/Table/TBody'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import THead from '@/components/ui/Table/THead'
import Tr from '@/components/ui/Table/Tr'
import { getAgencyBookings, getMyBookings } from '@/services/BookingService'
import { useSessionUser } from '@/store/authStore'
import {
    getReservationPricingLabel,
    getReservationPricingStatusLabel,
} from '@/utils/pricing'
import { useEffect, useMemo, useState } from 'react'
import { HiOutlineEye } from 'react-icons/hi'
import { useNavigate, useSearchParams } from 'react-router'
import BookingDetailsModal from './components/BookingDetailsModal'

type BookingsTab = 'my' | 'agency'
const { TabList, TabNav, TabContent } = Tabs

function normalizeTab(value: string | null, hasActiveAgency: boolean): BookingsTab {
    const v = (value || '').trim().toLowerCase()
    if (v === 'my') return 'my'
    if (v === 'agency') return hasActiveAgency ? 'agency' : 'my'
    return hasActiveAgency ? 'agency' : 'my'
}

function formatDate(dateString: string) {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('ar-OM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d)
}

function extractApiMessage(err: unknown): string | undefined {
    if (typeof err !== 'object' || err === null) return undefined
    const response = (err as { response?: unknown }).response
    if (typeof response !== 'object' || response === null) return undefined
    const data = (response as { data?: unknown }).data
    if (typeof data !== 'object' || data === null) return undefined
    const message = (data as { message?: unknown }).message
    return typeof message === 'string' && message.trim() ? message.trim() : undefined
}

function extractStatusCode(err: unknown): number | undefined {
    if (typeof err !== 'object' || err === null) return undefined
    const response = (err as { response?: unknown }).response
    if (typeof response !== 'object' || response === null) return undefined
    const status = (response as { status?: unknown }).status
    return typeof status === 'number' ? status : undefined
}

export default function Bookings() {
    const sessionUser = useSessionUser((s) => s.user)
    const hasActiveAgency = Boolean(sessionUser?.has_active_agency)
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const tabFromUrl = useMemo(
        () => normalizeTab(searchParams.get('tab'), hasActiveAgency),
        [hasActiveAgency, searchParams],
    )
    const [tab, setTab] = useState<BookingsTab>(tabFromUrl)

    useEffect(() => {
        setTab(tabFromUrl)
    }, [tabFromUrl])

    const agencySlug = useMemo(() => {
        const value = searchParams.get('agencySlug')
        return typeof value === 'string' && value.trim() ? value.trim() : undefined
    }, [searchParams])

    const openReservationId = useMemo(() => {
        const raw = searchParams.get('reservation_id')?.trim() ?? ''
        return raw && /^\d+$/.test(raw) ? Number(raw) : null
    }, [searchParams])

    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true)
            setError(null)
            try {
                const resp =
                    tab === 'agency'
                        ? await getAgencyBookings(agencySlug)
                        : await getMyBookings()
                const list = resp?.data ?? []
                setBookings(list)

                if (openReservationId) {
                    const found = list.find((b) => b.id === openReservationId)
                    if (found) {
                        setSelectedBooking(found)
                        setShowDetailsModal(true)
                    }
                }
            } catch (err: unknown) {
                const status = extractStatusCode(err)

                if (status && [401, 419, 440].includes(status)) {
                    const current = `${window.location.pathname}${window.location.search}`
                    navigate(`/login?redirectUrl=${encodeURIComponent(current)}`, {
                        replace: true,
                    })
                    return
                }

                const apiMessage = extractApiMessage(err)
                const normalized = (apiMessage || '').toLowerCase()

                if (
                    normalized.includes('no query results for model') &&
                    normalized.includes('app\\models\\agency')
                ) {
                    setBookings([])
                    setError(null)
                    return
                }

                setError(apiMessage || 'حدث خطأ أثناء تحميل الحجوزات')
                setBookings([])
            } finally {
                setLoading(false)
            }
        }

        void fetchBookings()
    }, [agencySlug, navigate, openReservationId, tab])

    const setTabAndUrl = (next: BookingsTab) => {
        setTab(next)
        const params = new URLSearchParams(searchParams)
        params.set('tab', next)
        setSearchParams(params, { replace: true })
    }

    const getStatusBadge = (status: Booking['status']) => {
        const statusConfig: Record<
            Booking['status'],
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
            cancelled: {
                label: 'ملغي',
                className:
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            },
        }

        return (
            <Badge className={statusConfig[status].className}>
                {statusConfig[status].label}
            </Badge>
        )
    }

    return (
        <>
            <Card bordered className="p-4" bodyClass="p-0" dir="rtl">
                <Tabs value={tab} onChange={(v) => setTabAndUrl(v as BookingsTab)}>
                    <TabList>
                        <TabNav value="my">حجوزاتي</TabNav>
                        {hasActiveAgency ? (
                            <TabNav value="agency">حجوزات مراكزي</TabNav>
                        ) : null}
                    </TabList>

                    <TabContent value="my">
                        <div className="p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Spinner size={40} />
                                </div>
                            ) : error ? (
                                <div className="text-center py-10 text-red-600">
                                    {error}
                                </div>
                            ) : bookings.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    لا توجد حجوزات
                                </div>
                            ) : (
                                <Table>
                                    <THead>
                                        <Tr>
                                            <Th>المركز</Th>
                                            <Th>الخدمة</Th>
                                            <Th>الموعد</Th>
                                            <Th>التسعير</Th>
                                            <Th>الحالة</Th>
                                            <Th className="text-left">الإجراءات</Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {bookings.map((booking) => (
                                            <Tr key={booking.id}>
                                                <Td>
                                                    <div className="flex items-center justify-start gap-3">
                                                        <Avatar
                                                            src={
                                                                booking.agency?.logo?.thumb ||
                                                                booking.agency?.logo?.original ||
                                                                undefined
                                                            }
                                                            alt={booking.agency?.title || 'agency'}
                                                            className="w-10 h-10"
                                                        >
                                                            {(booking.agency?.title || 'A')
                                                                .trim()
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {booking.agency?.title || '-'}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {booking.agency?.slug || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {booking.service?.title || '-'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {booking.member?.name || 'غير محدد'}
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <div className="text-sm">{formatDate(booking.date)}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {booking.start_time} - {booking.end_time}
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {getReservationPricingLabel(booking)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {getReservationPricingStatusLabel(booking.pricing_status)}
                                                    </div>
                                                </Td>
                                                <Td>{getStatusBadge(booking.status)}</Td>
                                                <Td>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="xs"
                                                            variant="solid"
                                                            icon={<HiOutlineEye />}
                                                            onClick={() => {
                                                                setSelectedBooking(booking)
                                                                setShowDetailsModal(true)
                                                            }}
                                                            className="cursor-pointer"
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
                        </div>
                    </TabContent>

                    {hasActiveAgency ? (
                        <TabContent value="agency">
                            <div className="p-4">
                                {loading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Spinner size={40} />
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-10 text-red-600">
                                        {error}
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        لا توجد حجوزات
                                    </div>
                                ) : (
                                    <Table>
                                        <THead>
                                            <Tr>
                                                <Th>العميل</Th>
                                                <Th>الخدمة</Th>
                                                <Th>الموعد</Th>
                                                <Th>التسعير</Th>
                                                <Th>الحالة</Th>
                                                <Th className="text-left">الإجراءات</Th>
                                            </Tr>
                                        </THead>
                                        <TBody>
                                            {bookings.map((booking) => (
                                                <Tr key={booking.id}>
                                                    <Td>
                                                        <div className="flex items-center justify-start gap-3">
                                                            <Avatar
                                                                src={
                                                                    booking.agency?.logo?.thumb ||
                                                                    booking.agency?.logo?.original ||
                                                                    undefined
                                                                }
                                                                alt={booking.agency?.title || 'agency'}
                                                                className="w-10 h-10"
                                                            >
                                                                {(booking.agency?.title || 'A')
                                                                    .trim()
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {booking.agency?.title || '-'}
                                                                </div>
                                                                <div
                                                                    className="text-xs text-gray-500 dark:text-gray-400"
                                                                    dir="ltr"
                                                                >
                                                                    {booking.agency?.slug || '-'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Td>
                                                    <Td>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {booking.service?.title || '-'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {booking.member?.name || 'غير محدد'}
                                                        </div>
                                                    </Td>
                                                    <Td>
                                                        <div className="text-sm">{formatDate(booking.date)}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {booking.start_time} - {booking.end_time}
                                                        </div>
                                                    </Td>
                                                    <Td>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {getReservationPricingLabel(booking)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {getReservationPricingStatusLabel(booking.pricing_status)}
                                                        </div>
                                                    </Td>
                                                    <Td>{getStatusBadge(booking.status)}</Td>
                                                    <Td>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="xs"
                                                                variant="solid"
                                                                icon={<HiOutlineEye />}
                                                                onClick={() => {
                                                                    setSelectedBooking(booking)
                                                                    setShowDetailsModal(true)
                                                                }}
                                                                className="cursor-pointer"
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
                            </div>
                        </TabContent>
                    ) : null}
                </Tabs>
            </Card>

            {selectedBooking ? (
                <BookingDetailsModal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false)
                        setSelectedBooking(null)
                    }}
                    booking={selectedBooking}
                    canQuote={tab === 'agency'}
                    onBookingUpdated={(updatedBooking) => {
                        setBookings((current) =>
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
        </>
    )
}
