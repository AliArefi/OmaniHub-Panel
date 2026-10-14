import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import AuthIdentityInput, { type AuthIdentity } from '@/components/shared/AuthIdentityInput'
import { identityPayload } from '@/utils/authIdentity'
import { apiForgotPassword, apiStartRecovery } from '@/services/AuthService'
import useAuthPolicy from '@/utils/hooks/useAuthPolicy'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import { useNavigate } from 'react-router'
import useTranslation from '@/utils/hooks/useTranslation'
import type { CommonProps } from '@/@types/common'

interface ForgotPasswordFormProps extends CommonProps {
    emailSent: boolean
    setEmailSent?: (complete: boolean) => void
    setMessage?: (message: string) => void
}

export default function ForgotPasswordForm({ className, setMessage, setEmailSent, emailSent, children }: ForgotPasswordFormProps) {
    const { t } = useTranslation()
    const { data: policy } = useAuthPolicy()
    const setPending = useAuthChallengeStore((state) => state.setPending)
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)
    const [identity, setIdentity] = useState<AuthIdentity>({ countryCode: '+968', localNumber: '', email: '', mode: 'phone' })
    const otpEnabled = policy?.otp.recovery_flow_mode === 'required'
    useEffect(() => {
        if (policy && (!otpEnabled || policy.otp.recovery_otp_channel_policy === 'email' || policy.otp.default_auth_identifier_mode === 'email_first')) {
            setIdentity((value) => ({ ...value, mode: 'email' }))
        }
    }, [policy, otpEnabled])
    if (emailSent) return <>{children}</>
    return <form className={className} onSubmit={async (event) => {
        event.preventDefault()
        if (!policy || submitting) return
        setSubmitting(true)
        try {
            if (otpEnabled) {
                const response = await apiStartRecovery(identityPayload(identity))
                if (response.challenge_id) {
                    setPending({ challenge_id: response.challenge_id, expires_at: response.expires_at, meta: response.meta, user: null })
                    navigate('/otp-verification')
                }
            } else if (identity.mode === 'email') {
                await apiForgotPassword({ email: identity.email })
                setEmailSent?.(true)
            } else {
                setMessage?.(t('auth.forgotPassword.email'))
            }
        } catch {
            setMessage?.(t('auth.forgotPassword.error'))
        } finally { setSubmitting(false) }
    }}>
        <AuthIdentityInput value={identity} onChange={setIdentity} />
        <Button block loading={submitting} disabled={!policy} variant="solid" type="submit">{t('auth.forgotPassword.submit')}</Button>
    </form>
}
