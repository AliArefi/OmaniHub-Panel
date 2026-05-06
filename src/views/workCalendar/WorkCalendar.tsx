import { Agency } from '@/@types/center'
import { Card, FormItem, Select, Spinner } from '@/components/ui'
import { getMyAgencies } from '@/services/CenterService'
import { useTranslation } from '@/store/useTranslation'
import { useEffect, useState } from 'react'
import { AgencyCalendar } from './components/AgencyCalendar'

export default function WorkCalendar() {
    const [agencies, setAgencies] = useState<Agency[]>([])
    const [selectedSlug, setSelectedSlug] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { t } = useTranslation()

    useEffect(() => {
        const fetchAgencies = async () => {
            setLoading(true)
            try {
                const resp = await getMyAgencies()
                setAgencies(resp.data)
                if (resp.data.length > 0) {
                    setSelectedSlug(resp.data[0].slug)
                }
            } catch (err: unknown) {
                const apiMessage = (() => {
                    if (typeof err !== 'object' || err === null)
                        return undefined
                    const response = (err as { response?: unknown }).response
                    if (typeof response !== 'object' || response === null)
                        return undefined
                    const data = (response as { data?: unknown }).data
                    if (typeof data !== 'object' || data === null)
                        return undefined
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

    type AgencyOption = {
        label: string
        value: string
    }

    const agencyOptions: AgencyOption[] = agencies.map((agency) => ({
        label: agency.title,
        value: agency.slug,
    }))

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>{t('loading')}</div>
            </div>
        )
    if (error) return <div>{error}</div>

    return (
        <div>
            <Card>
                <FormItem label="حجرة" className="mb-6">
                    <Select
                        size="sm"
                        placeholder="اختر حجرة"
                        options={agencyOptions}
                        value={agencyOptions.find(
                            (opt) => opt.value === selectedSlug,
                        )}
                        onChange={(opt) => setSelectedSlug(opt?.value || '')}
                    />
                </FormItem>
            </Card>
            {!loading && selectedSlug && (
                <div className="mt-3">
                    <AgencyCalendar slug={selectedSlug} />
                </div>
            )}
        </div>
    )
}