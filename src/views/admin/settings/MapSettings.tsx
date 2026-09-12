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

type Settings = { google_enabled: boolean; google_api_key_configured: boolean; google_api_key_hint?: string | null; google_map_id?: string | null }
type Values = { google_enabled: boolean; google_maps_api_key: string; google_map_id: string; clear_google_maps_api_key: boolean }

export default function MapSettings() {
    const { can } = usePermission()
    const canEdit = can('general settings')
    const [saving, setSaving] = useState(false)
    const { data, mutate } = useSWR('admin-map-settings', () => apiGetSingletonSettings<Settings>('maps'))
    const form = useForm<Values>({ defaultValues: { google_enabled: false, google_maps_api_key: '', google_map_id: '', clear_google_maps_api_key: false } })

    useEffect(() => {
        if (!data?.data) return
        form.reset({ google_enabled: data.data.google_enabled, google_maps_api_key: '', google_map_id: data.data.google_map_id ?? '', clear_google_maps_api_key: false })
    }, [data, form])

    const save = form.handleSubmit(async (values) => {
        setSaving(true)
        try {
            await ApiService.fetchDataWithAxios({ url: '/admin/settings/singleton/maps', method: 'post', data: values })
            toast.push(<Notification type="success" title="Map settings saved" />)
            await mutate()
        } catch {
            toast.push(<Notification type="danger" title="Unable to save map settings" />)
        } finally { setSaving(false) }
    })

    return (
        <AdaptiveCard>
            <h4 className="mb-2">Maps</h4>
            <p className="mb-6 text-sm text-gray-500">Google Maps is used first. OpenStreetMap remains available automatically when Google Maps cannot load.</p>
            <Form className="space-y-4" onSubmit={save}>
                <label className="flex items-center gap-3">
                    <Switcher checked={form.watch('google_enabled')} disabled={!canEdit} onChange={(value) => form.setValue('google_enabled', value)} />
                    Enable Google Maps
                </label>
                <FormItem label={`Google Maps browser API key${data?.data.google_api_key_configured ? ` (${data.data.google_api_key_hint ?? 'configured'})` : ''}`}>
                    <Input type="password" autoComplete="new-password" placeholder={data?.data.google_api_key_configured ? 'Leave blank to keep the current key' : ''} disabled={!canEdit} {...form.register('google_maps_api_key')} />
                </FormItem>
                <FormItem label="Google Map ID (optional)">
                    <Input disabled={!canEdit} {...form.register('google_map_id')} />
                </FormItem>
                {data?.data.google_api_key_configured && <label className="flex items-center gap-3"><Switcher checked={form.watch('clear_google_maps_api_key')} disabled={!canEdit} onChange={(value) => form.setValue('clear_google_maps_api_key', value)} />Remove configured key</label>}
                {canEdit && <Button type="submit" variant="solid" loading={saving}>Save</Button>}
            </Form>
        </AdaptiveCard>
    )
}
