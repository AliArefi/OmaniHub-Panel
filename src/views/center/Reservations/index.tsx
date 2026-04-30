import { Avatar, Badge, Button, Card, Spinner, Table } from '@/components/ui'
import TBody from '@/components/ui/Table/TBody'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import THead from '@/components/ui/Table/THead'
import Tr from '@/components/ui/Table/Tr'
import Notification from '@/components/ui/Notification'
import { useTranslation } from '@/store/useTranslation'
import { useEffect, useState } from 'react'
import { HiOutlineChatAlt2, HiOutlineEye } from 'react-icons/hi'
import type { Booking } from '@/@types/booking'
import { getSingleAgencyBookings } from '@/services/BookingService'
import BookingDetailsModal from './components/BookingDetailsModal'
import { useParams } from 'react-router'

export default function Reservations() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const { t } = useTranslation()
    const { agencySlug } = useParams()

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true)
            try {
                const resp = await getSingleAgencyBookings(agencySlug as string)
                setBookings(resp.data)
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
                        ? message
                        : undefined
                })()
                setError(apiMessage || 'حدث خطأ أثناء تحميل الحجوزات')
            } finally {
                setLoading(false)
            }
        }

        fetchBookings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking)
        setShowDetailsModal(true)
    }

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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date)
    }

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>{t('loading')}</div>
            </div>
        )
    if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>

    return (
        <>
            <Card>
                <div className="mb-10">
                    <h2 className="mb-2">إدارة الحجوزات</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        عرض وإدارة جميع حجوزات المركز
                    </p>
                </div>

                {bookings.length === 0 ? (
                    <Notification type="info">
                        لا توجد حجوزات حتى الآن
                    </Notification>
                ) : (
                    <Table>
                        <THead>
                            <Tr>
                                <Th>العميل</Th>
                                <Th>الخدمة</Th>
                                <Th>التاريخ/الوقت</Th>
                                <Th>الحالة</Th>
                                <Th>الإجراءات</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {bookings.map((booking) => (
                                <Tr key={booking.id}>
                                    <Td>
                                        <div className="flex items-center justify-start gap-3">
                                            <Avatar
                                                src={
                                                    booking.customer?.user
                                                        ?.avatar || undefined
                                                }
                                                alt={booking.customer?.name || ''}
                                                className="w-10 h-10"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {booking.customer?.name ||
                                                        'غير محدد'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {booking.customer?.mobile ||
                                                        ''}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {booking.service?.title ||
                                                'غير محدد'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {booking.member?.name ||
                                                'غير محدد'}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="text-sm">
                                            {formatDate(booking.date)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {booking.start_time?.slice(0, 5)} -{' '}
                                            {booking.end_time?.slice(0, 5)}
                                        </div>
                                    </Td>
                                    <Td>{getStatusBadge(booking.status)}</Td>
                                    <Td>
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="xs"
                                                variant="solid"
                                                icon={<HiOutlineEye />}
                                                onClick={() =>
                                                    handleViewDetails(booking)
                                                }
                                                className="cursor-pointer"
                                            >
                                                عرض
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={<HiOutlineChatAlt2 />}
                                                className="cursor-pointer"
                                                disabled
                                            >
                                                محادثة
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                )}
            </Card>

            {selectedBooking && (
                <BookingDetailsModal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false)
                        setSelectedBooking(null)
                    }}
                    booking={selectedBooking}
                />
            )}
        </>
    )
}

