import type { Agency } from '@/@types/center'
import {
    Avatar,
    Button,
    Card,
    Dropdown,
    Spinner,
    Table,
    Tooltip,
} from '@/components/ui'
import TBody from '@/components/ui/Table/TBody'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import THead from '@/components/ui/Table/THead'
import Tr from '@/components/ui/Table/Tr'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { apiDeleteMyAgency, getMyAgencies } from '@/services/CenterService'
import { useTranslation } from '@/store/useTranslation'
import { resolveImageUrl } from '@/utils/imageUrl'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ActionLink } from '@/components/shared'
import {
    TbCalendar,
    TbChartBar,
    TbEdit,
    TbEye,
    TbTrash,
    TbAlertCircle,
    TbExternalLink,
} from 'react-icons/tb'

// ─── Status helpers ──────────────────────────────────────────────────────────

type AgencyStatus = 'published' | 'rejected' | 'pending' | string

const STATUS_LABELS: Record<AgencyStatus, string> = {
    published: 'منشورة',
    rejected:  'مرفوضة',
    pending:   'قيد المراجعة',
}

const STATUS_CLASSES: Record<AgencyStatus, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    rejected:  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    pending:   'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
}

// Mock reason until backend provides one per agency
const MOCK_STATUS_REASON: Record<AgencyStatus, string> = {
    published: 'تمت مراجعة الحجرة واعتمادها من قِبل فريق عُمانيهاب.',
    rejected:  'تم رفض الحجرة بسبب نقص في المعلومات. يرجى مراجعة البيانات وإعادة التقديم.',
    pending:   'حجرتك قيد المراجعة من قِبل كارشناس عُمانيهاب. سيتم إشعارك فور اتخاذ القرار.',
}

function statusLabel(status: AgencyStatus) {
    return STATUS_LABELS[status] ?? status
}

function statusClass(status: AgencyStatus) {
    return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

function statusReason(status: AgencyStatus) {
    return MOCK_STATUS_REASON[status] ?? 'لا توجد ملاحظات إضافية.'
}

// ─── Delete confirm dialog with reason ───────────────────────────────────────

function DeleteWithReasonDialog({
    isOpen,
    loading,
    onClose,
    onConfirm,
}: {
    isOpen: boolean
    loading: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
}) {
    const [reason, setReason] = useState('')

    // Reset reason each time dialog opens
    useEffect(() => {
        if (isOpen) setReason('')
    }, [isOpen])

    return (
        <ConfirmDialog
            type="danger"
            isOpen={isOpen}
            title="تأكيد الحذف"
            confirmText="حذف"
            cancelText="إلغاء"
            confirmButtonProps={{
                loading,
                disabled: !reason.trim(),
            }}
            onClose={onClose}
            onCancel={onClose}
            onConfirm={() => onConfirm(reason)}
        >
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                هل أنت متأكد من حذف هذا المركز؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                سبب الحذف <span className="text-red-500">*</span>
            </label>
            <textarea
                dir="rtl"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سبب الحذف هنا..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
        </ConfirmDialog>
    )
}

// ─── Status badge with tooltip ────────────────────────────────────────────────

function StatusBadge({ status }: { status: AgencyStatus }) {
    return (
        <div className="flex items-center gap-1.5">
            <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusClass(status)}`}
            >
                {statusLabel(status)}
            </span>
            <Tooltip title={statusReason(status)}>
                <span className="cursor-help text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <TbAlertCircle size={16} />
                </span>
            </Tooltip>
        </div>
    )
}

// ─── Action buttons (desktop) / dropdown (mobile) ────────────────────────────

function AgencyActions({
    agency,
    deletingSlug,
    onView,
    onSelect,
    onDeleteRequest,
}: {
    agency: Agency
    deletingSlug: string | null
    onView: (slug: string) => void
    onSelect: (url: string) => void
    onDeleteRequest: (slug: string) => void
}) {
    const isPublished = agency.status === 'published'

    // Desktop: inline buttons
    const desktopActions = (
        <div className="hidden sm:flex items-center justify-center gap-1 flex-wrap">
            {/* Edit */}
            <Tooltip title="تعديل الحجرة">
                <Button
                    size="xs"
                    variant="plain"
                    className="flex items-center gap-1"
                    onClick={() => onSelect(`/centers/${agency.slug}/edit`)}
                >
                    <TbEdit size={15} />
                    <span className="hidden md:inline">تعديل</span>
                </Button>
            </Tooltip>

            {/* View — with note for non-published */}
            <Tooltip
                title={
                    isPublished
                        ? 'عرض الحجرة على الموقع'
                        : 'قبل تأكيد كارشناس عُمانيهاب، يمكنك فقط أنت رؤية الحجرة بعد تسجيل الدخول'
                }
            >
                <Button
                    size="xs"
                    variant="plain"
                    className="flex items-center gap-1"
                    onClick={() => onView(agency.slug)}
                >
                    <TbEye size={15} />
                    <span className="hidden md:inline">عرض</span>
                    {!isPublished && (
                        <TbAlertCircle size={13} className="text-amber-500" />
                    )}
                </Button>
            </Tooltip>

            {/* Published-only actions */}
            {isPublished && (
                <>
                    <Tooltip title="الحجوزات">
                        <Button
                            size="xs"
                            variant="plain"
                            className="flex items-center gap-1"
                            onClick={() =>
                                onSelect(
                                    `/bookings?agencySlug=${encodeURIComponent(agency.slug)}`,
                                )
                            }
                        >
                            <TbCalendar size={15} />
                            <span className="hidden md:inline">حجوزات</span>
                        </Button>
                    </Tooltip>

                    <Tooltip title="إحصائيات">
                        <Button
                            size="xs"
                            variant="plain"
                            className="flex items-center gap-1"
                            onClick={() =>
                                onSelect(
                                    `/centers/${encodeURIComponent(agency.slug)}/stats`,
                                )
                            }
                        >
                            <TbChartBar size={15} />
                            <span className="hidden md:inline">إحصائيات</span>
                        </Button>
                    </Tooltip>
                </>
            )}

            {/* Delete */}
            <Tooltip title="حذف الحجرة">
                <Button
                    size="xs"
                    variant="plain"
                    className="flex items-center gap-1 hover:text-red-500"
                    loading={deletingSlug === agency.slug}
                    onClick={() => onDeleteRequest(agency.slug)}
                >
                    <TbTrash size={15} />
                    <span className="hidden md:inline">حذف</span>
                </Button>
            </Tooltip>
        </div>
    )

    // Mobile: dropdown
    const mobileActions = (
        <div className="flex sm:hidden items-center justify-center">
            <Dropdown title="العمليات">
                <Dropdown.Item
                    onSelect={() => onSelect(`/centers/${agency.slug}/view`)}
                >
                    <TbEdit size={16} /> تعديل الحجرة
                </Dropdown.Item>

                <Dropdown.Item onSelect={() => onView(agency.slug)}>
                    <TbEye size={16} /> عرض
                    {!isPublished && (
                        <TbAlertCircle
                            size={13}
                            className="text-amber-500 ml-1"
                        />
                    )}
                </Dropdown.Item>

                {isPublished && (
                    <>
                        <Dropdown.Item
                            onSelect={() =>
                                onSelect(
                                    `/bookings?agencySlug=${encodeURIComponent(agency.slug)}`,
                                )
                            }
                        >
                            <TbCalendar size={16} /> الحجوزات
                        </Dropdown.Item>

                        <Dropdown.Item
                            onSelect={() =>
                                onSelect(
                                    `/centers/${encodeURIComponent(agency.slug)}/stats`,
                                )
                            }
                        >
                            <TbChartBar size={16} /> إحصائيات
                        </Dropdown.Item>
                    </>
                )}

                <Dropdown.Item onClick={() => onDeleteRequest(agency.slug)}>
                    <TbTrash size={16} className="text-red-500" />
                    <span className="text-red-500">حذف الحجرة</span>
                </Dropdown.Item>
            </Dropdown>
        </div>
    )

    return (
        <>
            {desktopActions}
            {mobileActions}
        </>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Centers() {
    const [agencies, setAgencies] = useState<Agency[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
    const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null)
    const { t } = useTranslation()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchAgencies = async () => {
            setLoading(true)
            try {
                const resp = await getMyAgencies()
                setAgencies(resp.data)
            } catch (err: unknown) {
                const apiMessage = (() => {
                    if (typeof err !== 'object' || err === null) return undefined
                    const response = (err as { response?: unknown }).response
                    if (typeof response !== 'object' || response === null) return undefined
                    const data = (response as { data?: unknown }).data
                    if (typeof data !== 'object' || data === null) return undefined
                    const message = (data as { message?: unknown }).message
                    return typeof message === 'string' && message.trim() ? message : undefined
                })()
                setError(apiMessage || 'حدث خطأ أثناء تحميل المراكز')
            } finally {
                setLoading(false)
            }
        }
        fetchAgencies()
    }, [])

    const handleDelete = async (slug: string, reason: string) => {
        setDeletingSlug(slug)
        try {
            // `reason` will be wired to the API once the backend is ready
            const resp = await apiDeleteMyAgency(slug)
            if (!resp?.success) throw new Error(resp?.message || 'فشل حذف المركز')
            setAgencies((prev) => prev.filter((a) => a.slug !== slug))
            toast.push(
                <Notification type="success">
                    {resp?.message || 'تم حذف المركز بنجاح'}
                </Notification>,
            )
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'فشل حذف المركز'
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setDeletingSlug(null)
        }
    }

    const onView = (slug: string) => navigate(`/centers/${slug}/view`)
    const onSelect = (url: string) => navigate(url)

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col gap-2">
                <Spinner />
                <div>{t('loading')}</div>
            </div>
        )
    if (error) return <div>{error}</div>

    return (
        <>
            <Card>
                <div className="mb-10">
                    <h2 className="mb-2">{t('myAgenciesTitle')}</h2>
                    <p>{t('myAgenciesSubtitle')}</p>
                </div>
                <Table>
                    <THead>
                        <Tr>
                            <Th>{t('myAgenciesHojra')}</Th>
                            <Th>{t('status')}</Th>
                            <Th className="text-center">{t('operation')}</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {agencies.map((agency) => (
                            <Tr key={agency.id}>
                                {/* Agency name + logo */}
                                <Td>
                                    <ActionLink
                                        to={`/centers/${agency.slug}/view`}
                                        className="no-underline hover:no-underline group"
                                    >
                                        <div className="flex items-center justify-start gap-2">
                                            <Avatar src={resolveImageUrl(agency.logo)} />
                                            <Tooltip title="عرض وتعديل الحُجرة">
                                                <div className="font-bold heading-text hover:text-primary group-hover:text-primary">
                                                    {agency.title}
                                                </div>
                                            </Tooltip>
                                        </div>
                                    </ActionLink>
                                </Td>

                                {/* Status badge + reason tooltip */}
                                <Td>
                                    <StatusBadge status={agency.status} />
                                </Td>

                                {/* Actions */}
                                <Td>
                                    <AgencyActions
                                        agency={agency}
                                        deletingSlug={deletingSlug}
                                        onView={onView}
                                        onSelect={onSelect}
                                        onDeleteRequest={setConfirmDeleteSlug}
                                    />
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            </Card>

            <DeleteWithReasonDialog
                isOpen={Boolean(confirmDeleteSlug)}
                loading={deletingSlug === confirmDeleteSlug}
                onClose={() => setConfirmDeleteSlug(null)}
                onConfirm={(reason) => {
                    if (!confirmDeleteSlug) return
                    const slug = confirmDeleteSlug
                    setConfirmDeleteSlug(null)
                    handleDelete(slug, reason)
                }}
            />
        </>
    )
}
