import ApiService from './ApiService'

export type MyAnalyticsOverviewParams = {
    from: string
    to: string
    tz: string
}

export type TopRow = {
    id: number
    title: string | null
    slug: string | null
    pageviews: number
    unique_visitors: number
}

export type MyAnalyticsOverviewResponse = {
    range: { from: string; to: string; tz: string; interval: 'day' }
    scope: { agency_id: number | null; store_id: number | null; agency_service_id: number | null }
    kpis: {
        pageviews: number
        unique_visitors: number
        sessions: number
        bounces: number
        bounce_rate: number
        reservations: { total: number; by_status: Record<string, number> }
        orders: { total: number; by_status: Record<string, number>; revenue: number }
        whatsapp: { clicks: number; messages: number }
    }
    series: {
        labels: string[]
        pageviews: number[]
        unique_visitors: number[]
        sessions: number[]
        bounces: number[]
        reservations: number[]
        orders: number[]
        revenue: number[]
        whatsapp_clicks: number[]
        whatsapp_messages: number[]
    }
    tops: {
        agencies: TopRow[]
        stores: TopRow[]
        agency_services: TopRow[]
        service_categories: TopRow[]
    }
    breakdowns: Record<string, { key: string; total: number }[]>
}

export async function apiGetMyAnalyticsOverview(params: MyAnalyticsOverviewParams) {
    return ApiService.fetchDataWithAxios<MyAnalyticsOverviewResponse>({
        url: '/my/analytics/overview',
        method: 'get',
        params,
    })
}

