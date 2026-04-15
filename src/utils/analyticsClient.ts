import appConfig from '@/configs/app.config'

export type AnalyticsSubjectType =
    | 'agency'
    | 'store'
    | 'product'
    | 'article'
    | 'page'
    | 'brand'
    | 'service_category'
    | 'agency_service'
    | 'agency_service_category'

export type AnalyticsEventName =
    | 'page_view_start'
    | 'page_view_end'
    | 'view_agency'
    | 'view_store'
    | 'view_product'
    | 'view_article'
    | 'view_service_category'
    | 'view_agency_service'
    | 'view_agency_service_category'
    | 'view_service_category_city'
    | 'whatsapp_click'
    | 'like'
    | 'bookmark'
    | 'review_submitted'
    | 'share'

export type AnalyticsEventPayload = {
    event_name: AnalyticsEventName
    occurred_at?: string
    subject_type?: AnalyticsSubjectType
    subject_id?: number
    page_url?: string
    referrer?: string
    duration_ms?: number
    exit_reason?: string
    meta?: Record<string, unknown>
}

const COOKIE_VID = 'vid'
const COOKIE_SID = 'sid'
const SESSION_MAX_AGE_SECONDS = 30 * 60

function randomId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
    return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

export function getOrCreateVisitorId(): string {
    const existing = getCookie(COOKIE_VID)
    if (existing) return existing
    const next = randomId()
    setCookie(COOKIE_VID, next, 400 * 24 * 60 * 60)
    return next
}

export function getOrCreateSessionId(): string {
    const existing = getCookie(COOKIE_SID)
    const next = existing || randomId()
    setCookie(COOKIE_SID, next, SESSION_MAX_AGE_SECONDS)
    return next
}

export function newPageViewId(): string {
    return randomId()
}

export async function postAnalyticsEvent(
    payload: AnalyticsEventPayload,
    opts?: { keepalive?: boolean; pageViewId?: string },
): Promise<void> {
    const url = `${appConfig.apiPrefix}/analytics/events`
    const vid = getOrCreateVisitorId()
    const sid = getOrCreateSessionId()
    const pvid = opts?.pageViewId ?? newPageViewId()

    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Visitor-Id': vid,
            'X-Session-Id': sid,
            'X-Page-View-Id': pvid,
        },
        body: JSON.stringify({
            ...payload,
            occurred_at: payload.occurred_at ?? new Date().toISOString(),
            page_url: payload.page_url ?? location.href,
            referrer: payload.referrer ?? document.referrer || undefined,
        }),
        keepalive: Boolean(opts?.keepalive),
    }).then(() => undefined)
}
