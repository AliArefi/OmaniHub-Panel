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
import { useEffect, useMemo, useRef, useState } from 'react'
import { HiOutlineEye } from 'react-icons/hi'
import BookingDetailsModal from './components/BookingDetailsModal'
import { useNavigate, useSearchParams } from 'react-router'

type BookingsTab = 'my' | 'agency'

// ── status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
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

function StatusBadge({ status }: { status: Booking['status'] }) {
    const cfg = STATUS_CONFIG[status]
    return <Badge className={cfg.className}>{cfg.label}</Badge>
}

// ── helpers ───────────────────────────────────────────────────────────────────
function normalizeTab(value: string | null, hasActiveAgency: boolean): BookingsTab {
    const v = (value || '').trim().toLowerCase()
    if (v === 'my') return 'my'
    if (v === 'agency' && hasActiveAgency) return 'agency'
    return hasActiveAgency ? 'agency' : 'my'
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('ar-OM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(dateString))
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

// ── mobile card ───────────────────────────────────────────────────────────────
interface BookingCardProps {
    booking: Booking
    firstColumnMode: 'agency' | 'customer'
    onView: (b: Booking) => void
}

function BookingMobileCard({ booking, firstColumnMode, onView }: BookingCardProps) {
    const avatarSrc =
        booking.agency?.logo?.thumb ||
        booking.agency?.logo?.original ||
        undefined

    const primaryLabel =
        firstColumnMode === 'customer'
            ? booking.customer?.name || '-'
            : booking.agency?.title || '-'

    const primarySub =
        firstColumnMode === 'customer'
            ? booking.customer?.mobile || '-'
            : booking.agency?.slug || '-'

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                        src={avatarSrc}
                        alt={primaryLabel}
                        className="h-10 w-10 shrink-0"
                    >
                        {primaryLabel.trim().charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                            {primaryLabel}
                        </p>
                        <p
                            className="truncate text-xs text-gray-500 dark:text-gray-400"
                            dir={firstColumnMode === 'customer' ? 'ltr' : undefined}
                        >
                            {primarySub}
                        </p>
                    </div>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400">الخدمة</span>
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                        {booking.service?.title || '-'}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400">مقدم الخدمة</span>
                    <span className="truncate text-gray-700 dark:text-gray-300">
                        {booking.member?.name || 'غير محدد'}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400">الموعد</span>
                    <span
                        className="whitespace-nowrap text-gray-700 dark:text-gray-300"
                        dir="ltr"
                    >
                        {formatDate(booking.date)} · {booking.start_time}–{booking.end_time}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 dark:text-gray-400">التسعير</span>
                    <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                            {getReservationPricingLabel(booking)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getReservationPricingStatusLabel(booking.pricing_status)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex justify-end">
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlineEye />}
                    onClick={() => onView(booking)}
                >
                    عرض التفاصيل
                </Button>
            </div>
        </div>
    )
}

// ── shared tab body ───────────────────────────────────────────────────────────
interface TabBodyProps {
    loading: boolean
    error: string | null
    bookings: Booking[]
    firstColumnLabel: string
    firstColumnMode: 'agency' | 'customer'
    onView: (b: Booking) => void
}

function BookingsTabBody({
    loading,
    error,
    bookings,
    firstColumnLabel,
    firstColumnMode,
    onView,
}: TabBodyProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size={40} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-16 text-center text-sm text-red-600 dark:text-red-400">
                {error}
            </div>
        )
    }

    if (bookings.length === 0) {
        return (
            <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                لا توجد حجوزات
            </div>
        )
    }

    return (
        <>
            {/* mobile */}
            <div className="space-y-3 lg:hidden">
                {bookings.map((b) => (
                    <BookingMobileCard
                        key={b.id}
                        booking={b}
                        firstColumnMode={firstColumnMode}
                        onView={onView}
                    />
                ))}
            </div>

            {/* desktop */}
            <div className="hidden overflow-x-auto lg:block">
                <Table>
                    <THead>
                        <Tr>
                            <Th>{firstColumnLabel}</Th>
                            <Th>الخدمة</Th>
                            <Th>الموعد</Th>
                            <Th>التسعير</Th>
                            <Th>الحالة</Th>
                            <Th className="text-left">الإجراءات</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {bookings.map((booking) => {
                            const avatarLabel =
                                firstColumnMode === 'customer'
                                    ? booking.customer?.name || 'C'
                                    : booking.agency?.title || 'A'
                            const avatarSrc =
                                booking.agency?.logo?.thumb ||
                                booking.agency?.logo?.original ||
                                undefined
                            const subLabel =
                                firstColumnMode === 'customer'
                                    ? booking.customer?.mobile || '-'
                                    : booking.agency?.slug || '-'

                            return (
                                <Tr key={booking.id}>
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={avatarSrc}
                                                alt={avatarLabel}
                                                className="h-10 w-10 shrink-0"
                                            >
                                                {avatarLabel.trim().charAt(0).toUpperCase()}
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                                    {avatarLabel}
                                                </p>
                                                <p
                                                    className="truncate text-xs text-gray-500 dark:text-gray-400"
                                                    dir={
                                                        firstColumnMode === 'customer'
                                                            ? 'ltr'
                                                            : undefined
                                                    }
                                                >
                                                    {subLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </Td>

                                    <Td>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {booking.service?.title || '-'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {booking.member?.name || 'غير محدد'}
                                        </p>
                                    </Td>

                                    <Td>
                                        <p className="whitespace-nowrap text-sm">
                                            {formatDate(booking.date)}
                                        </p>
                                        <p
                                            className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400"
                                            dir="ltr"
                                        >
                                            {booking.start_time} - {booking.end_time}
                                        </p>
                                    </Td>

                                    <Td>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {getReservationPricingLabel(booking)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {getReservationPricingStatusLabel(
                                                booking.pricing_status,
                                            )}
                                        </p>
                                    </Td>

                                    <Td>
                                        <StatusBadge status={booking.status} />
                                    </Td>

                                    <Td>
                                        <div className="flex items-center justify-end">
                                            <Button
                                                size="xs"
                                                variant="solid"
                                                icon={<HiOutlineEye />}
                                                className="cursor-pointer"
                                                onClick={() => onView(booking)}
                                            >
                                                عرض
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            )
                        })}
                    </TBody>
                </Table>
            </div>
        </>
    )
}

// ── tab state type ────────────────────────────────────────────────────────────
interface TabState {
    bookings: Booking[]
    loading: boolean
    error: string | null
}

const INITIAL_TAB_STATE: TabState = { bookings: [], loading: false, error: null }

// ── page component ────────────────────────────────────────────────────────────
export default function Bookings() {
    const sessionUser = useSessionUser((s) => s.user)
    const hasActiveAgency = Boolean(sessionUser?.has_active_agency)
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    // derive tab from URL — no sync effect needed
    const tab = useMemo(
        () => normalizeTab(searchParams.get('tab'), hasActiveAgency),
        [hasActiveAgency, searchParams],
    )

    const agencySlug = useMemo(() => {
        const value = searchParams.get('agencySlug')
        return typeof value === 'string' && value.trim() ? value.trim() : undefined
    }, [searchParams])

    const openReservationId = useMemo(() => {
        const raw = searchParams.get('reservation_id')?.trim() ?? ''
        return raw && /^\d+$/.test(raw) ? Number(raw) : null
    }, [searchParams])

    // separate state per tab — no cross-tab bleed
    const [myState, setMyState] = useState<TabState>(INITIAL_TAB_STATE)
    const [agencyState, setAgencyState] = useState<TabState>(INITIAL_TAB_STATE)

    const setTabState = tab === 'agency' ? setAgencyState : setMyState
    const tabState = tab === 'agency' ? agencyState : myState

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    // track whether we've already handled the deep-link reservation_id
    const deepLinkHandled = useRef(false)

    // fetch when tab or agencySlug changes — abortable
    useEffect(() => {
        const controller = new AbortController()

        const fetchBookings = async () => {
            setTabState((prev) => ({ ...prev, loading: true, error: null }))

            try {
                const resp =
                    tab === 'agency'
                        ? await getAgencyBookings(agencySlug)
                        : await getMyBookings()

                if (controller.signal.aborted) return

                const list = resp?.data ?? []
                setTabState({ bookings: list, loading: false, error: null })
            } catch (err: unknown) {
                if (controller.signal.aborted) return

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
                    setTabState({ bookings: [], loading: false, error: null })
                    return
                }

                setTabState({
                    bookings: [],
                    loading: false,
                    error: apiMessage || 'حدث خطأ أثناء تحميل الحجوزات',
                })
            }
        }

        void fetchBookings()

        return () => controller.abort()
    }, [tab, agencySlug, navigate]) // openReservationId intentionally excluded

    // handle deep-link modal open — runs once after first successful load
    useEffect(() => {
        if (deepLinkHandled.current) return
        if (tabState.loading || !openReservationId) return

        const found = tabState.bookings.find((b) => b.id === openReservationId)
        if (found) {
            setSelectedBooking(found)
            setShowDetailsModal(true)
            deepLinkHandled.current = true
        }
    }, [tabState.loading, tabState.bookings, openReservationId])

    const setTabAndUrl = (next: BookingsTab) => {
        const params = new URLSearchParams(searchParams)
        params.set('tab', next)
        setSearchParams(params, { replace: true })
    }

    const handleView = (booking: Booking) => {
        setSelectedBooking(booking)
        setShowDetailsModal(true)
    }

    const { TabList, TabNav, TabContent } = Tabs

    return (
        <>
            <Card bordered className="p-3 sm:p-4" bodyClass="p-0" dir="rtl">
                <Tabs value={tab} onChange={(v) => setTabAndUrl(v as BookingsTab)}>
                    <TabList>
                        <TabNav value="my">حجوزاتي</TabNav>
                        {hasActiveAgency ? (
                            <TabNav value="agency">حجوزات مراكزي</TabNav>
                        ) : null}
                    </TabList>

                    <TabContent value="my">
                        <div className="p-3 sm:p-4">
                            <BookingsTabBody
                                loading={myState.loading}
                                error={myState.error}
                                bookings={myState.bookings}
                                firstColumnLabel="المركز"
                                firstColumnMode="agency"
                                onView={handleView}
                            />
                        </div>
                    </TabContent>

                    {hasActiveAgency ? (
                        <TabContent value="agency">
                            <div className="p-3 sm:p-4">
                                <BookingsTabBody
                                    loading={agencyState.loading}
                                    error={agencyState.error}
                                    bookings={agencyState.bookings}
                                    firstColumnLabel="العميل"
                                    firstColumnMode="customer"
                                    onView={handleView}
                                />
                            </div>
                        </TabContent>
                    ) : null}
                </Tabs>
            </Card>

            {selectedBooking ? (
                <BookingDetailsModal
                    isOpen={showDetailsModal}
                    booking={selectedBooking}
                    canQuote={tab === 'agency'}
                    onClose={() => {
                        setShowDetailsModal(false)
                        setSelectedBooking(null)
                    }}
                    onBookingUpdated={(updatedBooking) => {
                        const updater = (prev: TabState): TabState => ({
                            ...prev,
                            bookings: prev.bookings.map((item) =>
                                item.id === updatedBooking.id ? updatedBooking : item,
                            ),
                        })
                        setMyState(updater)
                        setAgencyState(updater)
                        setSelectedBooking(updatedBooking)
                    }}
                />
            ) : null}
        </>
    )
}
