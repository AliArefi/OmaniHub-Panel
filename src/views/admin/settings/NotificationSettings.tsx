import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiGetSingletonSettings,
    apiUpdateSingletonSettings,
} from '@/services/admin/AdminSettingsService'

type EventTarget = { enabled: boolean; channels: Record<string, boolean> }
type NotificationEvents = Record<string, Record<string, EventTarget>>

type NotificationFormValues = {
    enabled: boolean
    admin_emails: string
    admin_whatsapp_numbers: string
    events: NotificationEvents
}

const NotificationSettings = () => {
    const { can } = usePermission()
    const canEdit = can('update notification settings')
    const { data, mutate } = useSWR('admin-settings-notifications', () =>
        apiGetSingletonSettings<{
            enabled: boolean
            admin_recipients?: { emails: string[]; whatsapp_numbers: string[] }
            events: NotificationEvents
        }>('notifications'),
    )
    const [submitting, setSubmitting] = useState(false)
    const { control, handleSubmit, reset } = useForm<NotificationFormValues>({
        defaultValues: {
            enabled: false,
            admin_emails: '',
            admin_whatsapp_numbers: '',
            events: {},
        },
    })

    useEffect(() => {
        const settings = data?.data as unknown as
            | {
                  enabled: boolean
                  admin_recipients?: { emails: string[]; whatsapp_numbers: string[] }
                  events: NotificationEvents
              }
            | undefined
        if (settings) {
            reset({
                enabled: settings.enabled,
                admin_emails: (settings.admin_recipients?.emails ?? []).join('\n'),
                admin_whatsapp_numbers: (
                    settings.admin_recipients?.whatsapp_numbers ?? []
                ).join('\n'),
                events: settings.events ?? {},
            })
        }
    }, [data, reset])

    const onSubmit = async (values: NotificationFormValues) => {
        setSubmitting(true)
        try {
            await apiUpdateSingletonSettings('notifications', values)
            toast.push(<Notification type="success" title="Saved" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to save" />)
        } finally {
            setSubmitting(false)
        }
    }

    const eventKeys = Object.keys(data?.data ? (data.data as unknown as { events: NotificationEvents }).events ?? {} : {})

    return (
        <AdaptiveCard>
            <h4 className="mb-6">Notification settings</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormItem label="Enabled">
                        <Controller
                            name="enabled"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <Switcher checked={value} disabled={!canEdit} onChange={onChange} />
                            )}
                        />
                    </FormItem>
                    <div />
                    <FormItem label="Admin emails (one per line)">
                        <Controller
                            name="admin_emails"
                            control={control}
                            render={({ field }) => (
                                <Input textArea rows={3} {...field} disabled={!canEdit} />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Admin WhatsApp numbers (one per line)">
                        <Controller
                            name="admin_whatsapp_numbers"
                            control={control}
                            render={({ field }) => (
                                <Input textArea rows={3} {...field} disabled={!canEdit} />
                            )}
                        />
                    </FormItem>
                </div>

                {eventKeys.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h6>Events</h6>
                        {eventKeys.map((eventKey) => (
                            <div
                                key={eventKey}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                            >
                                <div className="font-medium mb-2">{eventKey}</div>
                                <div className="flex gap-6">
                                    {['admin', 'customer'].map((target) => (
                                        <Controller
                                            key={target}
                                            name={`events.${eventKey}.${target}.enabled`}
                                            control={control}
                                            render={({ field: { value, onChange } }) => (
                                                <label className="flex items-center gap-2">
                                                    <Switcher
                                                        checked={Boolean(value)}
                                                        disabled={!canEdit}
                                                        onChange={onChange}
                                                    />
                                                    {target}
                                                </label>
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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

export default NotificationSettings
