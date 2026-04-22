import { Dialog } from '@/components/ui'
import type { Booking } from '@/@types/booking'
import { HiX, HiUser, HiCalendar, HiClock, HiCreditCard } from 'react-icons/hi'

interface BookingDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    booking: Booking
}

export default function BookingDetailsModal({
    isOpen,
    onClose,
    booking,
}: BookingDetailsModalProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date)
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <div
                className="fixed inset-0 bg-black/60 z-[9999]"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[10000] max-w-2xl w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        تفاصيل الحجز
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                        <HiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <HiUser className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                معلومات العميل
                            </h4>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الاسم:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.customer.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الهاتف:
                                </span>
                                <span
                                    className="font-medium text-gray-900 dark:text-white"
                                    dir="ltr"
                                >
                                    {booking.customer.phone}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    البريد:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.customer.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <HiCalendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                تفاصيل الخدمة
                            </h4>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الخدمة:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.service.title}
                                </span>
                            </div>
                            {booking.crew && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        مقدم الخدمة:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {booking.crew.name}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    التاريخ:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(booking.date)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    الوقت:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.time}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <HiCreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                معلومات الدفع
                            </h4>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    طريقة الدفع:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {booking.paymentMethod}
                                </span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="text-gray-600 dark:text-gray-400">
                                    المبلغ الإجمالي:
                                </span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {booking.totalAmount} ر.س
                                </span>
                            </div>
                        </div>
                    </div>

                    {booking.notes && (
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                ملاحظات
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                    {booking.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    )
}
