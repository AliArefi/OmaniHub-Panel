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
}

const selectField = (
    options: { label: string; value: string }[],
    value: string,
) => options.find((o) => o.value === value)

const OtpSettings = () => {
    const { t } = useTranslation()
    const { can } = usePermission()
    const canEdit = can('update otp settings')
    const { data, mutate } = useSWR('admin-settings-otp', () =>
        apiGetSingletonSettings<OtpFormValues>('otp'),
    )
    const [submitting, setSubmitting] = useState(false)
    const { control, handleSubmit, reset } = useForm<OtpFormValues>()

    useEffect(() => {
        if (data?.data) {
            reset(data.data as unknown as OtpFormValues)
        }
    }, [data, reset])

    const onSubmit = async (values: OtpFormValues) => {
        setSubmitting(true)
        try {
            await apiUpdateSingletonSettings('otp', values)
            toast.push(<Notification type="success" title={t('adminSettings.saved')} />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title={t('adminSettings.saveError')} />)
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
