import Input from '@/components/ui/Input'
import PhoneNumberInput, { type PhoneNumberValue } from './PhoneNumberInput'
import useTranslation from '@/utils/hooks/useTranslation'

export type AuthIdentity = PhoneNumberValue & { email: string; mode: 'phone' | 'email' }

export default function AuthIdentityInput({ value, onChange }: {
    value: AuthIdentity
    onChange: (value: AuthIdentity) => void
}) {
    const { t } = useTranslation()
    return <div className="mb-5">
        <div className="mb-3 flex gap-5" role="group" aria-label={t('auth.signIn.email')}>
            {(['phone', 'email'] as const).map((mode) => <label key={mode} className="flex items-center gap-2 text-sm">
                <input type="radio" name="identity-mode" checked={value.mode === mode} onChange={() => onChange({ ...value, mode })} />
                {t(mode === 'phone' ? 'auth.signUp.phone' : 'auth.signIn.email')}
            </label>)}
        </div>
        {value.mode === 'phone' ? <PhoneNumberInput required value={value} placeholder={t('auth.signUp.phone')} onChange={(phone) => onChange({ ...value, ...phone })} />
            : <Input required aria-label={t('auth.signIn.email')} type="email" autoComplete="email" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} />}
    </div>
}
