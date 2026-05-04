import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import Loading from '@/components/shared/Loading'
import Card from '@/components/ui/Card'
import Chart from '@/components/shared/Chart'
import { Button, Input, Select } from '@/components/ui'
import { apiGetMyAnalyticsOverview, type MyAnalyticsOverviewResponse } from '@/services/AnalyticsService'
import { COLORS } from '@/constants/chart.constant'
import { useTranslation } from '@/store/useTranslation'
import { useSessionUser } from '@/store/authStore'

type Preset = '7d' | '30d' | '90d'

const AUTO_REFRESH_INTERVAL_SECONDS = 60

function defaultRange(preset: Preset) {
    const to = dayjs().startOf('day')
    const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
    const from = to.subtract(days - 1, 'day')
    return { from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD') }
}

function guessTz(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
        return 'UTC'
    }
}

const AnalyticDashboard = () => {
    const { t } = useTranslation()
    const currentUserId = useSessionUser((state) => state.user.id)
    const [preset, setPreset] = useState<Preset>('30d')
    const [tz, setTz] = useState<string>(guessTz())
    const [{ from, to }, setRange] = useState(() => defaultRange('30d'))
    const [secondsToRefresh, setSecondsToRefresh] = useState<number>(
        AUTO_REFRESH_INTERVAL_SECONDS,
    )

    const params = useMemo(() => ({ from, to, tz }), [from, to, tz])

    const { data, isLoading, isValidating, mutate } =
        useSWR<MyAnalyticsOverviewResponse>(
        ['my-analytics-overview', currentUserId, params],
        () => apiGetMyAnalyticsOverview(params),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const isValidatingRef = useRef(isValidating)
    useEffect(() => {
        isValidatingRef.current = isValidating
    }, [isValidating])

    const mutateRef = useRef(mutate)
    useEffect(() => {
        mutateRef.current = mutate
    }, [mutate])

    useEffect(() => {
        setSecondsToRefresh(AUTO_REFRESH_INTERVAL_SECONDS)
    }, [from, to, tz])

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setSecondsToRefresh((current) => {
                if (current <= 1) {
                    if (!isValidatingRef.current) {
                        void mutateRef.current()
                    }
                    return AUTO_REFRESH_INTERVAL_SECONDS
                }
                return current - 1
            })
        }, 1000)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [])

    const onApplyPreset = (p: Preset) => {
        setPreset(p)
        setRange(defaultRange(p))
        setSecondsToRefresh(AUTO_REFRESH_INTERVAL_SECONDS)
        void mutate()
    }

    const chartSeries = useMemo(() => {
        if (!data) return []
        return [
            { name: t('pageviews'), data: data.series.pageviews },
            { name: t('reservations'), data: data.series.reservations },
            { name: t('whatsappClicks'), data: data.series.whatsapp_clicks },
            { name: t('orders'), data: data.series.orders },
        ]
    }, [data, t])

    return (
        <Loading loading={isLoading}>
            <div className="flex flex-col gap-4">
                <Card>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div>
                            <h3 className="mb-1">
                                {t('businessAnalyticsTitle')}
                            </h3>
                            <div className="text-sm opacity-60">
                                {t('businessAnalyticsSubtitle')}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:items-end">
                            <div className="flex items-center justify-end gap-3">
                                <div className="text-xs opacity-60 whitespace-nowrap">
                                    {t('autoRefreshIn')} {secondsToRefresh}
                                    {t('secondsShort')}
                                </div>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    loading={isValidating}
                                    onClick={() => {
                                        setSecondsToRefresh(
                                            AUTO_REFRESH_INTERVAL_SECONDS,
                                        )
                                        if (!isValidatingRef.current) {
                                            void mutateRef.current()
                                        }
                                    }}
                                >
                                    {t('refresh')}
                                </Button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 md:items-end">
                                <div className="min-w-[150px]">
                                    <label className="text-sm opacity-70">
                                        {t('preset')}
                                    </label>
                                    <Select
                                        value={preset}
                                        options={[
                                            {
                                                label: t('last7Days'),
                                                value: '7d',
                                            },
                                            {
                                                label: t('last30Days'),
                                                value: '30d',
                                            },
                                            {
                                                label: t('last90Days'),
                                                value: '90d',
                                            },
                                        ]}
                                        onChange={(v) =>
                                            onApplyPreset(v as Preset)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="text-sm opacity-70">
                                        {t('from')}
                                    </label>
                                    <Input
                                        type="date"
                                        value={from}
                                        onChange={(e) =>
                                            setRange((r) => ({
                                                ...r,
                                                from: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="text-sm opacity-70">
                                        {t('to')}
                                    </label>
                                    <Input
                                        type="date"
                                        value={to}
                                        onChange={(e) =>
                                            setRange((r) => ({
                                                ...r,
                                                to: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="min-w-[220px]">
                                    <label className="text-sm opacity-70">
                                        {t('timezone')}
                                    </label>
                                    <Input
                                        value={tz}
                                        placeholder="UTC"
                                        onChange={(e) => setTz(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {data && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <Card>
                                <div className="text-sm opacity-60">
                                    {t('pageviews')}
                                </div>
                                <div className="text-2xl font-semibold">{data.kpis.pageviews}</div>
                            </Card>
                            <Card>
                                <div className="text-sm opacity-60">
                                    {t('uniqueVisitors')}
                                </div>
                                <div className="text-2xl font-semibold">{data.kpis.unique_visitors}</div>
                            </Card>
                            <Card>
                                <div className="text-sm opacity-60">
                                    {t('reservations')}
                                </div>
                                <div className="text-2xl font-semibold">{data.kpis.reservations.total}</div>
                            </Card>
                            <Card>
                                <div className="text-sm opacity-60">
                                    {t('ordersRevenue')}
                                </div>
                                <div className="text-2xl font-semibold">
                                    {data.kpis.orders.total} ({data.kpis.orders.revenue})
                                </div>
                            </Card>
                        </div>

                        <Card className="h-full">
                            <div className="flex items-center justify-between">
                                <h4>{t('dailyTrends')}</h4>
                                <div className="text-sm opacity-60">
                                    {t('from')} {data.range.from} {t('to')} {data.range.to} ({data.range.tz})
                                </div>
                            </div>
                            <div className="mt-4">
                                <Chart
                                    type="line"
                                    series={chartSeries}
                                    xAxis={data.series.labels}
                                    height="360px"
                                    customOptions={{
                                        legend: { show: true },
                                        colors: [COLORS[0], COLORS[7], COLORS[8], COLORS[3]],
                                    }}
                                />
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <Card>
                                <h4 className="mb-3">{t('topAgencies')}</h4>
                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="opacity-70">
                                            <tr>
                                                <th className="text-left py-2">{t('title')}</th>
                                                <th className="text-right py-2">{t('unique')}</th>
                                                <th className="text-right py-2">{t('views')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.tops.agencies.map((row) => (
                                                <tr key={row.id} className="border-t border-gray-200/30">
                                                    <td className="py-2">{row.title ?? row.slug ?? row.id}</td>
                                                    <td className="py-2 text-right">{row.unique_visitors}</td>
                                                    <td className="py-2 text-right">{row.pageviews}</td>
                                                </tr>
                                            ))}
                                            {data.tops.agencies.length === 0 && (
                                                <tr>
                                                    <td className="py-4 opacity-60" colSpan={3}>
                                                        {t('noData')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            <Card>
                                <h4 className="mb-3">{t('topStores')}</h4>
                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="opacity-70">
                                            <tr>
                                                <th className="text-left py-2">{t('title')}</th>
                                                <th className="text-right py-2">{t('unique')}</th>
                                                <th className="text-right py-2">{t('views')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.tops.stores.map((row) => (
                                                <tr key={row.id} className="border-t border-gray-200/30">
                                                    <td className="py-2">{row.title ?? row.slug ?? row.id}</td>
                                                    <td className="py-2 text-right">{row.unique_visitors}</td>
                                                    <td className="py-2 text-right">{row.pageviews}</td>
                                                </tr>
                                            ))}
                                            {data.tops.stores.length === 0 && (
                                                <tr>
                                                    <td className="py-4 opacity-60" colSpan={3}>
                                                        {t('noData')}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </Loading>
    )
}

export default AnalyticDashboard
