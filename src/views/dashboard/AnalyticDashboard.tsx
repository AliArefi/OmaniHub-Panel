import { useMemo, useState } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import Loading from '@/components/shared/Loading'
import Card from '@/components/ui/Card'
import Chart from '@/components/shared/Chart'
import { Button, Input, Select } from '@/components/ui'
import { apiGetMyAnalyticsOverview, type MyAnalyticsOverviewResponse } from '@/services/AnalyticsService'
import { COLORS } from '@/constants/chart.constant'

type Preset = '7d' | '30d' | '90d'

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
    const [preset, setPreset] = useState<Preset>('30d')
    const [tz, setTz] = useState<string>(guessTz())
    const [{ from, to }, setRange] = useState(() => defaultRange('30d'))

    const params = useMemo(() => ({ from, to, tz }), [from, to, tz])

    const { data, isLoading, mutate } = useSWR<MyAnalyticsOverviewResponse>(
        ['my-analytics-overview', params],
        () => apiGetMyAnalyticsOverview(params),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const onApplyPreset = (p: Preset) => {
        setPreset(p)
        setRange(defaultRange(p))
        void mutate()
    }

    const chartSeries = useMemo(() => {
        if (!data) return []
        return [
            { name: 'مشاهدات الصفحة', data: data.series.pageviews },
            { name: 'الحجوزات', data: data.series.reservations },
            { name: 'نقرات واتساب', data: data.series.whatsapp_clicks },
            { name: 'الطلبات', data: data.series.orders },
        ]
    }, [data])

    return (
        <Loading loading={isLoading}>
            <div className="flex flex-col gap-4">
                <Card>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div>
                            <h3 className="mb-1">تحليلات الأعمال</h3>
                            <div className="text-sm opacity-60">
                                مشاهدات يومية فريدة مع مؤشرات الأداء الخاصة بالمالك
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-3 md:items-end">
                            <div className="min-w-[150px]">
                                <label className="text-sm opacity-70">الفترة</label>
                                <Select
                                    value={preset}
                                    onChange={(v) => onApplyPreset(v as Preset)}
                                    options={[
                                        { label: 'آخر 7 أيام', value: '7d' },
                                        { label: 'آخر 30 يومًا', value: '30d' },
                                        { label: 'آخر 90 يومًا', value: '90d' },
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="text-sm opacity-70">من</label>
                                <Input
                                    type="date"
                                    value={from}
                                    onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="text-sm opacity-70">إلى</label>
                                <Input
                                    type="date"
                                    value={to}
                                    onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                                />
                            </div>

                            <div className="min-w-[220px]">
                                <label className="text-sm opacity-70">المنطقة الزمنية</label>
                                <Input
                                    value={tz}
                                    onChange={(e) => setTz(e.target.value)}
                                    placeholder="UTC"
                                />
                            </div>

                            <Button variant="solid" onClick={() => void mutate()}>
                                تحديث
                            </Button>
                        </div>
                    </div>
                </Card>

                {data && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <Card>
                                <div className="text-sm opacity-60">مشاهدات الصفحة</div>
                                <div className="text-2xl font-semibold">{data.kpis.pageviews}</div>
                            </Card>
                            <Card>
                                <div className="text-sm opacity-60">زوار فريدون</div>
                                <div className="text-2xl font-semibold">{data.kpis.unique_visitors}</div>
                            </Card>
                            <Card>
                                <div className="text-sm opacity-60">الحجوزات</div>
                                <div className="text-2xl font-semibold">{data.kpis.reservations.total}</div>
                            </Card>
                            <Card>
                                <div className="text-sm opacity-60">الطلبات (الإيراد)</div>
                                <div className="text-2xl font-semibold">
                                    {data.kpis.orders.total} ({data.kpis.orders.revenue})
                                </div>
                            </Card>
                        </div>

                        <Card className="h-full">
                            <div className="flex items-center justify-between">
                                <h4>الاتجاهات اليومية</h4>
                                <div className="text-sm opacity-60">
                                    {data.range.from} إلى {data.range.to} ({data.range.tz})
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
                                <h4 className="mb-3">أفضل الوكالات</h4>
                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="opacity-70">
                                            <tr>
                                                <th className="text-left py-2">العنوان</th>
                                                <th className="text-right py-2">فريد</th>
                                                <th className="text-right py-2">المشاهدات</th>
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
                                                        لا توجد بيانات
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            <Card>
                                <h4 className="mb-3">أفضل المتاجر</h4>
                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="opacity-70">
                                            <tr>
                                                <th className="text-left py-2">العنوان</th>
                                                <th className="text-right py-2">فريد</th>
                                                <th className="text-right py-2">المشاهدات</th>
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
                                                        لا توجد بيانات
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
