import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Link } from 'react-router'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import usePermission from '@/utils/hooks/usePermission'
import { apiGetSingletonSettings, apiUpdateSingletonSettings } from '@/services/admin/AdminSettingsService'

type Template = { name: string; language: string; parameters: string[] }
type Target = { enabled: boolean; channels: Record<string, boolean>; whatsapp_template?: Template }
type Events = Record<string, Record<string, Target>>
type Provider = { id: number; name: string; is_active: boolean; supported_channels: string[] }
type Settings = { enabled: boolean; events: Events; default_chain: Record<string, number[]>; admin_recipients: { emails: string[]; whatsapp_numbers: string[] } }
type Response = { data: Settings; providers: Provider[]; template_variables: Record<string, Record<string, string[]>> }
const channels = ['email', 'whatsapp', 'sms']
const titles: Record<string, string> = { 'agency.created.pending': 'New agency awaiting approval', 'agency.approved': 'Agency approved', 'store.approved': 'Store approved', 'store.rejected': 'Store rejected' }

export default function NotificationSettings() {
    const { can } = usePermission()
    const canEdit = can('update notification settings')
    const { data, mutate } = useSWR('admin-settings-notifications', () => apiGetSingletonSettings<Settings>('notifications'))
    const response = data as unknown as Response | undefined
    const [settings, setSettings] = useState<Settings | null>(null)
    const [saving, setSaving] = useState(false)
    useEffect(() => { if (response?.data) setSettings(structuredClone(response.data)) }, [response])
    const update = (next: Settings) => setSettings({ ...next })
    const updateTarget = (event: string, audience: string, next: Target) => { if (!settings) return; settings.events[event][audience] = next; update(settings) }
    const save = async () => {
        if (!settings) return
        setSaving(true)
        try {
            await apiUpdateSingletonSettings('notifications', { ...settings, admin_emails: settings.admin_recipients.emails.join('\n'), admin_whatsapp_numbers: settings.admin_recipients.whatsapp_numbers.join('\n') })
            toast.push(<Notification type="success" title="Notification settings saved" />)
            await mutate()
        } catch { toast.push(<Notification type="danger" title="Could not save notification settings" />) } finally { setSaving(false) }
    }
    if (!settings) return <AdaptiveCard>Loading notification settings…</AdaptiveCard>
    return <AdaptiveCard>
        <header className="mb-7 rounded-2xl bg-slate-900 p-6 text-white dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Notification studio</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Messages by event and audience</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Set each audience’s channels and approved WhatsApp template. Body parameters follow the order of placeholders in Meta.</p>
            <Link to="/admin/settings/messaging-providers" className="mt-4 inline-block text-sm font-medium text-teal-300 underline underline-offset-4">Configure provider credentials</Link>
        </header>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.keys(settings.events).map((event) => <Link key={event} to={`/admin/settings/notifications/${encodeURIComponent(event)}`} className="rounded-xl border border-gray-200 p-4 transition hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-sm dark:border-gray-700"><span className="text-xs font-semibold uppercase tracking-wider text-teal-600">Configure event</span><h2 className="mt-2 font-semibold">{titles[event] ?? event}</h2><p className="mt-1 text-xs text-gray-500">Separate audience templates and channels</p></Link>)}</div>
        <section className="mb-8 grid gap-4 md:grid-cols-2" aria-label="General settings">
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><div className="flex items-center justify-between"><h2 className="font-semibold">Notifications enabled</h2><Switcher checked={settings.enabled} disabled={!canEdit} onChange={(enabled) => update({ ...settings, enabled })} /></div></div>
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><h2 className="mb-3 font-semibold">Admin recipients</h2>{(['emails', 'whatsapp_numbers'] as const).map((key) => <label key={key} className="mb-3 block text-sm">{key === 'emails' ? 'Email addresses' : 'WhatsApp numbers (E.164)'}<Input textArea rows={2} value={(settings.admin_recipients?.[key] ?? []).join('\n')} disabled={!canEdit} onChange={(e) => update({ ...settings, admin_recipients: { ...settings.admin_recipients, [key]: e.target.value.split(/[\n,]+/).map((v) => v.trim()).filter(Boolean) } })} /></label>)}</div>
        </section>
        <section className="mb-8" aria-label="Provider order"><h2 className="mb-1 text-lg font-semibold">Provider order</h2><p className="mb-4 text-sm text-gray-500">The first usable provider handles the channel. Select Meta Cloud API for WhatsApp templates.</p><div className="grid gap-4 md:grid-cols-3">{channels.map((channel) => <div key={channel} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><h3 className="mb-3 font-semibold capitalize">{channel}</h3>{(response?.providers ?? []).filter((p) => p.is_active && p.supported_channels.includes(channel)).map((provider) => <label key={provider.id} className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={(settings.default_chain?.[channel] ?? []).includes(provider.id)} disabled={!canEdit} onChange={(e) => { const current = settings.default_chain?.[channel] ?? []; update({ ...settings, default_chain: { ...settings.default_chain, [channel]: e.target.checked ? [...current, provider.id] : current.filter((id) => id !== provider.id) } }) }} />{provider.name}</label>)}</div>)}</div></section>
        <section aria-label="Notification events"><h2 className="mb-1 text-lg font-semibold">Events and templates</h2><p className="mb-4 text-sm text-gray-500">Template name and language must match an approved template in your WhatsApp Business Account.</p><div className="space-y-5">{Object.entries(settings.events).map(([event, audiences]) => <article key={event} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"><div className="border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800"><h3 className="font-semibold">{titles[event] ?? event}</h3><p className="text-xs text-gray-500">{event}</p></div><div className="grid gap-4 p-4 xl:grid-cols-2">{Object.entries(audiences).map(([audience, target]) => { const template = target.whatsapp_template ?? { name: '', language: '', parameters: [] }; const available = response?.template_variables?.[event]?.[audience] ?? []; const change = (next: Target) => updateTarget(event, audience, next); const changeTemplate = (next: Template) => change({ ...target, whatsapp_template: next }); return <div key={audience} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"><div className="mb-4 flex items-center justify-between"><h4 className="font-semibold capitalize">{audience}</h4><Switcher checked={target.enabled} disabled={!canEdit} onChange={(enabled) => change({ ...target, enabled })} /></div><div className="mb-4 flex flex-wrap gap-4">{channels.map((channel) => <label key={channel} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={Boolean(target.channels?.[channel])} disabled={!canEdit || !target.enabled} onChange={(e) => change({ ...target, channels: { ...target.channels, [channel]: e.target.checked } })} />{channel}</label>)}</div>{target.channels?.whatsapp && <div className="rounded-lg bg-teal-50 p-4 dark:bg-teal-950/30"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">Meta WhatsApp template</p><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Approved template name<Input value={template.name} disabled={!canEdit} placeholder="agency_approved" onChange={(e) => changeTemplate({ ...template, name: e.target.value })} /></label><label className="text-sm">Language code<Input value={template.language} disabled={!canEdit} placeholder="en_US" onChange={(e) => changeTemplate({ ...template, language: e.target.value })} /></label></div><p className="mt-3 text-xs text-gray-600 dark:text-gray-300">Variables: {available.join(', ') || 'none'}. Match the order of Meta body placeholders.</p><div className="mt-2 space-y-2">{template.parameters.map((value, index) => <div key={index} className="flex items-center gap-2"><span className="w-10 text-xs text-gray-500">{`{{${index + 1}}}`}</span><select className="min-w-0 flex-1 rounded border border-gray-300 bg-white p-2 text-sm dark:bg-gray-800" value={value} disabled={!canEdit} onChange={(e) => changeTemplate({ ...template, parameters: template.parameters.map((v, i) => i === index ? e.target.value : v) })}>{available.map((key) => <option key={key} value={key}>{key}</option>)}</select><button type="button" className="rounded px-2 py-1 text-sm text-red-600" disabled={!canEdit} onClick={() => changeTemplate({ ...template, parameters: template.parameters.filter((_, i) => i !== index) })}>Remove</button></div>)}</div>{available.length > 0 && <button type="button" className="mt-3 text-sm font-medium text-teal-700 underline dark:text-teal-300" disabled={!canEdit || template.parameters.length >= 10} onClick={() => changeTemplate({ ...template, parameters: [...template.parameters, available[0]] })}>Add body parameter</button>}</div>}</div> })}</div></article>)}</div></section>
        {canEdit && <div className="sticky bottom-3 mt-6 flex justify-end"><Button variant="solid" loading={saving} onClick={save}>Save notification settings</Button></div>}
    </AdaptiveCard>
}
