import { useEffect, useState, type ReactNode } from 'react'
import Button from '@/components/ui/Button'
import PasswordInput from '@/components/shared/PasswordInput'
import AuthIdentityInput, { type AuthIdentity } from '@/components/shared/AuthIdentityInput'
import { identityPayload } from '@/utils/authIdentity'
import { useAuth } from '@/auth'
import useAuthPolicy from '@/utils/hooks/useAuthPolicy'
import useTranslation from '@/utils/hooks/useTranslation'
import type { CommonProps } from '@/@types/common'

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string) => void
}

export default function SignInForm({ disableSubmit, className, setMessage, passwordHint }: SignInFormProps) {
    const { t, i18n } = useTranslation()
    const { signIn } = useAuth()
    const { data: policy, error } = useAuthPolicy()
    const [identity, setIdentity] = useState<AuthIdentity>({ countryCode: '+968', localNumber: '', email: '', mode: 'phone' })
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    useEffect(() => {
        if (policy) {
            const redirect = new URLSearchParams(window.location.search).get('redirectUrl') ?? ''
            setShowPassword((current) => current || policy.otp.login_method !== 'otp_only' || redirect.startsWith('/admin'))
            if (policy.otp.login_otp_channel_policy === 'email' || policy.otp.default_auth_identifier_mode === 'email_first') {
                setIdentity((current) => ({ ...current, mode: 'email' }))
            }
        }
    }, [policy])

    return <form className={className} onSubmit={async (event) => {
        event.preventDefault()
        if (!policy || disableSubmit || submitting) return
        setSubmitting(true)
        try {
            const result = await signIn({ ...identityPayload(identity), ...(showPassword ? { password } : {}) })
            if (result?.status === 'failed') {
                setMessage?.(result.message)
                if (result.nextStep === 'password_verify') setShowPassword(true)
            }
        } finally { setSubmitting(false) }
    }}>
        <AuthIdentityInput value={identity} onChange={setIdentity} />
        {showPassword ? <label className="mb-5 block">{t('auth.signIn.password')}
            <PasswordInput required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label> : <button type="button" className="mb-5 text-sm underline" onClick={() => setShowPassword(true)}>{i18n.language.startsWith('ar') ? 'تسجيل الدخول بكلمة المرور' : 'Sign in with a password'}</button>}
        {showPassword && policy?.otp.login_method === 'otp_only' && <button type="button" className="mb-5 text-sm underline" onClick={() => { setShowPassword(false); setPassword('') }}>
            {i18n.language.startsWith('ar') ? 'تسجيل الدخول برمز التحقق' : 'Sign in with a code'}
        </button>}
        {passwordHint}
        {error && <p role="alert">{t('auth.signUp.signupError')}</p>}
        <Button block type="submit" variant="solid" loading={submitting} disabled={!policy || disableSubmit}>
            {t('auth.signIn.submit')}
        </Button>
    </form>
}
