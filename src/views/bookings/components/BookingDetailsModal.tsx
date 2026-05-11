import type { Booking } from '@/@types/booking'
import { Button, Dialog, Input } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { quoteAgencyReservationPrice } from '@/services/BookingService'
import {
    getReservationPricingLabel,
    getReservationPricingStatusLabel,
} from '@/utils/pricing'
import { HiCalendar, HiOfficeBuilding, HiUser, HiX } from 'react-icons/hi'
import { useNavigate } from 'react-router'
import { useState } from 'react'

interface BookingDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    booking: Booking
    canQuote?: boolean
    onBookingUpdated?: (booking: Booking) => void
}

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
        booking.final_price?.toString() ||
            booking.quoted_price?.toString() ||
            '',
    )
    const [quoteStatus, setQuoteStatus] = useState<Booking['status']>(
        booking.status,
    )
    const [quoteError, setQuoteError] = useState<string | null>(null)
    const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null)
    const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('ar-OM', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date)
    }

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
                typeof (error as { response?: { data?: { message?: string } } })
                    .response?.data?.message === 'string'
                    ? (error as { response?: { data?: { message?: string } } })
                          .response?.data?.message
                    : 'تعذر حفظ التسعير.'

            setQuoteError(message || 'تعذر حفظ التسعير.')
        } finally {
            setIsSubmittingQuote(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <div
                className="fixed inset-0 bg-black/60 z-[9999]"
                onClick={onClose}
            />

            <div
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[10000] max-w-2xl w-full mx-4"
                dir="rtl"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        تفاصيل الحجز
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                        aria-label="إغلاق"
                    >
                        <HiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <HiUser className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                بيانات العميل
                            </h4>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الاسم:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.customer.name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    رقم الهاتف:
                                </span>
                                <span
                                    className="font-medium text-gray-900 dark:text-white"
                                    dir="ltr"
                                >
                                    {booking.customer.mobile || '-'}
                                </span>
                            </div>
                            {booking.customer.user?.email ? (
                                <div className="flex justify-between gap-6">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        البريد الإلكتروني:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {booking.customer.user.email}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <HiOfficeBuilding className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                المركز والخدمة
                            </h4>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    المركز:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.agency?.title || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الخدمة:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.service?.title || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    مقدم الخدمة:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.member?.name || 'غير محدد'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <HiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                التاريخ والوقت
                            </h4>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    التاريخ:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(booking.date)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الوقت:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.start_time} - {booking.end_time}
                                </span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الحالة:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.status}
                                </span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    التسعير:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {getReservationPricingStatusLabel(booking.pricing_status)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-gray-600 dark:text-gray-400">
                                    السعر:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {getReservationPricingLabel(booking)}
                                </span>
                            </div>
                            {booking.note ? (
                                <div className="flex justify-between gap-6">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        الملاحظات:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {booking.note}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {canQuote ? (
                        <div>
                            <div className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                                تحديث التسعير
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3">
                                {quoteError ? (
                                    <Notification type="danger">
                                        {quoteError}
                                    </Notification>
                                ) : null}
                                {quoteSuccess ? (
                                    <Notification type="success">
                                        {quoteSuccess}
                                    </Notification>
                                ) : null}
                                <div>
                                    <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                                        السعر النهائي
                                    </div>
                                    <Input
                                        value={quotePrice}
                                        onChange={(event) =>
                                            setQuotePrice(
                                                event.target.value.replace(
                                                    /[^\d.]/g,
                                                    '',
                                                ),
                                            )
                                        }
                                        placeholder="17.50"
                                        inputMode="decimal"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                                        حالة الحجز بعد التسعير
                                    </div>
                                    <select
                                        value={quoteStatus}
                                        onChange={(event) =>
                                            setQuoteStatus(
                                                event.target
                                                    .value as Booking['status'],
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="pending">قيد الانتظار</option>
                                        <option value="confirmed">مؤكد</option>
                                        <option value="cancelled">ملغي</option>
                                    </select>
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

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            variant="solid"
                            disabled={!chatAvailable}
                            onClick={() => {
                                navigate(`/chat?reservation_id=${booking.id}`)
                                onClose()
                            }}
                        >
                            المحادثة
                        </Button>
                        {!chatAvailable ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                الدردشة غير متاحة للحجوزات بدون حساب.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </Dialog>
    )
}
