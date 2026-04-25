import type { Booking } from '@/@types/booking'
import { Button, Dialog } from '@/components/ui'
import { HiCalendar, HiOfficeBuilding, HiUser, HiX } from 'react-icons/hi'
import { useNavigate } from 'react-router'

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
    const navigate = useNavigate()
    const chatAvailable = Boolean(booking.customer.user?.id)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('ar-OM', {
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
                        </div>
                    </div>

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

