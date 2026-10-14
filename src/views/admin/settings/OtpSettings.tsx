import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiGetSingletonSettings,
    apiUpdateSingletonSettings,
} from '@/services/admin/AdminSettingsService'
import useTranslation from '@/utils/hooks/useTranslation'

const DRIVER_OPTIONS = [
    'static_code',
    'fake_email_log',
    'fake_whatsapp_log',
    'twilio_sms',
    'twilio_whatsapp',
    'meta_whatsapp_cloud',
    'smtp_mail',
].map((v) => ({ label: v, value: v }))

const FLOW_OPTIONS = ['required', 'optional', 'disabled'].map((v) => ({
    label: v,
    value: v,
}))

const IDENTIFIER_OPTIONS = ['mobile_first', 'email_first', 'mobile_only'].map(
    (v) => ({ label: v, value: v }),
)

const CHANNEL_OPTIONS = ['auto', 'mobile', 'email'].map((v) => ({
    label: v,
    value: v,
}))

type OtpFormValues = {
    enabled: boolean
    default_driver: string
    code_length: number
    expires_in_seconds: number
    resend_cooldown_seconds: number
    max_attempts: number
    max_resends: number
    block_for_seconds: number
    registration_flow_mode: string
    login_flow_mode: string
    default_auth_identifier_mode: string
    registration_otp_channel: string
    login_otp_channel: string
    require_verified_user_profile: boolean
    mfa_enabled: boolean
    login_method: string
    recovery_flow_mode: string
    recovery_otp_channel: string
    allow_email_fallback: boolean
    whatsapp_template_name: string
    whatsapp_template_language: string
    whatsapp_template_expiry_seconds: number
    provider_chain: Record<string, Record<string, number[]>>
    registration_provider_chain?: Record<string, number[]>
    login_provider_chain?: Record<string, number[]>
    recovery_provider_chain?: Record<string, number[]>
    mfa_modes?: string | string[]
}

type Provider = { id: number; name: string; is_active: boolean; supported_channels: string[]; provider_type: string }

const selectField = (
    options: { label: string; value: string }[],
    value: string,
) => options.find((o) => o.value === value)

const OtpSettings = () => {
    const { t, i18n } = useTranslation()
    const label = (english: string, arabic: string) => i18n.language.startsWith('ar') ? arabic : english
    const { can } = usePermission()
    const canEdit = can('update otp settings')
    const { data, mutate } = useSWR('admin-settings-otp', () =>
        apiGetSingletonSettings<OtpFormValues>('otp'),
    )
    const [submitting, setSubmitting] = useState(false)
    const providers = (data as unknown as { providers?: Provider[] })?.providers ?? []
    const { control, handleSubmit, reset } = useForm<OtpFormValues>()

    useEffect(() => {
        if (data?.data) {
            const values = data.data as OtpFormValues
            reset({ ...values, mfa_modes: Array.isArray(values.mfa_modes) ? values.mfa_modes.join(',') : values.mfa_modes,
                provider_chain: {
                    registration: values.registration_provider_chain ?? {},
                    login: values.login_provider_chain ?? {},
                    recovery: values.recovery_provider_chain ?? {},
                },
            })
        }
    }, [data, reset])

    const onSubmit = async (values: OtpFormValues) => {
        setSubmitting(true)
        try {
            await apiUpdateSingletonSettings('otp', values)
            toast.push(<Notification type="success" title={t('adminSettings.saved')} />)
            mutate()
        } catch (error) {
            const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data?.errors
            toast.push(<Notification type="danger" title={t('adminSettings.saveError')}>{errors ? Object.values(errors).flat().join(' ') : ''}</Notification>)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AdaptiveCard>
            <h4 className="mb-6">{t('adminSettings.otp.title')}</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem label={t('adminSettings.enabled')}>
                        <Controller
                            name="enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={Boolean(value)} disabled={!canEdit} onChange={onChange} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.defaultDriver')}>
                        <Controller
                            name="default_driver"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={DRIVER_OPTIONS}
                                    value={selectField(DRIVER_OPTIONS, field.value)}
                                    isDisabled={!canEdit}
                                    onChange={(o) => field.onChange(o?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.codeLength')}>
                        <Controller
                            name="code_length"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.expires')}>
                        <Controller
                            name="expires_in_seconds"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.resendCooldown')}>
                        <Controller
                            name="resend_cooldown_seconds"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.maxAttempts')}>
                        <Controller
                            name="max_attempts"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.maxResends')}>
                        <Controller
                            name="max_resends"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.blockFor')}>
                        <Controller
                            name="block_for_seconds"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.registrationFlow')}>
                        <Controller
                            name="registration_flow_mode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={FLOW_OPTIONS}
                                    value={selectField(FLOW_OPTIONS, field.value)}
                                    isDisabled={!canEdit}
                                    onChange={(o) => field.onChange(o?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.loginFlow')}>
                        <Controller
                            name="login_flow_mode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={FLOW_OPTIONS}
                                    value={selectField(FLOW_OPTIONS, field.value)}
                                    isDisabled={!canEdit}
                                    onChange={(o) => field.onChange(o?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.identifierMode')}>
                        <Controller
                            name="default_auth_identifier_mode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={IDENTIFIER_OPTIONS}
                                    value={selectField(IDENTIFIER_OPTIONS, field.value)}
                                    isDisabled={!canEdit}
                                    onChange={(o) => field.onChange(o?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.registrationChannel')}>
                        <Controller
                            name="registration_otp_channel"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={CHANNEL_OPTIONS}
                                    value={selectField(CHANNEL_OPTIONS, field.value)}
                                    isDisabled={!canEdit}
                                    onChange={(o) => field.onChange(o?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.loginChannel')}>
                        <Controller
                            name="login_otp_channel"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={CHANNEL_OPTIONS}
                                    value={selectField(CHANNEL_OPTIONS, field.value)}
                                    isDisabled={!canEdit}
                                    onChange={(o) => field.onChange(o?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.requireVerified')}>
                        <Controller
                            name="require_verified_user_profile"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={Boolean(value)} disabled={!canEdit} onChange={onChange} />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminSettings.otp.mfa')}>
                        <Controller
                            name="mfa_enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={Boolean(value)} disabled={!canEdit} onChange={onChange} />
                            )}
                        />
                    </FormItem>
                </div>
                <section className="mt-6 border-t pt-6">
                    <h4 className="mb-4">{label('Verification and recovery', 'التحقق واستعادة الحساب')}</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        {([
                            ['login_method', label('Sign-in method', 'طريقة تسجيل الدخول'), [
                                { value: 'otp_only', label: label('Verification code', 'رمز التحقق') },
                                { value: 'password_otp', label: label('Password and verification code', 'كلمة المرور ورمز التحقق') },
                            ]],
                            ['recovery_flow_mode', label('Password recovery verification', 'التحقق لاستعادة كلمة المرور'), FLOW_OPTIONS.filter((option) => option.value !== 'optional')],
                            ['recovery_otp_channel', label('Recovery delivery', 'إرسال رمز الاستعادة'), CHANNEL_OPTIONS],
                        ] as const).map(([name, title, options]) => <FormItem key={name} label={title}>
                            <Controller name={name} control={control} render={({ field }) => <Select options={[...options]} value={selectField([...options], field.value)} isDisabled={!canEdit} onChange={(option) => field.onChange(option?.value)} />} />
                        </FormItem>)}
                        <FormItem label={label('Allow email recovery', 'السماح بالاستعادة عبر البريد')}>
                            <Controller name="allow_email_fallback" control={control} render={({ field }) => <Switcher checked={Boolean(field.value)} disabled={!canEdit} onChange={field.onChange} />} />
                        </FormItem>
                        {([
                            ['whatsapp_template_name', label('WhatsApp verification template', 'قالب التحقق عبر واتساب')],
                            ['whatsapp_template_language', label('Template language', 'لغة القالب')],
                            ['whatsapp_template_expiry_seconds', label('Template expiry (seconds)', 'صلاحية القالب بالثواني')],
                        ] as const).map(([name, title]) => <FormItem key={name} label={title}><Controller name={name} control={control} render={({ field }) => <Input {...field} disabled={!canEdit} type={name.endsWith('seconds') ? 'number' : 'text'} onChange={(event) => field.onChange(name.endsWith('seconds') ? Number(event.target.value) : event.target.value)} />} /></FormItem>)}
                    </div>
                </section>
                <section className="mt-6 border-t pt-6">
                    <h4 className="mb-4">{label('Delivery providers', 'مزودو الإرسال')}</h4>
                    {(['registration', 'login', 'recovery'] as const).map((flow) => <div key={flow} className="mb-5 grid gap-4 md:grid-cols-2">
                        {(['whatsapp', 'email'] as const).map((channel) => {
                            const options = providers.filter((provider) => provider.is_active && provider.provider_type !== 'fake' && provider.supported_channels.includes(channel)).map((provider) => ({ value: provider.id, label: provider.name }))
                            return <FormItem key={channel} label={`${flow} / ${channel}`}><Controller name={`provider_chain.${flow}.${channel}`} control={control} render={({ field }) => <Select isMulti options={options} value={options.filter((option) => (field.value ?? []).includes(option.value))} isDisabled={!canEdit} onChange={(selected) => field.onChange(selected.map((option) => option.value))} />} /></FormItem>
                        })}
                    </div>)}
                </section>
                {canEdit && (
                    <div className="flex justify-end mt-6">
                        <Button type="submit" variant="solid" loading={submitting}>
                            {t('adminSettings.save')}
                        </Button>
                    </div>
                )}
            </Form>
        </AdaptiveCard>
    )
}

export default OtpSettings
