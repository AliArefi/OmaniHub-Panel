import { useEffect, useState } from 'react'
import useSWR from 'swr'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import usePermission from '@/utils/hooks/usePermission'
import useTranslation from '@/utils/hooks/useTranslation'
import { apiGetSingletonSettings, apiUpdateSingletonSettings } from '@/services/admin/AdminSettingsService'

type Provider = { id: number; name: string; provider_type: string; is_active: boolean; supported_channels: string[]; secrets?: Record<string, string>; meta?: Record<string, string> }
type Field = { path: string; label: string; type?: string; bucket: 'secrets' | 'meta' }

export default function MessagingProvidersSettings() {
    const { t } = useTranslation()
    const { can } = usePermission()
    const canEdit = can('update notification settings')
    const { data, mutate } = useSWR('admin-settings-messaging-providers', () => apiGetSingletonSettings<Provider[]>('messaging-providers'))
    const definitions = (data as unknown as { provider_definitions?: Record<string, { fields?: Field[] }> } | undefined)?.provider_definitions
    const providers = (data?.data as unknown as Provider[]) ?? []
    const [forms, setForms] = useState<Record<number, Record<string, string | boolean>>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const next: Record<number, Record<string, string | boolean>> = {}
        providers.forEach((provider) => { next[provider.id] = { active: provider.is_active, ...(provider.secrets ?? {}), ...(provider.meta ?? {}) } })
        setForms(next)
    }, [data])

    const update = (id: number, key: string, value: string | boolean) => setForms((current) => ({ ...current, [id]: { ...current[id], [key]: value } }))
    const save = async () => {
        setSaving(true)
        try {
            await apiUpdateSingletonSettings('messaging-providers', { providers: providers.map((provider) => {
                const form = forms[provider.id] ?? {}
                const fields = definitions?.[provider.provider_type]?.fields ?? []
                const secrets: Record<string, string> = {}; const meta: Record<string, string> = {}
                fields.forEach((field) => { const value = form[field.path]; if (typeof value === 'string' && value) (field.bucket === 'secrets' ? secrets : meta)[field.path] = value })
                return { id: provider.id, name: provider.name, provider_type: provider.provider_type, is_active: Boolean(form.active), supported_channels: provider.supported_channels, secrets, meta }
            }) })
            toast.push(<Notification type="success" title={t('adminSettings.saved')} />); mutate()
        } catch { toast.push(<Notification type="danger" title={t('adminSettings.saveError')} />) } finally { setSaving(false) }
    }

    return <AdaptiveCard><h4 className="mb-2">Messaging providers</h4><p className="text-sm text-gray-500 mb-6">Configure Meta WhatsApp Cloud API and other notification providers.</p><div className="grid gap-5">{providers.map((provider) => { const form = forms[provider.id] ?? {}; const fields = definitions?.[provider.provider_type]?.fields ?? []; return <div key={provider.id} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4"><div className="flex items-center justify-between mb-4"><div><h6>{provider.name}</h6><span className="text-xs text-gray-500">{provider.provider_type}</span></div><Switcher checked={Boolean(form.active)} disabled={!canEdit} onChange={(value) => update(provider.id, 'active', value)} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields.map((field) => <label key={field.path} className="text-sm"><span className="block mb-1">{field.label}</span><Input type={field.type === 'password' ? 'password' : 'text'} value={String(form[field.path] ?? '')} disabled={!canEdit} onChange={(event) => update(provider.id, field.path, event.target.value)} /></label>)}</div></div> })}</div>{canEdit && <div className="flex justify-end mt-6"><Button variant="solid" loading={saving} onClick={save}>Save messaging settings</Button></div>}</AdaptiveCard>
}
