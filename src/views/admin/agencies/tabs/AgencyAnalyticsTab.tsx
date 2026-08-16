import { useMemo, useState } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import Chart from '@/components/shared/Chart'
import Input from '@/components/ui/Input'
import {
    apiGetAdminAgencyVisits,
    apiGetAdminAgencyReservationsAnalytics,
    apiGetAdminAgencyWhatsappAnalytics,
} from '@/services/admin/AdminAgencyAnalyticsService'

function guessTz(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
        return 'UTC'
    }
}

function defaultRange() {
    const to = dayjs().startOf('day')
    const from = to.subtract(29, 'day')
    return { from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD') }
}

/**
 * React port of the agency "Analytics" tab (AgencyAnalyticsController) —
 * read-only: daily unique visits, daily reservations, and WhatsApp
 * click/message counts over a date range.
 */
function AgencyAnalyticsTab({ agencySlug }: { agencySlug: string }) {
    const [{ from, to }, setRange] = useState(defaultRange)
    const tz = useMemo(guessTz, [])
    const params = useMemo(() => ({ from, to, tz }), [from, to, tz])

    const { data: visits, isLoading: visitsLoading } = useSWR(
        ['admin-agency-analytics-visits', agencySlug, params],
        () => apiGetAdminAgencyVisits(agencySlug, params),
    )
    const { data: reservations, isLoading: reservationsLoading } = useSWR(
        ['admin-agency-analytics-reservations', agencySlug, params],
        () => apiGetAdminAgencyReservationsAnalytics(agencySlug, params),
    )
    const { data: whatsapp, isLoading: whatsappLoading } = useSWR(
        ['admin-agency-analytics-whatsapp', agencySlug, params],
        () => apiGetAdminAgencyWhatsappAnalytics(agencySlug, params),
    )

    const totalVisits = (visits?.data ?? []).reduce((sum, d) => sum + d.visits, 0)

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <h5>Analytics</h5>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={from}
                            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                            type="date"
                            value={to}
                            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="text-xs text-gray-500">Unique visits</div>
                        <div className="text-2xl font-bold">{totalVisits}</div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="text-xs text-gray-500">Reservations</div>
                        <div className="text-2xl font-bold">
                            {reservations?.totals.reservations ?? 0}
                        </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="text-xs text-gray-500">WhatsApp clicks / messages</div>
                        <div className="text-2xl font-bold">
                            {whatsapp?.totals.clicks ?? 0} / {whatsapp?.totals.messages ?? 0}
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h6 className="mb-4">Daily visits</h6>
                {!visitsLoading && visits && (
                    <Chart
                        type="line"
                        series={[
                            { name: 'Visits', data: (visits.data ?? []).map((d) => d.visits) },
                        ]}
                        xAxis={(visits.data ?? []).map((d) => d.date)}
                    />
                )}
            </Card>

            <Card>
                <h6 className="mb-4">Daily reservations</h6>
                {!reservationsLoading && reservations && (
                    <Chart
                        type="bar"
                        series={[{ name: 'Reservations', data: reservations.series }]}
                        xAxis={reservations.labels}
                    />
                )}
            </Card>

            <Card>
                <h6 className="mb-4">WhatsApp interactions</h6>
                {!whatsappLoading && whatsapp && (
                    <Chart type="line" series={whatsapp.series} xAxis={whatsapp.labels} />
                )}
            </Card>
        </div>
    )
}

export default AgencyAnalyticsTab
