import type { Agency } from '@/@types/center'
import { Avatar, Button, Card, Spinner, Table } from '@/components/ui'
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
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

export default function Centers() {

    const [agencies, setAgencies] = useState<Agency[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
    const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null)
    const { t } = useTranslation()

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
                    if (typeof response !== 'object' || response === null)
                        return undefined
                    const data = (response as { data?: unknown }).data
                    if (typeof data !== 'object' || data === null) return undefined
                    const message = (data as { message?: unknown }).message
                    return typeof message === 'string' && message.trim()
                        ? message
                        : undefined
                })()
                setError(apiMessage || 'حدث خطأ أثناء تحميل المراكز')
            } finally {
                setLoading(false)
            }
        }

        fetchAgencies()
    }, [])

    const handleDelete = async (slug: string) => {
        setDeletingSlug(slug)
        try {
            const resp = await apiDeleteMyAgency(slug)
            if (!resp?.success) {
                throw new Error(resp?.message || 'فشل حذف المركز')
            }

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

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
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
                            <Th>{t('operation')}</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {agencies.map((agency) => (
                            <Tr key={agency.id}>
                                <Td>
                                    <div className="flex items-center justify-start gap-2">
                                        <Avatar src={agency.logo} />
                                        <div className="font-bold">{agency.title}</div>
                                    </div>
                                </Td>
                                <Td>{agency.status}</Td>
                                <Td>
                                    <div className="flex items-center justify-end gap-2">
                                        <Link to={`/centers/${agency.slug}/reservations`}>
                                            <Button size="xs" variant="plain" className='bg-blue-400 text-white'>
                                                {t('reservations') || 'Reservations'}
                                            </Button>
                                        </Link>
                                        <Link to={`/centers/${agency.slug}/edit`}>
                                            <Button size="xs" variant="solid">
                                                {t('edit') || 'Edit'}
                                            </Button>
                                        </Link>
                                        {agency.status === 'published' && (
                                            <a
                                                href={`https://omanihub.com/${agency.slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex"
                                            >
                                                <Button size="xs" variant="default">
                                                    {t('view') || 'View'}
                                                </Button>
                                            </a>
                                        )}
                                        
                                        <Button
                                            size="xs"
                                            variant="default"
                                            className='text-red-500'
                                            loading={deletingSlug === agency.slug}
                                            onClick={() => setConfirmDeleteSlug(agency.slug)}
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>

            </Card>

            <ConfirmDialog
                type="danger"
                isOpen={Boolean(confirmDeleteSlug)}
                onClose={() => setConfirmDeleteSlug(null)}
                title="تأكيد الحذف"
                confirmText="حذف"
                cancelText="إلغاء"
                confirmButtonProps={{ loading: deletingSlug === confirmDeleteSlug }}
                onCancel={() => setConfirmDeleteSlug(null)}
                onConfirm={() => {
                    if (!confirmDeleteSlug) return
                    const slug = confirmDeleteSlug
                    setConfirmDeleteSlug(null)
                    handleDelete(slug)
                }}
            >
                هل أنت متأكد من حذف هذا المركز؟ لا يمكن التراجع عن هذا الإجراء.
            </ConfirmDialog>
        </>
    )
}
