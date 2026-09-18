import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import Loading from '@/components/shared/Loading'
import Card from '@/components/ui/Card'
import Chart from '@/components/shared/Chart'
import { Button, Input } from '@/components/ui'
import { apiGetMyAnalyticsOverview, type MyAnalyticsOverviewResponse } from '@/services/AnalyticsService'
import { COLORS } from '@/constants/chart.constant'
import useTranslation from '@/utils/hooks/useTranslation'
import { useSessionUser } from '@/store/authStore'
import {
    HiOutlineCalendar,
    HiOutlineCurrencyDollar,
    HiOutlineEye,
    HiOutlineUsers,
    HiRefresh,
} from 'react-icons/hi'
import StoreStatusBox from './components/StoreStatusBox'
import { useAuth } from '@/auth'
import DashboardHeader from './components/DashboardHeader'

type Preset = '7d' | '30d' | '90d'

const AUTO_REFRESH_INTERVAL_SECONDS = 60

function defaultRange(preset: Preset) {
    const to = dayjs().startOf('day')
    const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
    return {
        from: to.subtract(days - 1, 'day').format('YYYY-MM-DD'),
        to: to.format('YYYY-MM-DD'),
    }
}

function guessTz(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
        return 'UTC'
    }
}

// Memoized KPI card to avoid re-renders on countdown ticks
const KpiCard = ({
    icon,
    iconBg,
    iconColor,
    label,
    value,
    sub,
}: {
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
}) => (
    <Card>
        <div className="flex items-center gap-4 p-1">
            <div
                className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl ${iconBg} ${iconColor}`}
            >
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-sm opacity-60 truncate">{label}</div>
                <div className="text-2xl font-semibold leading-tight">
                    {value}
                    {sub && (
                        <span className="text-base font-normal opacity-60 ml-1">{sub}</span>
                    )}
                </div>
            </div>
        </div>
    </Card>
)

// Memoized top-entity table
const TopTable = ({
    title,
    rows,
    colUnique,
    colViews,
    noDataLabel,
}: {
    title: string
    rows: { id: string | number; title?: string | null; slug?: string | null; unique_visitors: number; pageviews: number }[]
    colUnique: string
    colViews: string
    noDataLabel: string
}) => (
    <Card>
        <h4 className="mb-3">{title}</h4>
        <div className="overflow-auto">
            <table className="w-full text-sm">
                <thead className="opacity-70">
                    <tr>
                        <th className="text-start py-2 font-medium"></th>
                        <th className="text-center py-2 font-medium">{colUnique}</th>
                        <th className="text-center py-2 font-medium">{colViews}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td className="py-4 opacity-60" colSpan={3}>
                                {noDataLabel}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id} className="border-t border-gray-200/30">
                                <td className="py-2">{row.title ?? row.slug ?? row.id}</td>
                                <td className="py-2 text-center tabular-nums">{row.unique_visitors}</td>
                                <td className="py-2 text-center tabular-nums">{row.pageviews}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </Card>
)

const AnalyticDashboard = () => {
    const { t } = useTranslation()
    const currentUserId = useSessionUser((state) => state.user.id)
    const { user } = useAuth()

    const [{ from, to }, setRange] = useState(() => defaultRange('30d'))
    const [tz] = useState<string>(guessTz)
    const [secondsToRefresh, setSecondsToRefresh] = useState(AUTO_REFRESH_INTERVAL_SECONDS)

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

    // Stable refs so the countdown interval never captures stale closures
    const isValidatingRef = useRef(isValidating)
    const mutateRef = useRef(mutate)
    useEffect(() => { isValidatingRef.current = isValidating }, [isValidating])
    useEffect(() => { mutateRef.current = mutate }, [mutate])

    // Reset countdown when date range changes
    useEffect(() => {
        setSecondsToRefresh(AUTO_REFRESH_INTERVAL_SECONDS)
    }, [from, to, tz])

    // Single long-lived interval — no dependency array churn
    useEffect(() => {
        const id = window.setInterval(() => {
            setSecondsToRefresh((s) => {
                if (s <= 1) {
                    if (!isValidatingRef.current) void mutateRef.current()
                    return AUTO_REFRESH_INTERVAL_SECONDS
                }
                return s - 1
            })
        }, 1000)
        return () => window.clearInterval(id)
    }, [])

    const handleRefresh = () => {
        setSecondsToRefresh(AUTO_REFRESH_INTERVAL_SECONDS)
        if (!isValidatingRef.current) void mutateRef.current()
    }

    const chartSeries = useMemo(() => {
        if (!data) return []
        return [
            { name: t('dashboardLegacy.pageviews'), data: data.series.pageviews },
            { name: t('dashboardLegacy.reservations'), data: data.series.reservations },
            { name: t('dashboardLegacy.whatsappClicks'), data: data.series.whatsapp_clicks },
            { name: t('dashboardLegacy.orders'), data: data.series.orders },
        ]
    }, [data, t])

    const firstName = user?.name ? user.name.split(' ')[0] : 'USER'

    return (
        <Loading loading={isLoading}>
            <div className="flex flex-col gap-4 pb-6">

                {/* ── Header ── */}
                <div className="bg-transparent border-0 shadow-none p-0 py-3">
                    <DashboardHeader
                        firstName={firstName}
                        from={from}
                        to={to}
                        secondsToRefresh={secondsToRefresh}
                        isValidating={isValidating}
                        onFromChange={(val) => setRange((r) => ({ ...r, from: val }))}
                        onToChange={(val) => setRange((r) => ({ ...r, to: val }))}
                        onRefresh={handleRefresh}
                    />
                </div>

                {data && (
                    <>
                        {/* ── KPI Cards ── */}
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                            <KpiCard
                                icon={<HiOutlineEye className="w-5 h-5" />}
                                iconBg="bg-primary/10"
                                iconColor="text-primary"
                                label={t('dashboardLegacy.pageviews')}
                                value={data.kpis.pageviews}
                            />
                            <KpiCard
                                icon={<HiOutlineUsers className="w-5 h-5" />}
                                iconBg="bg-emerald-500/10"
                                iconColor="text-emerald-500"
                                label={t('dashboardLegacy.uniqueVisitors')}
                                value={data.kpis.unique_visitors}
                            />
                            <KpiCard
                                icon={<HiOutlineCalendar className="w-5 h-5" />}
                                iconBg="bg-amber-500/10"
                                iconColor="text-amber-500"
                                label={t('dashboardLegacy.reservations')}
                                value={data.kpis.reservations.total}
                            />
                            <KpiCard
                                icon={<HiOutlineCurrencyDollar className="w-5 h-5" />}
                                iconBg="bg-violet-500/10"
                                iconColor="text-violet-500"
                                label={t('dashboardLegacy.ordersRevenue')}
                                value={data.kpis.orders.total}
                                sub={`(${data.kpis.orders.revenue})`}
                            />
                        </div>

                        {/* ── Store status + Chart ── */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <StoreStatusBox />
                            <Card>
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <h4>{t('dashboardLegacy.dailyTrends')}</h4>
                                    <span className="text-xs opacity-60">
                                        {t('dashboardLegacy.from')} {data.range.from} {t('dashboardLegacy.to')} {data.range.to} ({data.range.tz})
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <Chart
                                        type="line"
                                        series={chartSeries}
                                        xAxis={data.series.labels}
                                        height="300px"
                                        customOptions={{
                                            legend: { show: true },
                                            colors: [COLORS[0], COLORS[7], COLORS[8], COLORS[3]],
                                        }}
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* ── Top tables ── */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <TopTable
                                title={t('dashboardLegacy.topAgencies')}
                                rows={data.tops.agencies}
                                colUnique={t('dashboardLegacy.unique')}
                                colViews={t('dashboardLegacy.views')}
                                noDataLabel={t('dashboardLegacy.noData')}
                            />
                            <TopTable
                                title={t('dashboardLegacy.topStores')}
                                rows={data.tops.stores}
                                colUnique={t('dashboardLegacy.unique')}
                                colViews={t('dashboardLegacy.views')}
                                noDataLabel={t('dashboardLegacy.noData')}
                            />
                        </div>
                    </>
                )}
            </div>
        </Loading>
    )
}

export default AnalyticDashboard
