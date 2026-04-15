import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { newPageViewId, postAnalyticsEvent } from '@/utils/analyticsClient'

export default function AnalyticsRouteTracker() {
    const location = useLocation()
    const startedAtRef = useRef<number | null>(null)
    const pageViewIdRef = useRef<string | null>(null)

    useEffect(() => {
        const pageUrl = `${location.pathname}${location.search}${location.hash}`
        startedAtRef.current = Date.now()
        pageViewIdRef.current = newPageViewId()

        void postAnalyticsEvent({
            event_name: 'page_view_start',
            page_url: pageUrl,
            meta: { app: 'panel' },
        }, { pageViewId: pageViewIdRef.current ?? undefined })

        return () => {
            const startedAt = startedAtRef.current
            const duration = startedAt ? Math.max(0, Date.now() - startedAt) : undefined

            void postAnalyticsEvent(
                {
                    event_name: 'page_view_end',
                    page_url: pageUrl,
                    duration_ms: duration,
                    exit_reason: 'route_change',
                    meta: { app: 'panel' },
                },
                { keepalive: true, pageViewId: pageViewIdRef.current ?? undefined },
            )
        }
        // Run on each route change
    }, [location.pathname, location.search, location.hash])

    return null
}
