import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import useSWR from 'swr'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { Button, Form, FormItem, Input, Switcher } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ApiService from '@/services/ApiService'
import { apiGetSingletonSettings } from '@/services/admin/AdminSettingsService'
import usePermission from '@/utils/hooks/usePermission'

type Settings = {
    enabled: boolean
    web_config?: Record<string, string>
    vapid_key_configured: boolean
    service_account_configured: boolean
    service_account_email?: string | null
    project_id?: string | null
}
type FormValues = {
    enabled: boolean
    web_config_json: string
    vapid_key: string
    service_account_json: string
}
type SendValues = { user_ids: string; title: string; body: string; url: string }
type AuditItem = {
    id: number
    event_key: string
    audience: string
    title: string
    recipient_count: number
    sent_count: number
    failed_count: number
    deliveries_count: number
    created_at: string
}

export default function PushNotificationSettings() {
    const { can } = usePermission()
    const canEdit = can('update notification settings')
    const canSend = can('push-notifications.send')
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const { data, mutate } = useSWR('admin-push-settings', () =>
        apiGetSingletonSettings<Settings>('push-notifications'),
    )
    const { data: auditData, mutate: mutateAudit } = useSWR(
        canSend ? 'admin-push-audit' : null,
        () =>
            ApiService.fetchDataWithAxios<{ data: AuditItem[] }>({
                url: '/admin/push-notifications',
            }),
    )
    const settingsForm = useForm<FormValues>({
        defaultValues: {
            enabled: false,
            web_config_json: '{}',
            vapid_key: '',
            service_account_json: '',
        },
    })
    const sendForm = useForm<SendValues>({
        defaultValues: { user_ids: '', title: '', body: '', url: '/' },
    })

    useEffect(() => {
        if (!data?.data) return
        settingsForm.reset({
            enabled: data.data.enabled,
            web_config_json: JSON.stringify(
                data.data.web_config ?? {},
                null,
                2,
            ),
            vapid_key: '',
            service_account_json: '',
        })
    }, [data, settingsForm])

    const save = settingsForm.handleSubmit(async (values) => {
        setSaving(true)
        try {
            await ApiService.fetchDataWithAxios({
                url: '/admin/settings/singleton/push-notifications',
                method: 'post',
                data: {
                    enabled: values.enabled,
                    web_config: JSON.parse(values.web_config_json),
                    vapid_key: values.vapid_key || undefined,
                    service_account_json:
                        values.service_account_json || undefined,
                },
            })
            toast.push(
                <Notification type="success" title="Push settings saved" />,
            )
            settingsForm.setValue('service_account_json', '')
            settingsForm.setValue('vapid_key', '')
            await mutate()
        } catch {
            toast.push(
                <Notification
                    type="danger"
                    title="Unable to save push settings"
                />,
            )
        } finally {
            setSaving(false)
        }
    })

    const send = sendForm.handleSubmit(async (values) => {
        setSending(true)
        try {
            const userIds = values.user_ids
                .split(/[\s,]+/)
                .map(Number)
                .filter((value) => Number.isInteger(value) && value > 0)
            await ApiService.fetchDataWithAxios({
                url: '/admin/push-notifications',
                method: 'post',
                data: { ...values, user_ids: [...new Set(userIds)] },
            })
            toast.push(
                <Notification type="success" title="Notification queued" />,
            )
            sendForm.reset({ user_ids: '', title: '', body: '', url: '/' })
            await mutateAudit()
        } catch {
            toast.push(
                <Notification
                    type="danger"
                    title="Unable to queue notification"
                />,
            )
        } finally {
            setSending(false)
        }
    })

    return (
        <div className="space-y-4">
            <AdaptiveCard>
                <h4 className="mb-2">Firebase push notifications</h4>
                <p className="mb-6 text-sm text-gray-500">
                    Credentials are encrypted. Existing private values are never
                    returned.
                </p>
                <Form className="space-y-4" onSubmit={save}>
                    <label className="flex items-center gap-3">
                        <Switcher
                            checked={settingsForm.watch('enabled')}
                            disabled={!canEdit}
                            onChange={(value) =>
                                settingsForm.setValue('enabled', value)
                            }
                        />
                        Enabled
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormItem label="Web configuration (JSON)">
                            <Input
                                textArea
                                rows={10}
                                disabled={!canEdit}
                                {...settingsForm.register('web_config_json', {
                                    required: true,
                                })}
                            />
                        </FormItem>
                        <div className="space-y-4">
                            <FormItem
                                label={`VAPID public key${data?.data.vapid_key_configured ? ' (configured)' : ''}`}
                            >
                                <Input
                                    disabled={!canEdit}
                                    {...settingsForm.register('vapid_key')}
                                />
                            </FormItem>
                            <FormItem
                                label={`Service account JSON${data?.data.service_account_configured ? ` (configured: ${data.data.service_account_email ?? data.data.project_id})` : ''}`}
                            >
                                <Input
                                    textArea
                                    rows={7}
                                    disabled={!canEdit}
                                    {...settingsForm.register(
                                        'service_account_json',
                                    )}
                                />
                            </FormItem>
                        </div>
                    </div>
                    {canEdit && (
                        <Button type="submit" variant="solid" loading={saving}>
                            Save
                        </Button>
                    )}
                </Form>
            </AdaptiveCard>
            {canSend && (
                <AdaptiveCard>
                    <h4 className="mb-6">Send push notification</h4>
                    <Form className="grid gap-4 md:grid-cols-2" onSubmit={send}>
                        <FormItem label="User IDs (comma separated)">
                            <Input
                                {...sendForm.register('user_ids', {
                                    required: true,
                                })}
                            />
                        </FormItem>
                        <FormItem label="Destination path">
                            <Input {...sendForm.register('url')} />
                        </FormItem>
                        <FormItem label="Title">
                            <Input
                                {...sendForm.register('title', {
                                    required: true,
                                })}
                            />
                        </FormItem>
                        <FormItem label="Message">
                            <Input
                                textArea
                                rows={3}
                                {...sendForm.register('body', {
                                    required: true,
                                })}
                            />
                        </FormItem>
                        <div>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={sending}
                            >
                                Send
                            </Button>
                        </div>
                    </Form>
                </AdaptiveCard>
            )}
            {canSend && (
                <AdaptiveCard>
                    <h4 className="mb-4">Delivery audit</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="p-2">Time</th>
                                    <th className="p-2">Event</th>
                                    <th className="p-2">Title</th>
                                    <th className="p-2">Recipients</th>
                                    <th className="p-2">Sent</th>
                                    <th className="p-2">Failed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(auditData?.data ?? []).map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-gray-100 dark:border-gray-700"
                                    >
                                        <td className="p-2">
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="p-2">
                                            {item.event_key}
                                        </td>
                                        <td className="p-2">{item.title}</td>
                                        <td className="p-2">
                                            {item.recipient_count}
                                        </td>
                                        <td className="p-2">
                                            {item.sent_count}
                                        </td>
                                        <td className="p-2">
                                            {item.failed_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AdaptiveCard>
            )}
        </div>
    )
}
