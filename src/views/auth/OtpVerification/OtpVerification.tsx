import Alert from '@/components/ui/Alert'
import OtpVerificationForm from './components/OtpVerificationForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import { apiResendOtp , apiAuthConfig } from '@/services/AuthService'
import { Navigate } from 'react-router'
import { useEffect, useState } from 'react'

const otpDeliveryText = (deliveryChannel?: string) => {
    if (deliveryChannel === 'whatsapp') return 'يرجى إدخال رمز التحقق المرسل عبر واتساب.'
    if (deliveryChannel === 'sms') return 'يرجى إدخال رمز التحقق المرسل عبر الرسائل القصيرة.'
    if (deliveryChannel === 'email') return 'يرجى إدخال رمز التحقق المرسل عبر البريد الإلكتروني.'
    return 'يرجى إدخال رمز التحقق المرسل إليك.'
}

const maskIdentifier = (identifier: string) => {
    const trimmed = identifier.trim()
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
    const [otpVerified, setOtpVerified] = useTimeOutMessage()
    const [otpResend, setOtpResend] = useTimeOutMessage()
    const [message, setMessage] = useTimeOutMessage()

    const pending = useAuthChallengeStore((s) => s.pending)
    const setPending = useAuthChallengeStore((s) => s.setPending)
    const [staticHint, setStaticHint] = useState<string | null>(null)

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
            setMessage('No active challenge found. Please sign in again.')
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

            setOtpResend(resp?.message || 'OTP resent.')
        } catch (errors) {
            setMessage(typeof errors === 'string' ? errors : 'An error occurred!')
        }
    }

    if (!pending?.challenge_id) {
        return <Navigate replace to="/sign-in" />
    }

    const deliveryChannel =
        pending.meta && typeof pending.meta === 'object' && 'delivery_channel' in pending.meta
            ? String((pending.meta as any).delivery_channel ?? '')
            : ''
    const deliveryDriver =
        pending.meta && typeof pending.meta === 'object' && 'delivery_driver' in pending.meta
            ? String((pending.meta as any).delivery_driver ?? '')
            : ''

    return (
        <div>
            <div className="mb-8">
                <h3 className="mb-2">تأكيد رمز التحقق</h3>
                <p className="font-semibold heading-text">
                    {otpDeliveryText(deliveryChannel)}
                </p>
                {pending.meta &&
                typeof pending.meta === 'object' &&
                'identifier' in pending.meta &&
                (pending.meta as any).identifier ? (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-all">
                        {maskIdentifier(String((pending.meta as any).identifier))}
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

            {deliveryDriver === 'static_code' && staticHint ? (
                <Alert showIcon className="mb-4" type="info">
                    <span className="break-all">
                        رمز تجريبي للتطوير: {staticHint}
                    </span>
                </Alert>
            ) : null}

            {otpVerified ? (
                <Alert showIcon className="mb-4" type="success">
                    <span className="break-all">{otpVerified}</span>
                </Alert>
            ) : null}

            <OtpVerificationForm setMessage={setMessage} setOtpVerified={setOtpVerified} />

            <div className="mt-4 text-center">
                <span className="font-semibold">لم تستلم رمز التحقق؟ </span>
                <button className="heading-text font-bold underline" onClick={handleResendOtp}>
                    إعادة الإرسال
                </button>
            </div>
        </div>
    )
}

const OtpVerification = () => {
    return <OtpVerificationBase />
}

export default OtpVerification
