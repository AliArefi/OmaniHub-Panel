import type { Agency } from '@/@types/center'
import { Avatar, Button, Card, Spinner, Table } from '@/components/ui'
import TBody from '@/components/ui/Table/TBody'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import THead from '@/components/ui/Table/THead'
import Tr from '@/components/ui/Table/Tr'
import { getMyAgencies } from '@/services/CenterService'
import { useTranslation } from '@/store/useTranslation'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

export default function Centers() {

    const [agencies, setAgencies] = useState<Agency[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
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
                                        <Link to={`/centers/${agency.slug}/edit`}>
                                            <Button size="xs" variant="solid">
                                                {t('edit') || 'Edit'}
                                            </Button>
                                        </Link>
                                        <a
                                            href={agency.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex"
                                        >
                                            <Button size="xs" variant="default">
                                                {t('view') || 'View'}
                                            </Button>
                                        </a>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>

            </Card>
        </>
    )
}
