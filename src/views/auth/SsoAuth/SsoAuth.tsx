import { useAuth } from '@/auth'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useSessionUser } from '@/store/authStore'

const DEFAULT_ALLOWED_ORIGINS = [
    'https://omanihub.com',
    'https://panel.omanihub.com',
    'https://admin.omanihub.com',
    'http://localhost:3000',
    'http://localhost:5173',
]

function allowedOrigins(): string[] {
    const raw = import.meta.env.VITE_SSO_REDIRECT_ORIGINS as string | undefined
    if (typeof raw !== 'string' || raw.trim() === '') {
        return DEFAULT_ALLOWED_ORIGINS
    }
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

function isAllowedRedirectUri(redirectUri: string): boolean {
    try {
        const url = new URL(redirectUri)
        return allowedOrigins().includes(url.origin)
    } catch {
        return false
    }
}

export default function SsoAuth() {
    const { authenticated } = useAuth()
    const accessToken = useSessionUser((s) => s.session.accessToken)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    const redirectUri = useMemo(
        () => searchParams.get('redirect_uri')?.trim() ?? '',
        [searchParams],
    )
    const returnTo = useMemo(
        () => searchParams.get('return_to')?.trim() ?? '',
        [searchParams],
    )

    useEffect(() => {
        if (!redirectUri) {
            setError('redirect_uri is required.')
            return
        }

        if (!isAllowedRedirectUri(redirectUri)) {
            setError('redirect_uri is not allowed.')
            return
        }

        if (!authenticated) {
            const current = `${window.location.pathname}${window.location.search}`
            navigate(`/login?redirectUrl=${encodeURIComponent(current)}`, {
                replace: true,
            })
            return
        }

        if (!accessToken) {
            setError('Missing session token. Please sign in again.')
            return
        }

        const target = new URL(redirectUri)
        if (returnTo) {
            target.searchParams.set('return_to', returnTo)
        }
        // Pass token via URL fragment to avoid leaking it in server logs / referrers.
        target.hash = `token=${encodeURIComponent(accessToken)}`

        window.location.assign(target.toString())
    }, [accessToken, authenticated, navigate, redirectUri, returnTo])

    if (error) {
        return <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
    }

    return <div className="p-6">Redirecting…</div>
}
