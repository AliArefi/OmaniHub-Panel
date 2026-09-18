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
import useTranslation from '@/utils/hooks/useTranslation'
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
import { resolveImageUrl } from '@/utils/imageUrl'
import { HiPlus } from 'react-icons/hi'
import i18n from '@/locales'

// ─── Status helpers ──────────────────────────────────────────────────────────

type AgencyStatus = 'published' | 'rejected' | 'pending' | string

const STATUS_LABELS: Record<AgencyStatus, string> = {
    published: 'centers.statusPublished',
    rejected: 'centers.statusRejected',
    pending: 'centers.statusPending',
}

const STATUS_CLASSES: Record<AgencyStatus, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
}

const MOCK_STATUS_REASON: Record<AgencyStatus, string> = {
    published: 'centers.reasonPublished',
    rejected: 'centers.reasonRejected',
    pending: 'centers.reasonPending',
}

function statusLabel(status: AgencyStatus) {
    return STATUS_LABELS[status] ? i18n.t(STATUS_LABELS[status]) : status
}

function statusClass(status: AgencyStatus) {
    return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

function statusReason(status: AgencyStatus) {
    return i18n.t(MOCK_STATUS_REASON[status] || 'centers.reasonDefault')
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
    const { t } = useTranslation()
    const [reason, setReason] = useState('')

    useEffect(() => {
        if (isOpen) setReason('')
    }, [isOpen])

    return (
        <ConfirmDialog
            type="danger"
            isOpen={isOpen}
            title={t('centers.deleteTitle')}
            confirmText={t('centers.delete')}
            cancelText={t('centers.cancel')}
            confirmButtonProps={{
                loading,
                disabled: !reason.trim(),
            }}
            onClose={onClose}
            onCancel={onClose}
            onConfirm={() => onConfirm(reason)}
        >
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {t('centers.deleteMessage')}
            </p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('centers.deleteReason')} <span className="text-red-500">*</span>
            </label>
            <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('centers.deleteReasonPlaceholder')}
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
    const { t } = useTranslation()
    const isPublished = agency.status === 'published'

    const desktopActions = (
        <div className="hidden sm:flex items-center justify-center gap-1 flex-wrap">
            <Tooltip title={t('centers.edit')}>
                <Button
                    size="xs"
                    variant="plain"
                    className="flex items-center gap-1"
                    onClick={() => onView(agency.slug)}
                >
                    <TbEdit size={15} />
                    <span className="hidden md:inline">{t('centers.edit')}</span>
                </Button>
            </Tooltip>

            <Tooltip
                title={
                    isPublished
                        ? t('centers.viewPublic')
                        : t('centers.viewPrivate')
                }
            >
                <Button
                    size="xs"
                    variant="plain"
                    className="flex items-center gap-1"
                    onClick={() => window.open(`https://omanihub.com/${agency.slug}`, '_blank', 'noopener,noreferrer')}
                >
                    <TbEye size={15} />
                    <span className="hidden md:inline">{t('centers.view')}</span>
                    {!isPublished && (
                        <TbAlertCircle size={13} className="text-amber-500" />
                    )}
                </Button>
            </Tooltip>

            {isPublished && (
                <>
                    <Tooltip title={t('centers.bookings')}>
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
                            <span className="hidden md:inline">{t('centers.bookings')}</span>
                        </Button>
                    </Tooltip>

                    <Tooltip title={t('centers.statistics')}>
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
                            <span className="hidden md:inline">{t('centers.statistics')}</span>
                        </Button>
                    </Tooltip>
                </>
            )}

            <Tooltip title={t('centers.deleteCenter')}>
                <Button
                    size="xs"
                    variant="plain"
                    className="flex items-center gap-1 hover:text-red-500"
                    loading={deletingSlug === agency.slug}
                    onClick={() => onDeleteRequest(agency.slug)}
                >
                    <TbTrash size={15} />
                    <span className="hidden md:inline">{t('centers.delete')}</span>
                </Button>
            </Tooltip>
        </div>
    )

    const mobileActions = (
        <div className="flex sm:hidden items-center justify-center">
            <Dropdown title={t('centers.operations')}>
                <Dropdown.Item
                    onSelect={() => onSelect(`/centers/${agency.slug}/view`)}
                >
                    <TbEdit size={16} /> {t('centers.edit')}
                </Dropdown.Item>

                <Dropdown.Item onSelect={() => onView(agency.slug)}>
                    <TbEye size={16} /> {t('centers.view')}
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
                            <TbCalendar size={16} /> {t('centers.bookings')}
                        </Dropdown.Item>

                        <Dropdown.Item
                            onSelect={() =>
                                onSelect(
                                    `/centers/${encodeURIComponent(agency.slug)}/stats`,
                                )
                            }
                        >
                            <TbChartBar size={16} /> {t('centers.statistics')}
                        </Dropdown.Item>
                    </>
                )}

                <Dropdown.Item onClick={() => onDeleteRequest(agency.slug)}>
                    <TbTrash size={16} className="text-red-500" />
                    <span className="text-red-500">{t('centers.deleteCenter')}</span>
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

// ─── Mobile card for a single agency ─────────────────────────────────────────

function AgencyCard({
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
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3">
            <ActionLink
                to={`/centers/${agency.slug}/view`}
                className="no-underline hover:no-underline group"
            >
                <div className="flex items-center gap-3">
                    <Avatar src={resolveImageUrl(agency.logo)} />
                    <div className="font-bold heading-text group-hover:text-primary transition-colors">
                        {agency.title}
                    </div>
                </div>
            </ActionLink>

            {/* Status */}
            <StatusBadge status={agency.status} />

            {/* Actions */}
            <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                <AgencyActions
                    agency={agency}
                    deletingSlug={deletingSlug}
                    onView={onView}
                    onSelect={onSelect}
                    onDeleteRequest={onDeleteRequest}
                />
            </div>
        </div>
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
                setError(apiMessage || t('centers.loadError'))
            } finally {
                setLoading(false)
            }
        }
        fetchAgencies()
    }, [t])

    const handleDelete = async (slug: string, reason: string) => {
        setDeletingSlug(slug)
        try {
            const resp = await apiDeleteMyAgency(slug)
            if (!resp?.success) throw new Error(resp?.message || t('centers.deleteFailed'))
            setAgencies((prev) => prev.filter((a) => a.slug !== slug))
            toast.push(
                <Notification type="success">
                    {resp?.message || t('centers.deleteSuccess')}
                </Notification>,
            )
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('centers.deleteFailed')
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
                <div>{t('centers.loading')}</div>
            </div>
        )
    if (error) return <div>{error}</div>

    return (
        <>
            <Card>
                <div className="mb-10">
                    <h2 className="mb-2">{t('centers.title')}</h2>
                    <p>{t('centers.subtitle')}</p>
                </div>

                {/* ── Mobile: card list (hidden on sm+) ── */}
                <div className="flex flex-col gap-3 sm:hidden">
                    {agencies.length > 0 ?
                        (
                            agencies.map((agency) => (
                                <AgencyCard
                                    key={agency.id}
                                    agency={agency}
                                    deletingSlug={deletingSlug}
                                    onView={onView}
                                    onSelect={onSelect}
                                    onDeleteRequest={setConfirmDeleteSlug}
                                />
                            ))
                        )
                        :
                        (
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3">
                                <Button
                                    variant="solid"
                                    className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                                    size='sm'
                                    icon={<HiPlus />}
                                    onClick={() => navigate('/new-center')}
                                >
                                    {t('centers.create')}
                                </Button>
                            </div>
                        )


                    }
                </div>

                {/* ── Desktop: table (hidden below sm) ── */}
                <div className="hidden sm:block">
                    <Table>
                        <THead>
                            <Tr>
                                <Th>{t('centers.center')}</Th>
                                <Th>{t('centers.status')}</Th>
                                <Th className="text-center">{t('centers.actions')}</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {

                                agencies.length > 0 ?
                                    (
                                        agencies.map((agency) => (
                                            <Tr key={agency.id}>
                                                <Td>
                                                    <ActionLink
                                                        to={`/centers/${agency.slug}/view`}
                                                        className="no-underline hover:no-underline group"
                                                    >
                                                        <div className="flex items-center justify-start gap-2">
                                                            <Avatar src={resolveImageUrl(agency.logo)} />
                                                            <Tooltip title={t('centers.viewEdit')}>
                                                                <div className="font-bold heading-text hover:text-primary group-hover:text-primary">
                                                                    {agency.title}
                                                                </div>
                                                            </Tooltip>
                                                        </div>
                                                    </ActionLink>
                                                </Td>
                                                <Td>
                                                    <StatusBadge status={agency.status} />
                                                </Td>
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
                                        ))
                                    )
                                    :
                                    (
                                        <Tr>
                                            <Td colSpan={3} className='text-center space-y-4'>
                                                <div className="flex-1 text-center space-y-1">
                                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {t('centers.emptyTitle')}
                                                    </h2>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {t('centers.emptyDescription')}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="solid"
                                                    size='sm'
                                                    className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                                                    icon={<HiPlus />}
                                                    onClick={() => navigate('/new-center')}
                                                >
                                                    {t('centers.create')}
                                                </Button>
                                            </Td>
                                        </Tr>
                                    )
                            }
                        </TBody>
                    </Table>
                </div>
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
