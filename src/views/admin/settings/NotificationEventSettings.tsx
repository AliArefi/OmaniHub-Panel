import { Link, useParams } from 'react-router'
import useSWR from 'swr'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import usePermission from '@/utils/hooks/usePermission'
import { apiGetSingletonSettings, apiUpdateSingletonSettings } from '@/services/admin/AdminSettingsService'
import { useEffect, useState } from 'react'

type Target = { enabled: boolean; channels: Record<string, boolean>; whatsapp_template?: { name: string; language: string; parameters: string[] } }
type Settings = { events: Record<string, Record<string, Target>>; default_chain?: Record<string, number[]> }
type Provider = { id: number; name: string; is_active: boolean; supported_channels: string[] }
type Payload = { data: Settings; providers: Provider[]; template_variables: Record<string, Record<string, string[]>>; event_catalog: Record<string, { label: string; description: string; audiences: string[] }> }

export default function NotificationEventSettings() {
    const { event = '' } = useParams<{ event: string }>(); const { can } = usePermission(); const canEdit = can('update notification settings')
    const { data, mutate } = useSWR('admin-settings-notifications-event', () => apiGetSingletonSettings<Settings>('notifications'))
    const [target, setTarget] = useState<Record<string, Target>>({}); const [saving, setSaving] = useState(false)
    const payload = data as unknown as Payload | undefined; const key = decodeURIComponent(event); const catalog = payload?.event_catalog?.[key]
    useEffect(() => { const value = payload?.data?.events?.[key]; if (value) setTarget(structuredClone(value)) }, [data, key])
    if (!catalog || !payload) return <AdaptiveCard>Event not found.</AdaptiveCard>
    const save = async () => { setSaving(true); try { await apiUpdateSingletonSettings('notifications', { events: { [key]: target } }); await mutate() } finally { setSaving(false) } }
    return <AdaptiveCard><Link to="/admin/settings/notifications" className="text-sm text-teal-700 underline">← All notification events</Link><header className="my-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Event configuration</p><h1 className="mt-2 text-3xl font-semibold">{catalog.label}</h1><p className="mt-2 text-gray-500">{catalog.description}</p><p className="mt-2 font-mono text-xs text-gray-400">{key}</p></header><div className="space-y-5">{catalog.audiences.map((audience) => { const value = target[audience] ?? { enabled: false, channels: {}, whatsapp_template: { name: '', language: '', parameters: [] } }; const template = value.whatsapp_template ?? { name: '', language: '', parameters: [] }; const variables = payload.template_variables?.[key]?.[audience] ?? []; const update = (next: Target) => setTarget((current) => ({ ...current, [audience]: next })); return <section key={audience} className="rounded-xl border border-gray-200 p-5 dark:border-gray-700"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold capitalize">{audience} message</h2><Switcher checked={value.enabled} disabled={!canEdit} onChange={(enabled) => update({ ...value, enabled })} /></div><div className="mt-5 flex flex-wrap gap-5">{['email', 'whatsapp', 'sms'].map((channel) => <label key={channel} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={Boolean(value.channels?.[channel])} disabled={!canEdit} onChange={(e) => update({ ...value, channels: { ...value.channels, [channel]: e.target.checked } })} />{channel}</label>)}</div>{value.channels?.whatsapp && <div className="mt-5 rounded-lg bg-teal-50 p-4 dark:bg-teal-950/30"><h3 className="font-semibold text-teal-800 dark:text-teal-200">Approved Meta WhatsApp template</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Template name<Input value={template.name} disabled={!canEdit} onChange={(e) => update({ ...value, whatsapp_template: { ...template, name: e.target.value } })} /></label><label className="text-sm">Language code<Input value={template.language} disabled={!canEdit} placeholder="en_US" onChange={(e) => update({ ...value, whatsapp_template: { ...template, language: e.target.value } })} /></label></div><p className="mt-3 text-xs text-gray-600">Variables: {variables.join(', ') || 'none'}</p><Input value={template.parameters.join(', ')} disabled={!canEdit} placeholder="agency_title, owner_name" onChange={(e) => update({ ...value, whatsapp_template: { ...template, parameters: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) } })} /></div>}</section> })}</div>{canEdit && <div className="mt-6 flex justify-end"><Button variant="solid" loading={saving} onClick={save}>Save event</Button></div>}</AdaptiveCard>
}
