import type { Booking } from '@/@types/booking'
import { Button, Dialog, Input } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { quoteAgencyReservationPrice } from '@/services/BookingService'
import {
    getReservationPricingLabel,
    getReservationPricingStatusLabel,
} from '@/utils/pricing'
import { HiCalendar, HiChatAlt2, HiOfficeBuilding, HiUser } from 'react-icons/hi'
import { useNavigate } from 'react-router'
import { useState } from 'react'

interface BookingDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    booking: Booking
    canQuote?: boolean
    onBookingUpdated?: (booking: Booking) => void
}

// ── tiny helpers ──────────────────────────────────────────────────────────────

function InfoRow({
    label,
    value,
    dir,
}: {
    label: string
    value: React.ReactNode
    dir?: 'ltr' | 'rtl'
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5">
            <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                {label}
            </span>
            <span
                className="text-right text-sm font-medium text-gray-900 dark:text-white"
                dir={dir}
            >
                {value || '-'}
            </span>
        </div>
    )
}

function Section({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode
    title: string
    children: React.ReactNode
}) {
    return (
        <div>
            <div className="mb-2 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {title}
                </h4>
            </div>
            <div className="divide-y divide-gray-100 rounded-xl bg-gray-50 px-4 dark:divide-gray-800 dark:bg-gray-900/50">
                {children}
            </div>
        </div>
    )
}

// ── main component ────────────────────────────────────────────────────────────

export default function BookingDetailsModal({
    isOpen,
    onClose,
    booking,
    canQuote = false,
    onBookingUpdated,
}: BookingDetailsModalProps) {
    const navigate = useNavigate()
    const chatAvailable = Boolean(booking.customer.user?.id)

    const [quotePrice, setQuotePrice] = useState(
        booking.final_price?.toString() || booking.quoted_price?.toString() || '',
    )
    const [quoteStatus, setQuoteStatus] = useState<Booking['status']>(booking.status)
    const [quoteError, setQuoteError] = useState<string | null>(null)
    const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null)
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)

    const formatDate = (dateString: string) =>
        new Intl.DateTimeFormat('ar-OM', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(dateString))

    const handleQuoteSave = async () => {
        const parsed = Number(quotePrice)
        if (!Number.isFinite(parsed) || parsed < 0) {
            setQuoteError('أدخل سعراً صحيحاً قبل الحفظ.')
            setQuoteSuccess(null)
            return
        }

        setIsSubmittingQuote(true)
        setQuoteError(null)
        setQuoteSuccess(null)

        try {
            const response = await quoteAgencyReservationPrice(booking.id, {
                price: parsed,
                status: quoteStatus,
            })

            const updatedBooking: Booking = {
                ...booking,
                pricing_status: response.data.pricing_status,
                quoted_price: response.data.quoted_price,
                final_price: response.data.final_price,
                currency: response.data.currency,
                status: response.data.status,
            }

            onBookingUpdated?.(updatedBooking)
            setQuoteSuccess(response.message || 'تم حفظ التسعير بنجاح.')
        } catch (error: unknown) {
            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (
                        error as { response?: { data?: { message?: string } } }
                    ).response?.data?.message === 'string'
                    ? (error as { response?: { data?: { message?: string } } })
                        .response?.data?.message
                    : 'تعذر حفظ التسعير.'

            setQuoteError(message || 'تعذر حفظ التسعير.')
        } finally {
            setIsSubmittingQuote(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} className="max-w-lg w-full" onClose={onClose}>
            {/* ── header ── */}
            <div className="border-b border-gray-100g py-4 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    تفاصيل الحجز
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">
                    #{booking.id}
                </p>
            </div>

            {/* ── scrollable body ── */}
            <div
                className="overflow-y-auto space-y-5"
                style={{ maxHeight: 'min(72vh, 560px)' }}
            >
                {/* customer */}
                <Section
                    icon={<HiUser className="w-4 h-4" />}
                    title="بيانات العميل"
                >
                    <InfoRow label="الاسم" value={booking.customer.name} />
                    <InfoRow
                        label="رقم الهاتف"
                        value={booking.customer.mobile}
                        dir="ltr"
                    />
                    {booking.customer.user?.email ? (
                        <InfoRow
                            label="البريد الإلكتروني"
                            value={booking.customer.user.email}
                        />
                    ) : null}
                </Section>

                {/* center & service */}
                <Section
                    icon={<HiOfficeBuilding className="w-4 h-4" />}
                    title="المركز والخدمة"
                >
                    <InfoRow label="المركز" value={booking.agency?.title} />
                    <InfoRow label="الخدمة" value={booking.service?.title} />
                    <InfoRow
                        label="مقدم الخدمة"
                        value={booking.member?.name || 'غير محدد'}
                    />
                </Section>

                {/* date, time & status */}
                <Section
                    icon={<HiCalendar className="w-4 h-4" />}
                    title="التاريخ والوقت"
                >
                    <InfoRow label="التاريخ" value={formatDate(booking.date)} />
                    <InfoRow
                        label="الوقت"
                        value={`${booking.start_time} - ${booking.end_time}`}
                        dir="ltr"
                    />
                    <InfoRow label="الحالة" value={booking.status} />
                    <InfoRow
                        label="التسعير"
                        value={getReservationPricingStatusLabel(booking.pricing_status)}
                    />
                    <InfoRow
                        label="السعر"
                        value={getReservationPricingLabel(booking)}
                    />
                    {booking.note ? (
                        <InfoRow label="الملاحظات" value={booking.note} />
                    ) : null}
                </Section>

                {/* quote panel */}
                {canQuote ? (
                    <div>
                        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            تحديث التسعير
                        </h4>
                        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-4 space-y-4 dark:border-indigo-900 dark:bg-indigo-950/20">
                            {quoteError ? (
                                <Notification type="danger">{quoteError}</Notification>
                            ) : null}
                            {quoteSuccess ? (
                                <Notification type="success">{quoteSuccess}</Notification>
                            ) : null}

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        السعر النهائي
                                    </label>
                                    <Input
                                        value={quotePrice}
                                        placeholder="17.50"
                                        inputMode="decimal"
                                        onChange={(e) =>
                                            setQuotePrice(
                                                e.target.value.replace(/[^\d.]/g, ''),
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        حالة الحجز
                                    </label>
                                    <select
                                        value={quoteStatus}
                                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        onChange={(e) =>
                                            setQuoteStatus(
                                                e.target.value as Booking['status'],
                                            )
                                        }
                                    >
                                        <option value="pending">قيد الانتظار</option>
                                        <option value="confirmed">مؤكد</option>
                                        <option value="cancelled">ملغي</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    variant="solid"
                                    loading={isSubmittingQuote}
                                    onClick={handleQuoteSave}
                                >
                                    حفظ التسعير
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ── sticky footer ── */}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
                {!chatAvailable ? (
                    <p className="text-xs text-gray-400">
                        الدردشة غير متاحة للحجوزات بدون حساب.
                    </p>
                ) : (
                    <span />
                )}
                <div className="flex items-center gap-2">
                    <Button variant="plain" onClick={onClose}>
                        إغلاق
                    </Button>
                    <Button
                        variant="solid"
                        disabled={!chatAvailable}
                        icon={<HiChatAlt2 />}
                        onClick={() => {
                            navigate(`/chat?reservation_id=${booking.id}`)
                            onClose()
                        }}
                    >
                        المحادثة
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
