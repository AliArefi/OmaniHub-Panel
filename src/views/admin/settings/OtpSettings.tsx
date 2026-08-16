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

const DRIVER_OPTIONS = [
    'static_code',
    'fake_email_log',
    'fake_whatsapp_log',
    'twilio_sms',
    'twilio_whatsapp',
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
            toast.push(<Notification type="success" title="Saved" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to save" />)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AdaptiveCard>
            <h4 className="mb-6">OTP settings</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem label="Enabled">
                        <Controller
                            name="enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={Boolean(value)} onChange={onChange} disabled={!canEdit} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Default driver">
                        <Controller
                            name="default_driver"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={DRIVER_OPTIONS}
                                    value={selectField(DRIVER_OPTIONS, field.value)}
                                    onChange={(o) => field.onChange(o?.value)}
                                    isDisabled={!canEdit}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Code length">
                        <Controller
                            name="code_length"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Expires in (seconds)">
                        <Controller
                            name="expires_in_seconds"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Resend cooldown (seconds)">
                        <Controller
                            name="resend_cooldown_seconds"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Max attempts">
                        <Controller
                            name="max_attempts"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Max resends">
                        <Controller
                            name="max_resends"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Block for (seconds)">
                        <Controller
                            name="block_for_seconds"
                            control={control}
                            render={({ field }) => (
                                <Input type="number" {...field} disabled={!canEdit} onChange={(e) => field.onChange(Number(e.target.value))} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Registration flow mode">
                        <Controller
                            name="registration_flow_mode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={FLOW_OPTIONS}
                                    value={selectField(FLOW_OPTIONS, field.value)}
                                    onChange={(o) => field.onChange(o?.value)}
                                    isDisabled={!canEdit}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Login flow mode">
                        <Controller
                            name="login_flow_mode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={FLOW_OPTIONS}
                                    value={selectField(FLOW_OPTIONS, field.value)}
                                    onChange={(o) => field.onChange(o?.value)}
                                    isDisabled={!canEdit}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Default identifier mode">
                        <Controller
                            name="default_auth_identifier_mode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={IDENTIFIER_OPTIONS}
                                    value={selectField(IDENTIFIER_OPTIONS, field.value)}
                                    onChange={(o) => field.onChange(o?.value)}
                                    isDisabled={!canEdit}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Registration OTP channel">
                        <Controller
                            name="registration_otp_channel"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={CHANNEL_OPTIONS}
                                    value={selectField(CHANNEL_OPTIONS, field.value)}
                                    onChange={(o) => field.onChange(o?.value)}
                                    isDisabled={!canEdit}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Login OTP channel">
                        <Controller
                            name="login_otp_channel"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={CHANNEL_OPTIONS}
                                    value={selectField(CHANNEL_OPTIONS, field.value)}
                                    onChange={(o) => field.onChange(o?.value)}
                                    isDisabled={!canEdit}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Require verified profile">
                        <Controller
                            name="require_verified_user_profile"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={Boolean(value)} onChange={onChange} disabled={!canEdit} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="MFA enabled">
                        <Controller
                            name="mfa_enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={Boolean(value)} onChange={onChange} disabled={!canEdit} />
                            )}
                        />
                    </FormItem>
                </div>
                {canEdit && (
                    <div className="flex justify-end mt-6">
                        <Button type="submit" variant="solid" loading={submitting}>
                            Save
                        </Button>
                    </div>
                )}
            </Form>
        </AdaptiveCard>
    )
}

export default OtpSettings
