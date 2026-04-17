import Button from '@/components/ui/Button'
import { useAuth } from '@/auth'
import { apiGoogleOauthLogin } from '@/services/OAuthServices'
import { loadGisClient } from '@/utils/google/loadGisClient'
import { useEffect, useRef, useState } from 'react'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import { useGoogleSignupStore } from '@/store/googleSignupStore'
import { useNavigate } from 'react-router'
import { apiAuthConfig } from '@/services/AuthService'

type OauthSignInProps = {
    setMessage?: (message: string) => void
    disableSubmit?: boolean
}

type GoogleSignupPrefill = {
    email: string | null
    name: string | null
    avatar_url: string | null
}

const coerceStringOrNull = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const extractGooglePrefill = (meta: unknown): GoogleSignupPrefill | null => {
    if (!meta || typeof meta !== 'object') return null
    const prefill = (meta as { prefill?: unknown }).prefill
    if (!prefill || typeof prefill !== 'object') return null

    const asObj = prefill as Record<string, unknown>

    return {
        email: coerceStringOrNull(asObj.email) ?? null,
        name: coerceStringOrNull(asObj.name) ?? null,
        avatar_url: coerceStringOrNull(asObj.avatar_url) ?? null,
    }
}

const OauthSignIn = ({ setMessage, disableSubmit }: OauthSignInProps) => {
    const { oAuthSignIn } = useAuth()
    const navigate = useNavigate()
    const setPendingChallenge = useAuthChallengeStore((s) => s.setPending)
    const setGoogleSignup = useGoogleSignupStore((s) => s.set)

    const [isEnabled, setEnabled] = useState<boolean | null>(null)
    const [isReady, setReady] = useState(false)
    const buttonRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        let mounted = true
        const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

        let cancelled = false

        const resolveClientId = async () => {
            try {
                const cfg = await apiAuthConfig()
                const fromApi = cfg?.oauth?.google_client_id
                return (fromApi && fromApi.trim()) || (envClientId && envClientId.trim()) || ''
            } catch {
                return (envClientId && envClientId.trim()) || ''
            }
        }

        resolveClientId()
            .then((clientId) => {
                if (!mounted) return
                if (!clientId) {
                    setEnabled(false)
                    return
                }

                setEnabled(true)
                return loadGisClient().then(() => clientId)
            })
            .then((clientId) => {
                if (!clientId) return
                if (cancelled) return
                if (!buttonRef.current) return
                if (!window.google?.accounts?.id) return

                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: ({ credential }) => {
                        if (!credential) {
                            setMessage?.('Unable to sign in with Google. Please try again.')
                            return
                        }

                        if (disableSubmit) {
                            return
                        }

                        oAuthSignIn(async ({ redirect, onSignIn }) => {
                            try {
                                const resp = await apiGoogleOauthLogin({
                                    id_token: credential,
                                })

                                if (resp?.success && resp.next_step === 'otp_verify' && resp.challenge_id) {
                                    setPendingChallenge({
                                        challenge_id: resp.challenge_id,
                                        expires_at: resp.expires_at,
                                        meta: resp.meta ?? {},
                                        user: resp.user ?? null,
                                    })
                                    navigate('/otp-verification')
                                    return
                                }

                                if (resp?.success && resp.next_step === 'authenticated' && resp.token) {
                                    onSignIn({ accessToken: resp.token }, resp.user ?? undefined)
                                    redirect()
                                    return
                                }

                                if (resp?.success === false && resp.next_step === 'register') {
                                    const prefill = extractGooglePrefill(resp.meta) ?? {
                                        email: null,
                                        name: null,
                                        avatar_url: null,
                                    }
                                    setGoogleSignup({
                                        id_token: credential,
                                        prefill: {
                                            email: prefill.email,
                                            name: prefill.name,
                                            avatar_url: prefill.avatar_url,
                                        },
                                    })
                                    navigate('/sign-up')
                                    return
                                }

                                setMessage?.(resp?.message || 'Unable to sign in with Google. Please try again.')
                            } catch (err: unknown) {
                                const data = (err as { response?: { data?: unknown } } | null)?.response?.data
                                if (data && typeof data === 'object') {
                                    const failure = data as {
                                        success?: unknown
                                        next_step?: unknown
                                        meta?: unknown
                                        message?: unknown
                                    }

                                    if (failure.success === false && failure.next_step === 'register') {
                                        const prefill = extractGooglePrefill(failure.meta) ?? {
                                            email: null,
                                            name: null,
                                            avatar_url: null,
                                        }

                                        setGoogleSignup({
                                            id_token: credential,
                                            prefill: {
                                                email: prefill.email,
                                                name: prefill.name,
                                                avatar_url: prefill.avatar_url,
                                            },
                                        })
                                        navigate('/sign-up')
                                        return
                                    }

                                    const serverMessage =
                                        typeof failure.message === 'string' ? failure.message : undefined
                                    setMessage?.(
                                        serverMessage ||
                                            'Unable to sign in with Google. Please try again.',
                                    )
                                    return
                                }

                                setMessage?.('Unable to sign in with Google. Please try again.')
                                return
                            }
                        })
                    },
                })

                // Render Google's official button (more reliable than programmatic prompt).
                buttonRef.current.innerHTML = ''
                window.google.accounts.id.renderButton(buttonRef.current, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'pill',
                    width: 260,
                    logo_alignment: 'left',
                })

                setReady(true)
            })
            .catch(() => {
                if (cancelled) return
                setMessage?.('Google sign-in is temporarily unavailable. Please try again later.')
            })

        return () => {
            mounted = false
            cancelled = true
        }
    }, [disableSubmit, navigate, oAuthSignIn, setGoogleSignup, setMessage, setPendingChallenge])

    if (isEnabled === false) {
        return null
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 flex justify-center">
                <div ref={buttonRef} />
            </div>
            {!isReady ? (
                <Button className="hidden" type="button">
                    Google
                </Button>
            ) : null}
        </div>
    )
}

export default OauthSignIn
