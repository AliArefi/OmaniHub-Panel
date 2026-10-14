import Alert from '@/components/ui/Alert'
import OtpVerificationForm from './components/OtpVerificationForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import { apiResendOtp, apiAuthConfig, apiEmailFallback } from '@/services/AuthService'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import useAuthPolicy from '@/utils/hooks/useAuthPolicy'
import { Navigate } from 'react-router'
import { useEffect, useState } from 'react'
import useTranslation from '@/utils/hooks/useTranslation'

const otpDeliveryKey = (deliveryChannel?: string) => {
    if (deliveryChannel === 'whatsapp') return 'auth.otp.whatsappDelivery'
    if (deliveryChannel === 'sms') return 'auth.otp.smsDelivery'
    if (deliveryChannel === 'email') return 'auth.otp.emailDelivery'
    return 'auth.otp.defaultDelivery'
}

const maskIdentifier = (identifier: string) => {
    const trimmed = identifier.trim()
    if (trimmed.includes('*')) return trimmed
    if (trimmed.includes('@')) {
        const [local, domain] = trimmed.split('@')
        const safeLocal =
            local.length <= 2 ? `${local[0] ?? '*'}*` : `${local.slice(0, 2)}***`
        return `${safeLocal}@${domain ?? ''}`
    }

    // Likely mobile. Keep last 3 digits.
    const digits = trimmed.replace(/[^\d+]/g, '')
    if (digits.length <= 4) return '***'
    return `${digits.slice(0, 2)}***${digits.slice(-3)}`
}

export const OtpVerificationBase = () => {
    const { t, i18n } = useTranslation()
    const { data: policy } = useAuthPolicy()
    const [email, setEmail] = useState('')
    const [fallbackOpen, setFallbackOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [now, setNow] = useState(Date.now())
    const [otpVerified, setOtpVerified] = useTimeOutMessage()
    const [otpResend, setOtpResend] = useTimeOutMessage()
    const [message, setMessage] = useTimeOutMessage()

    const pending = useAuthChallengeStore((s) => s.pending)
    const setPending = useAuthChallengeStore((s) => s.setPending)
    const [staticHint, setStaticHint] = useState<string | null>(null)
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [])
    const cooldown = Math.max(0, Math.ceil((Date.parse(pending?.meta.resend_available_at ?? '') - now) / 1000)) || 0
    const remaining = Math.max(0, Math.ceil((Date.parse(pending?.expires_at ?? '') - now) / 1000)) || 0

    useEffect(() => {
        apiAuthConfig()
            .then((resp) => {
                const hint = resp?.otp?.static_code_hint
                setStaticHint(typeof hint === 'string' ? hint : null)
            })
            .catch(() => {})
    }, [])

    const handleResendOtp = async () => {
        if (!pending?.challenge_id) {
            setMessage(t('auth.otp.noChallenge'))
            return
        }

        try {
            const resp = await apiResendOtp({ challenge_id: pending.challenge_id })

            if (resp?.success && resp.challenge_id) {
                setPending({
                    challenge_id: resp.challenge_id,
                    expires_at: resp.expires_at,
                    meta: resp.meta ?? {},
                    user: resp.user ?? null,
                })
            }

            setOtpResend(resp?.message || t('auth.otp.resent'))
        } catch (errors) {
            setMessage(typeof errors === 'string' ? errors : t('auth.otp.verifyError'))
        }
    }

    if (!pending?.challenge_id) {
        return <Navigate replace to="/sign-in" />
    }

    const deliveryChannel = pending.meta.delivery_channel ?? pending.meta.channel ?? ''

    return (
        <div>
            <div className="mb-8">
                <h3 className="mb-2">{t('auth.otp.title')}</h3>
                <p className="font-semibold heading-text">
                    {t(otpDeliveryKey(deliveryChannel))}
                </p>
                {pending.meta &&
                typeof pending.meta === 'object' &&
                'identifier' in pending.meta &&
                pending.meta.identifier ? (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-all">
                        {maskIdentifier(pending.meta.identifier)}
                    </p>
                ) : null}
            </div>

            {message ? (
                <Alert showIcon className="mb-4" type="danger">
                    <span className="break-all">{message}</span>
                </Alert>
            ) : null}

            {otpResend ? (
                <Alert showIcon className="mb-4" type="info">
                    <span className="break-all">{otpResend}</span>
                </Alert>
            ) : null}

            {deliveryChannel === 'static' && staticHint ? (
                <Alert showIcon className="mb-4" type="info">
                    <span className="break-all">
                        {t('auth.otp.devCode', { code: staticHint })}
                    </span>
                </Alert>
            ) : null}

            {otpVerified ? (
                <Alert showIcon className="mb-4" type="success">
                    <span className="break-all">{otpVerified}</span>
                </Alert>
            ) : null}

            <OtpVerificationForm setMessage={setMessage} setOtpVerified={setOtpVerified} />
            <p className="mt-3 text-center text-sm" aria-live="polite">{remaining > 0 ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : t('auth.otp.expired')}</p>

            <div className="mt-4 text-center">
                <span className="font-semibold">{t('auth.otp.notReceived')} </span>
                <button disabled={cooldown > 0 || remaining === 0} className="heading-text font-bold underline disabled:opacity-50" onClick={handleResendOtp}>
                    {t('auth.otp.resend')}{cooldown > 0 ? ` (${cooldown})` : ''}
                </button>
            </div>
            {policy?.otp.allow_email_fallback && deliveryChannel !== 'email' && <div className="mt-5">
                <button type="button" className="text-sm underline" onClick={() => setFallbackOpen(!fallbackOpen)}>
                    {i18n.language.startsWith('ar') ? 'استخدام البريد الإلكتروني بدلاً من ذلك' : 'Try email instead'}
                </button>
                {fallbackOpen && <form className="mt-3 space-y-3" onSubmit={async (event) => {
                    event.preventDefault()
                    if (!pending || sending) return
                    setSending(true)
                    try {
                        const response = await apiEmailFallback({ challenge_id: pending.challenge_id, email })
                        if (response.challenge_id) {
                            setPending({ challenge_id: response.challenge_id, expires_at: response.expires_at, meta: response.meta, user: null })
                            setFallbackOpen(false)
                        }
                    } catch { setMessage(t('auth.otp.verifyError')) } finally { setSending(false) }
                }}>
                    <Input required type="email" aria-label={t('auth.signIn.email')} value={email} onChange={(event) => setEmail(event.target.value)} />
                    <Button type="submit" variant="solid" loading={sending} disabled={cooldown > 0 || remaining === 0}>{t('auth.otp.resend')}</Button>
                </form>}
            </div>}
        </div>
    )
}

const OtpVerification = () => {
    return <OtpVerificationBase />
}

export default OtpVerification
