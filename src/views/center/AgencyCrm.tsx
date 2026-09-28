import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Button, Card, Input } from '@/components/ui'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    createCrmCampaign, getCrmAudience, getCrmCampaigns, getCrmCustomer,
    getCrmCustomers, getCrmSettings, saveCrmSettings,
    type CrmCampaign, type CrmCustomer, type CrmSettings,
} from '@/services/AgencyCrmService'

const channels = ['whatsapp', 'sms', 'email', 'push'] as const
const segments = ['all', 'new', 'active', 'inactive'] as const

export default function AgencyCrm() {
    const { agencySlug = '' } = useParams()
    const { t } = useTranslation()
    const [tab, setTab] = useState<'customers' | 'campaigns' | 'settings'>('customers')
    const [customers, setCustomers] = useState<CrmCustomer[]>([])
    const [campaigns, setCampaigns] = useState<CrmCampaign[]>([])
    const [settings, setSettings] = useState<CrmSettings | null>(null)
    const [selected, setSelected] = useState<Awaited<ReturnType<typeof getCrmCustomer>>['data'] | null>(null)
    const [search, setSearch] = useState('')
    const [segment, setSegment] = useState<string>('all')
    const [audience, setAudience] = useState<number | null>(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [offer, setOffer] = useState({ title: '', body: '', code: '', discount_amount: '', expires_at: '', max_uses: '', scheduled_at: '', channels: ['sms', 'email'] as string[], whatsapp_name: '', whatsapp_language: 'en_US' })

    const load = useCallback(async () => {
        try {
            const [customerResponse, campaignResponse, settingsResponse] = await Promise.all([
                getCrmCustomers(agencySlug, { q: search, segment }),
                getCrmCampaigns(agencySlug), getCrmSettings(agencySlug),
            ])
            setCustomers(customerResponse.data)
            setCampaigns(campaignResponse.data.data)
            setSettings(settingsResponse.data)
            setError('')
        } catch {
            setError(t('agencyCrm.loadError'))
        }
    }, [agencySlug, search, segment, t])

    useEffect(() => { if (agencySlug) void load() }, [agencySlug, load])
    useEffect(() => {
        if (!agencySlug) return
        getCrmAudience(agencySlug, segment).then((result) => setAudience(result.data.count)).catch(() => setAudience(null))
    }, [agencySlug, segment])

    const toggleChannel = (value: string) => {
        setOffer((current) => ({ ...current, channels: current.channels.includes(value) ? current.channels.filter((channel) => channel !== value) : [...current.channels, value] }))
    }

    const submitCampaign = async () => {
        setBusy(true)
        try {
            await createCrmCampaign(agencySlug, {
                title: offer.title, body: offer.body, segment, channels: offer.channels,
                scheduled_at: offer.scheduled_at,
                ...(offer.code ? { code: offer.code, discount_amount: offer.discount_amount, expires_at: offer.expires_at, max_uses: Number(offer.max_uses) } : {}),
                ...(offer.channels.includes('whatsapp') && offer.whatsapp_name ? { whatsapp_template: { name: offer.whatsapp_name, language: offer.whatsapp_language } } : {}),
            })
            setOffer({ ...offer, title: '', body: '', code: '' })
            await load()
        } catch { setError(t('agencyCrm.saveError')) }
        finally { setBusy(false) }
    }

    const submitSettings = async () => {
        if (!settings) return
        setBusy(true)
        try {
            const response = await saveCrmSettings(agencySlug, {
                appointment_enabled: settings.appointment_enabled,
                appointment_hours: Number(settings.appointment_hours),
                winback_enabled: settings.winback_enabled,
                winback_days: Number(settings.winback_days),
                points_per_omr: settings.points_per_omr ? Number(settings.points_per_omr) : null,
                points_per_omr_discount: settings.points_per_omr_discount ? Number(settings.points_per_omr_discount) : null,
                reminder_channels: Array.isArray(settings.reminder_channels) ? settings.reminder_channels : JSON.parse(settings.reminder_channels || '[]'),
            })
            setSettings(response.data)
            setError('')
        } catch { setError(t('agencyCrm.saveError')) }
        finally { setBusy(false) }
    }

    return <div className="space-y-5 p-4">
        <div><h1 className="text-2xl font-bold">{t('agencyCrm.title')}</h1><p className="text-sm text-gray-500">{t('agencyCrm.subtitle')}</p></div>
        <div className="flex gap-2">{(['customers', 'campaigns', 'settings'] as const).map((value) => <Button key={value} variant={tab === value ? 'solid' : 'plain'} onClick={() => setTab(value)}>{t(`agencyCrm.${value}`)}</Button>)}</div>
        {error && <Card><p role="alert" className="text-red-600">{error}</p></Card>}
        {tab === 'customers' && <Card className="space-y-4">
            <div className="flex flex-wrap gap-3"><Input aria-label={t('agencyCrm.search')} placeholder={t('agencyCrm.search')} value={search} onChange={(event) => setSearch(event.target.value)} /><select className="rounded border p-2" aria-label={t('agencyCrm.segment')} value={segment} onChange={(event) => setSegment(event.target.value)}>{segments.map((value) => <option key={value} value={value}>{t(`agencyCrm.segment_${value}`)}</option>)}</select></div>
            <div className="overflow-x-auto"><table className="w-full text-start text-sm"><thead><tr><th className="p-2 text-start">{t('agencyCrm.customer')}</th><th className="p-2 text-start">{t('agencyCrm.mobile')}</th><th className="p-2 text-start">{t('agencyCrm.lastVisit')}</th><th className="p-2 text-start">{t('agencyCrm.paid')}</th><th className="p-2 text-start">{t('agencyCrm.points')}</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-t"><td className="p-2"><button className="text-blue-600 underline" onClick={() => getCrmCustomer(agencySlug, customer.id).then((response) => setSelected(response.data)).catch(() => setError(t('agencyCrm.loadError')))}>{customer.name || customer.mobile}</button></td><td className="p-2">{customer.mobile}</td><td className="p-2">{customer.last_visit_at || '—'}</td><td className="p-2">{customer.paid_total} OMR</td><td className="p-2">{customer.points_balance}</td></tr>)}</tbody></table></div>
            {selected && <div className="border-t pt-4"><Button size="xs" onClick={() => setSelected(null)}>{t('agencyCrm.close')}</Button><h2 className="my-2 font-bold">{selected.customer.name}</h2><p>{t('agencyCrm.reservations')}: {selected.reservations.length} · {t('agencyCrm.messages')}: {selected.messages.length}</p><div className="mt-2 max-h-56 overflow-auto">{selected.reservations.map((reservation) => <p key={reservation.id} className="border-b py-1">#{reservation.id} · {reservation.date} · {reservation.service} · {reservation.invoice?.total || '—'} · {reservation.status}</p>)}</div></div>}
        </Card>}
        {tab === 'campaigns' && <div className="grid gap-4 lg:grid-cols-2"><Card className="space-y-3"><h2 className="font-bold">{t('agencyCrm.newCampaign')}</h2><Input placeholder={t('agencyCrm.campaignTitle')} value={offer.title} onChange={(event) => setOffer({ ...offer, title: event.target.value })} /><textarea className="w-full rounded border p-2" aria-label={t('agencyCrm.body')} placeholder={t('agencyCrm.body')} value={offer.body} onChange={(event) => setOffer({ ...offer, body: event.target.value })} /><select className="w-full rounded border p-2" aria-label={t('agencyCrm.segment')} value={segment} onChange={(event) => setSegment(event.target.value)}>{segments.map((value) => <option key={value} value={value}>{t(`agencyCrm.segment_${value}`)}</option>)}</select><p>{t('agencyCrm.audience')}: {audience ?? '—'}</p><div className="flex flex-wrap gap-3">{channels.map((channel) => <label key={channel}><input type="checkbox" checked={offer.channels.includes(channel)} onChange={() => toggleChannel(channel)} /> {channel}</label>)}</div>{offer.channels.includes('whatsapp') && <div className="grid gap-2"><Input placeholder={t('agencyCrm.templateName')} value={offer.whatsapp_name} onChange={(event) => setOffer({ ...offer, whatsapp_name: event.target.value })} /><Input placeholder={t('agencyCrm.templateLanguage')} value={offer.whatsapp_language} onChange={(event) => setOffer({ ...offer, whatsapp_language: event.target.value })} /></div>}<Input placeholder={t('agencyCrm.code')} value={offer.code} onChange={(event) => setOffer({ ...offer, code: event.target.value })} />{offer.code && <div className="grid gap-2"><Input type="number" min="0.01" step="0.01" placeholder={t('agencyCrm.discount')} value={offer.discount_amount} onChange={(event) => setOffer({ ...offer, discount_amount: event.target.value })} /><label>{t('agencyCrm.expiry')}<Input type="datetime-local" value={offer.expires_at} onChange={(event) => setOffer({ ...offer, expires_at: event.target.value })} /></label><Input type="number" min="1" placeholder={t('agencyCrm.maxUses')} value={offer.max_uses} onChange={(event) => setOffer({ ...offer, max_uses: event.target.value })} /></div>}<label>{t('agencyCrm.schedule')}<Input type="datetime-local" value={offer.scheduled_at} onChange={(event) => setOffer({ ...offer, scheduled_at: event.target.value })} /></label><Button variant="solid" loading={busy} onClick={submitCampaign}>{t('agencyCrm.create')}</Button></Card><Card><h2 className="mb-3 font-bold">{t('agencyCrm.campaigns')}</h2>{campaigns.map((campaign) => <p key={campaign.id} className="border-b py-2">{campaign.title} · {campaign.code || '—'} · {campaign.scheduled_at} · {campaign.status} · {campaign.use_count}</p>)}</Card></div>}
        {tab === 'settings' && settings && <Card className="grid max-w-xl gap-3"><h2 className="font-bold">{t('agencyCrm.settings')}</h2><label><input type="checkbox" checked={Boolean(settings.appointment_enabled)} onChange={(event) => setSettings({ ...settings, appointment_enabled: event.target.checked })} /> {t('agencyCrm.appointment')}</label><label>{t('agencyCrm.hours')}<Input type="number" min="1" value={settings.appointment_hours} onChange={(event) => setSettings({ ...settings, appointment_hours: Number(event.target.value) })} /></label><label><input type="checkbox" checked={Boolean(settings.winback_enabled)} onChange={(event) => setSettings({ ...settings, winback_enabled: event.target.checked })} /> {t('agencyCrm.winback')}</label><label>{t('agencyCrm.days')}<Input type="number" min="1" value={settings.winback_days} onChange={(event) => setSettings({ ...settings, winback_days: Number(event.target.value) })} /></label><label>{t('agencyCrm.earnRate')}<Input type="number" min="1" value={settings.points_per_omr ?? ''} onChange={(event) => setSettings({ ...settings, points_per_omr: event.target.value ? Number(event.target.value) : null })} /></label><label>{t('agencyCrm.redeemRate')}<Input type="number" min="1" value={settings.points_per_omr_discount ?? ''} onChange={(event) => setSettings({ ...settings, points_per_omr_discount: event.target.value ? Number(event.target.value) : null })} /></label><Button variant="solid" loading={busy} onClick={submitSettings}>{t('agencyCrm.save')}</Button></Card>}
    </div>
}
