import AdaptiveCard from '@/components/shared/AdaptiveCard'
import RichTextEditor from '@/components/shared/RichTextEditor'
import { Button, Input, Select, Spinner, Switcher, Tabs } from '@/components/ui'
import { billingIconNames, getBillingIcon, type BillingIconName } from '@/configs/billingIcons'
import {
    apiCheckBillingProviderHealth, apiCreateBillingPlan, apiGetBillingSettings,
    apiUpdateBillingPlan, apiUpdateBillingProvider, type AdminBillingPlan,
    type AdminBillingProvider, type BillingPlanFeature, type BillingPlanPayload,
} from '@/services/admin/AdminBillingService'
import usePermission from '@/utils/hooks/usePermission'
import useTranslation from '@/utils/hooks/useTranslation'
import { ArrowDown, ArrowUp, Check, CirclePlus, CreditCard, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

type ProviderForm = Record<string, string | boolean>
type Option<T extends string> = { value: T; label: string }
type Locale = 'en' | 'ar'

const fieldNames = ['base_url', 'public_key', 'secret_key', 'hmac_secret', 'payment_methods', 'checkout_url', 'subscription_endpoint', 'subscription_plan_id', 'moto_integration_id', 'subscription_frequency'] as const
const currencies = ['OMR', 'USD', 'EUR', 'AED', 'SAR'] as const
const intervals = ['monthly', 'annually', 'one_time'] as const

const createFeature = (sortOrder: number): BillingPlanFeature => ({
    id: crypto.randomUUID(), icon: 'badge-check', title: { en: '', ar: '' },
    description: { en: '', ar: '' }, active: true, sort_order: sortOrder,
})

const emptyPlan = (): BillingPlanPayload => ({
    key: '', name: { en: '', ar: '' }, description: { en: '', ar: '' },
    icon: 'sparkles', currency: 'OMR', features: [], active: true, sort_order: 0,
    prices: [{ interval: 'monthly', amount_minor: 0 }, { interval: 'annually', amount_minor: 0 }],
})

const normalizeFeatures = (features?: AdminBillingPlan['features']): BillingPlanFeature[] =>
    (features || []).map((feature, index) => typeof feature === 'string'
        ? { ...createFeature(index), title: { en: feature, ar: feature } }
        : { ...createFeature(index), ...feature, title: { ...feature.title }, description: { ...feature.description }, sort_order: index })

const toPlanPayload = (plan: AdminBillingPlan): BillingPlanPayload => ({
    key: plan.key, name: { en: '', ar: '', ...plan.name }, description: { en: '', ar: '', ...plan.description },
    icon: plan.icon || 'sparkles', currency: plan.currency, features: normalizeFeatures(plan.features),
    active: plan.active, sort_order: plan.sort_order,
    prices: plan.prices.filter((price) => price.active !== false).map(({ interval, amount_minor }) => ({ interval, amount_minor })),
})

const BillingSettings = () => {
    const { t, i18n } = useTranslation()
    const { can } = usePermission()
    const canManageProviders = can('billing.providers.manage')
    const canManagePlans = can('billing.plans.manage')
    const { data, error, isLoading, mutate } = useSWR('/admin/billing/settings', apiGetBillingSettings)
    const [forms, setForms] = useState<Record<number, ProviderForm>>({})
    const [saving, setSaving] = useState<number | null>(null)
    const [checking, setChecking] = useState<number | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [plan, setPlan] = useState<BillingPlanPayload | null>(null)
    const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
    const [savingPlan, setSavingPlan] = useState(false)
    const [contentLocale, setContentLocale] = useState<Locale>('en')

    const option = <T extends string>(value: T, label: string): Option<T> => ({ value, label })
    const iconOptions = billingIconNames.map((name) => option(name, t(`billingAdmin.icons.${name}`)))
    const currencyOptions = currencies.map((currency) => option(currency, currency))
    const intervalOptions = intervals.map((interval) => option(interval, t(`billingAdmin.intervals.${interval === 'one_time' ? 'oneTime' : interval}`)))
    const formFor = (provider: AdminBillingProvider): ProviderForm => forms[provider.id] || {
        enabled: provider.enabled, test_mode: provider.test_mode, base_url: '', public_key: '', secret_key: '', hmac_secret: '', payment_methods: '', checkout_url: '', subscription_endpoint: '', subscription_plan_id: '', moto_integration_id: '', subscription_frequency: 'monthly',
    }

    const updateProviderField = (provider: AdminBillingProvider, field: string, value: string | boolean) =>
        setForms((current) => ({ ...current, [provider.id]: { ...formFor(provider), [field]: value } }))

    const saveProvider = async (provider: AdminBillingProvider) => {
        setSaving(provider.id); setMessage(null)
        try {
            const form = formFor(provider)
            const configuration = Object.fromEntries(fieldNames.map((name) => [name, String(form[name] || '')]))
            await apiUpdateBillingProvider(provider.id, { enabled: Boolean(form.enabled), test_mode: Boolean(form.test_mode), configuration })
            await mutate(); setMessage(t('billingAdmin.saved'))
        } catch { setMessage(t('billingAdmin.saveError')) } finally { setSaving(null) }
    }

    const checkHealth = async (provider: AdminBillingProvider) => {
        setChecking(provider.id); setMessage(null)
        try {
            const response = await apiCheckBillingProviderHealth(provider.id)
            setMessage(!response.health.configured ? t('billingHealth.incomplete') : !response.health.authorized ? t('billingHealth.unauthorized') : response.health.reachable ? t('billingAdmin.healthReachable') : t('billingAdmin.healthUnreachable'))
        } catch { setMessage(t('billingAdmin.healthError')) } finally { setChecking(null) }
    }

    const updatePlan = <K extends keyof BillingPlanPayload>(field: K, value: BillingPlanPayload[K]) => setPlan((current) => current ? { ...current, [field]: value } : current)
    const updateLocalizedPlan = (field: 'name' | 'description', locale: Locale, value: string) => setPlan((current) => current ? { ...current, [field]: { ...(current[field] || {}), [locale]: value } } : current)
    const updateFeature = (index: number, patch: Partial<BillingPlanFeature>) => setPlan((current) => current ? { ...current, features: current.features.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } : current)
    const updatePrice = (index: number, field: 'interval' | 'amount_minor', value: string | number) => setPlan((current) => current ? { ...current, prices: current.prices.map((price, itemIndex) => itemIndex === index ? { ...price, [field]: field === 'amount_minor' ? Number(value) || 0 : value } : price) } : current)
    const moveFeature = (index: number, direction: -1 | 1) => setPlan((current) => {
        if (!current) return current
        const target = index + direction
        if (target < 0 || target >= current.features.length) return current
        const features = [...current.features]; [features[index], features[target]] = [features[target], features[index]]
        return { ...current, features }
    })
    const beginEdit = (item?: AdminBillingPlan) => { setPlan(item ? toPlanPayload(item) : emptyPlan()); setEditingPlanId(item?.id ?? null); setContentLocale('en') }

    const savePlan = async () => {
        if (!plan) return
        setSavingPlan(true); setMessage(null)
        try {
            const payload = { ...plan, key: plan.key.trim(), currency: plan.currency.toUpperCase(), features: plan.features.map((feature, index) => ({ ...feature, sort_order: index })) }
            if (editingPlanId === null) await apiCreateBillingPlan(payload); else await apiUpdateBillingPlan(editingPlanId, payload)
            setPlan(null); setEditingPlanId(null); await mutate(); setMessage(t('billingAdmin.planSaved'))
        } catch { setMessage(t('billingAdmin.planSaveError')) } finally { setSavingPlan(false) }
    }

    if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
    if (error) {
        const status = (error as { response?: { status?: number } }).response?.status
        return <AdaptiveCard>{status === 401 ? t('billingHealth.authRequired') : status === 403 ? t('billingHealth.forbidden') : t('billingAdmin.loadError')}</AdaptiveCard>
    }

    return <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h3>{t('billingAdmin.title')}</h3><p className="mt-1 text-sm text-gray-500">{t('billingAdmin.subtitle')}</p></div>{message ? <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">{message}</div> : null}</div>
        <Tabs defaultValue="plans">
            <Tabs.TabList>
                <Tabs.TabNav value="plans"><span className="flex items-center gap-2"><CreditCard size={17} />{t('billingAdmin.plans')}</span></Tabs.TabNav>
                <Tabs.TabNav value="providers"><span className="flex items-center gap-2"><Settings2 size={17} />{t('billingAdmin.providers')}</span></Tabs.TabNav>
            </Tabs.TabList>
            <Tabs.TabContent value="plans">
                <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <AdaptiveCard className="h-fit">
                        <div className="flex items-center justify-between gap-3"><div><h4>{t('billingAdmin.planList')}</h4><p className="text-xs text-gray-500">{t('billingAdmin.planCount', { count: data?.plans.length || 0 })}</p></div>{canManagePlans ? <Button size="sm" variant="solid" icon={<Plus size={16} />} onClick={() => beginEdit()}>{t('billingAdmin.addPlan')}</Button> : null}</div>
                        <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">{data?.plans.map((item) => {
                            const Icon = getBillingIcon(item.icon); const selected = editingPlanId === item.id
                            return <button type="button" key={item.id} onClick={() => canManagePlans && beginEdit(item)} className={`flex w-full items-center gap-3 px-2 py-3 text-start transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.name?.[i18n.language] || item.name?.ar || item.name?.en || item.key}</span><span className="block truncate text-xs text-gray-500">{item.key} · {item.currency}</span></span><span title={item.active ? t('billingAdmin.active') : t('billingAdmin.inactive')} className={`h-2.5 w-2.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-gray-300'}`} /></button>
                        })}</div>
                    </AdaptiveCard>
                    <AdaptiveCard>{!plan ? <div className="flex min-h-72 flex-col items-center justify-center text-center"><Pencil className="mb-3 text-gray-400" size={30} /><h4>{t('billingAdmin.selectPlanTitle')}</h4><p className="mt-1 max-w-md text-sm text-gray-500">{t('billingAdmin.selectPlanHint')}</p></div> : <PlanEditor plan={plan} editing={editingPlanId !== null} saving={savingPlan} locale={contentLocale} iconOptions={iconOptions} currencyOptions={currencyOptions} intervalOptions={intervalOptions} t={t} onLocale={setContentLocale} updatePlan={updatePlan} updateLocalizedPlan={updateLocalizedPlan} updateFeature={updateFeature} moveFeature={moveFeature} updatePrice={updatePrice} save={savePlan} cancel={() => { setPlan(null); setEditingPlanId(null) }} />}</AdaptiveCard>
                </div>
            </Tabs.TabContent>
            <Tabs.TabContent value="providers"><div className="mt-5 grid gap-5 xl:grid-cols-2">{data?.providers.map((provider) => {
                const form = formFor(provider)
                return <AdaptiveCard key={provider.id}><div className="mb-4 flex items-center justify-between"><h4>{provider.name}</h4><span className="text-sm text-gray-500">{provider.key}</span></div>{canManageProviders ? <><div className="mb-4 flex gap-6"><Switcher checked={Boolean(form.enabled)} onChange={(value) => updateProviderField(provider, 'enabled', value)}>{t('billingAdmin.enabled')}</Switcher><Switcher checked={Boolean(form.test_mode)} onChange={(value) => updateProviderField(provider, 'test_mode', value)}>{t('billingAdmin.testMode')}</Switcher></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{fieldNames.map((field) => <label key={field} className="text-sm"><span className="mb-1 block">{t(`billingAdmin.fields.${field}`)}</span><Input type={field.includes('secret') ? 'password' : 'text'} value={String(form[field] || '')} onChange={(event) => updateProviderField(provider, field, event.target.value)} /></label>)}</div><div className="mt-5 flex gap-3"><Button variant="solid" loading={saving === provider.id} onClick={() => saveProvider(provider)}>{t('billingAdmin.save')}</Button><Button loading={checking === provider.id} onClick={() => checkHealth(provider)}>{t('billingAdmin.testConnection')}</Button></div></> : null}</AdaptiveCard>
            })}</div></Tabs.TabContent>
        </Tabs>
    </div>
}

type PlanEditorProps = {
    plan: BillingPlanPayload; editing: boolean; saving: boolean; locale: Locale
    iconOptions: Option<BillingIconName>[]; currencyOptions: Option<string>[]; intervalOptions: Option<string>[]
    t: (key: string, values?: Record<string, unknown>) => string; onLocale: (locale: Locale) => void
    updatePlan: <K extends keyof BillingPlanPayload>(field: K, value: BillingPlanPayload[K]) => void
    updateLocalizedPlan: (field: 'name' | 'description', locale: Locale, value: string) => void
    updateFeature: (index: number, patch: Partial<BillingPlanFeature>) => void
    moveFeature: (index: number, direction: -1 | 1) => void
    updatePrice: (index: number, field: 'interval' | 'amount_minor', value: string | number) => void
    save: () => void; cancel: () => void
}

const PlanEditor = ({ plan, editing, saving, locale, iconOptions, currencyOptions, intervalOptions, t, onLocale, updatePlan, updateLocalizedPlan, updateFeature, moveFeature, updatePrice, save, cancel }: PlanEditorProps) => <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 dark:border-gray-700"><div><h4>{editing ? t('billingAdmin.editPlan') : t('billingAdmin.newPlan')}</h4><p className="text-sm text-gray-500">{t('billingAdmin.editorHint')}</p></div><Switcher checked={plan.active} onChange={(value) => updatePlan('active', value)}>{t('billingAdmin.active')}</Switcher></div>
    <Tabs defaultValue="basics">
        <Tabs.TabList><Tabs.TabNav value="basics">{t('billingAdmin.tabs.basics')}</Tabs.TabNav><Tabs.TabNav value="content">{t('billingAdmin.tabs.content')}</Tabs.TabNav><Tabs.TabNav value="features">{t('billingAdmin.tabs.features')} ({plan.features.length})</Tabs.TabNav><Tabs.TabNav value="pricing">{t('billingAdmin.tabs.pricing')}</Tabs.TabNav></Tabs.TabList>
        <Tabs.TabContent value="basics"><div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2"><Field label={t('billingAdmin.planFields.key')}><Input disabled={editing} value={plan.key} onChange={(event) => updatePlan('key', event.target.value)} /></Field><Field label={t('billingAdmin.planFields.icon')}><IconSelect value={plan.icon} options={iconOptions} onChange={(value) => updatePlan('icon', value)} /></Field><Field label={t('billingAdmin.planFields.currency')}><Select<Option<string>> options={currencyOptions} value={currencyOptions.find((item) => item.value === plan.currency)} onChange={(item) => item && updatePlan('currency', item.value)} /></Field><Field label={t('billingAdmin.planFields.sortOrder')}><Input type="number" min={0} value={String(plan.sort_order)} onChange={(event) => updatePlan('sort_order', Number(event.target.value) || 0)} /></Field></div></Tabs.TabContent>
        <Tabs.TabContent value="content"><div className="mt-5 space-y-5"><LocaleSwitch locale={locale} onChange={onLocale} t={t} /><Field label={t('billingAdmin.planFields.name')} dir={locale === 'ar' ? 'rtl' : 'ltr'}><Input value={plan.name[locale] || ''} onChange={(event) => updateLocalizedPlan('name', locale, event.target.value)} /></Field><Field label={t('billingAdmin.planFields.description')} dir={locale === 'ar' ? 'rtl' : 'ltr'}><RichTextEditor content={plan.description?.[locale] || ''} onChange={({ html }) => updateLocalizedPlan('description', locale, html)} editorContentClass={locale === 'ar' ? 'text-right' : 'text-left'} /></Field></div></Tabs.TabContent>
        <Tabs.TabContent value="features"><div className="mt-5 space-y-4"><div className="flex items-center justify-between gap-3"><div><h5>{t('billingAdmin.featuresTitle')}</h5><p className="text-sm text-gray-500">{t('billingAdmin.featuresHint')}</p></div><Button size="sm" icon={<CirclePlus size={16} />} onClick={() => updatePlan('features', [...plan.features, createFeature(plan.features.length)])}>{t('billingAdmin.addFeature')}</Button></div><LocaleSwitch locale={locale} onChange={onLocale} t={t} />{plan.features.length === 0 ? <div className="rounded-md border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500">{t('billingAdmin.noFeatures')}</div> : plan.features.map((feature, index) => <FeatureEditor key={feature.id} feature={feature} index={index} count={plan.features.length} locale={locale} iconOptions={iconOptions} t={t} update={(patch) => updateFeature(index, patch)} move={(direction) => moveFeature(index, direction)} remove={() => updatePlan('features', plan.features.filter((_, itemIndex) => itemIndex !== index))} />)}</div></Tabs.TabContent>
        <Tabs.TabContent value="pricing"><div className="mt-5 space-y-3">{plan.prices.map((price, index) => <div className="grid grid-cols-1 items-end gap-3 rounded-md border border-gray-200 p-4 md:grid-cols-[1fr_1fr_auto] dark:border-gray-700" key={`${price.interval}-${index}`}><Field label={t('billingAdmin.planFields.interval')}><Select<Option<string>> options={intervalOptions} value={intervalOptions.find((item) => item.value === price.interval)} onChange={(item) => item && updatePrice(index, 'interval', item.value)} /></Field><Field label={t('billingAdmin.planFields.amountMinor')}><Input type="number" min={0} value={String(price.amount_minor)} onChange={(event) => updatePrice(index, 'amount_minor', event.target.value)} /></Field><Button icon={<Trash2 size={16} />} disabled={plan.prices.length === 1} onClick={() => updatePlan('prices', plan.prices.filter((_, itemIndex) => itemIndex !== index))}>{t('billingAdmin.remove')}</Button></div>)}<Button size="sm" icon={<Plus size={16} />} onClick={() => updatePlan('prices', [...plan.prices, { interval: 'one_time', amount_minor: 0 }])}>{t('billingAdmin.addPrice')}</Button></div></Tabs.TabContent>
    </Tabs>
    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700"><Button onClick={cancel}>{t('billingAdmin.cancel')}</Button><Button variant="solid" loading={saving} icon={<Check size={17} />} onClick={save}>{t('billingAdmin.savePlan')}</Button></div>
</>

const Field = ({ label, children, dir }: { label: string; children: React.ReactNode; dir?: 'rtl' | 'ltr' }) => <label className="block text-sm" dir={dir}><span className="mb-1.5 block font-medium">{label}</span>{children}</label>
const LocaleSwitch = ({ locale, onChange, t }: { locale: Locale; onChange: (locale: Locale) => void; t: (key: string) => string }) => <div className="inline-flex w-fit rounded-md bg-gray-100 p-1 dark:bg-gray-700">{(['en', 'ar'] as Locale[]).map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`rounded px-4 py-2 text-sm font-medium ${locale === item ? 'bg-white shadow-sm dark:bg-gray-600' : 'text-gray-500'}`}>{t(`billingAdmin.locales.${item}`)}</button>)}</div>
const IconSelect = ({ value, options, onChange }: { value: BillingIconName; options: Option<BillingIconName>[]; onChange: (value: BillingIconName) => void }) => <Select<Option<BillingIconName>> options={options} value={options.find((item) => item.value === value)} onChange={(item) => item && onChange(item.value)} formatOptionLabel={(item) => { const Icon = getBillingIcon(item.value); return <span className="flex items-center gap-2"><Icon size={17} />{item.label}</span> }} />

const FeatureEditor = ({ feature, index, count, locale, iconOptions, t, update, move, remove }: { feature: BillingPlanFeature; index: number; count: number; locale: Locale; iconOptions: Option<BillingIconName>[]; t: (key: string) => string; update: (patch: Partial<BillingPlanFeature>) => void; move: (direction: -1 | 1) => void; remove: () => void }) => {
    const Icon = getBillingIcon(feature.icon)
    return <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700"><div className="flex flex-wrap items-center gap-3 border-b border-gray-200 pb-3 dark:border-gray-700"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700"><Icon size={18} /></span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{feature.title[locale] || t('billingAdmin.untitledFeature')}</span><Switcher checked={feature.active} onChange={(active) => update({ active })} /><Button size="xs" icon={<ArrowUp size={15} />} disabled={index === 0} title={t('billingAdmin.moveUp')} onClick={() => move(-1)} /><Button size="xs" icon={<ArrowDown size={15} />} disabled={index === count - 1} title={t('billingAdmin.moveDown')} onClick={() => move(1)} /><Button size="xs" icon={<Trash2 size={15} />} title={t('billingAdmin.remove')} onClick={remove} /></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label={t('billingAdmin.planFields.featureIcon')}><IconSelect value={feature.icon} options={iconOptions} onChange={(icon) => update({ icon })} /></Field><Field label={t('billingAdmin.planFields.featureTitle')} dir={locale === 'ar' ? 'rtl' : 'ltr'}><Input value={feature.title[locale]} onChange={(event) => update({ title: { ...feature.title, [locale]: event.target.value } })} /></Field></div><div className="mt-4"><Field label={t('billingAdmin.planFields.featureDescription')} dir={locale === 'ar' ? 'rtl' : 'ltr'}><RichTextEditor content={feature.description[locale]} onChange={({ html }) => update({ description: { ...feature.description, [locale]: html } })} editorContentClass={`min-h-24 ${locale === 'ar' ? 'text-right' : 'text-left'}`} /></Field></div></section>
}

export default BillingSettings
