import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Switcher from '@/components/ui/Switcher'
import {
    apiCheckBillingProviderHealth,
    apiCreateBillingPlan,
    apiGetBillingSettings,
    apiUpdateBillingPlan,
    apiUpdateBillingProvider,
    type AdminBillingPlan,
    type AdminBillingProvider,
    type BillingPlanPayload,
} from '@/services/admin/AdminBillingService'
import useTranslation from '@/utils/hooks/useTranslation'
import usePermission from '@/utils/hooks/usePermission'
import { useState } from 'react'
import useSWR from 'swr'

type ProviderForm = Record<string, string | boolean>

const fieldNames = ['base_url', 'public_key', 'secret_key', 'hmac_secret', 'payment_methods', 'checkout_url', 'subscription_endpoint', 'subscription_plan_id', 'moto_integration_id', 'subscription_frequency'] as const

const emptyPlan = (): BillingPlanPayload => ({
    key: '',
    name: { en: '', ar: '' },
    description: { en: '', ar: '' },
    currency: 'OMR',
    active: true,
    sort_order: 0,
    prices: [
        { interval: 'monthly', amount_minor: 0 },
        { interval: 'annually', amount_minor: 0 },
    ],
})

const toPlanPayload = (plan: AdminBillingPlan): BillingPlanPayload => ({
    key: plan.key,
    name: plan.name,
    description: plan.description || { en: '', ar: '' },
    currency: plan.currency,
    active: plan.active,
    sort_order: plan.sort_order,
    prices: plan.prices.filter((price) => price.active !== false).map(({ interval, amount_minor }) => ({ interval, amount_minor })),
})

const BillingSettings = () => {
    const { t } = useTranslation()
    const { can } = usePermission()
    const canManageProviders = can('billing.providers.manage')
    const canManagePlans = can('billing.plans.manage')
    const { data, error, isLoading, mutate } = useSWR('/admin/billing/settings', apiGetBillingSettings)
    const [forms, setForms] = useState<Record<number, ProviderForm>>({})
    const [saving, setSaving] = useState<number | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [checking, setChecking] = useState<number | null>(null)
    const [plan, setPlan] = useState<BillingPlanPayload | null>(null)
    const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
    const [savingPlan, setSavingPlan] = useState(false)

    const formFor = (provider: AdminBillingProvider): ProviderForm => forms[provider.id] || {
        enabled: provider.enabled,
        test_mode: provider.test_mode,
        base_url: '', public_key: '', secret_key: '', hmac_secret: '', payment_methods: '', checkout_url: '', subscription_endpoint: '', subscription_plan_id: '', moto_integration_id: '', subscription_frequency: 'monthly',
    }

    const updateField = (provider: AdminBillingProvider, field: string, value: string | boolean) =>
        setForms((current) => ({ ...current, [provider.id]: { ...formFor(provider), [field]: value } }))

    const save = async (provider: AdminBillingProvider) => {
        const form = formFor(provider)
        setSaving(provider.id)
        setMessage(null)
        try {
            const configuration = Object.fromEntries(fieldNames.map((name) => [name, String(form[name] || '')]))
            await apiUpdateBillingProvider(provider.id, {
                enabled: Boolean(form.enabled),
                test_mode: Boolean(form.test_mode),
                configuration,
            })
            await mutate()
            setMessage(t('billingAdmin.saved'))
        } catch {
            setMessage(t('billingAdmin.saveError'))
        } finally {
            setSaving(null)
        }
    }

    const checkHealth = async (provider: AdminBillingProvider) => {
        setChecking(provider.id)
        setMessage(null)
        try {
            const response = await apiCheckBillingProviderHealth(provider.id)
            setMessage(response.health.reachable ? t('billingAdmin.healthReachable') : t('billingAdmin.healthUnreachable'))
        } catch {
            setMessage(t('billingAdmin.healthError'))
        } finally {
            setChecking(null)
        }
    }

    const savePlan = async () => {
        if (!plan) return
        setSavingPlan(true)
        setMessage(null)
        try {
            if (editingPlanId === null) await apiCreateBillingPlan(plan)
            else await apiUpdateBillingPlan(editingPlanId, plan)
            setPlan(null)
            setEditingPlanId(null)
            await mutate()
            setMessage(t('billingAdmin.planSaved'))
        } catch {
            setMessage(t('billingAdmin.planSaveError'))
        } finally {
            setSavingPlan(false)
        }
    }

    const updatePlan = (field: keyof BillingPlanPayload, value: BillingPlanPayload[keyof BillingPlanPayload]) =>
        setPlan((current) => current ? { ...current, [field]: value } : current)

    const updateLocalizedPlanField = (field: 'name' | 'description', locale: 'en' | 'ar', value: string) =>
        setPlan((current) => current ? {
            ...current,
            [field]: { ...(current[field] || {}), [locale]: value },
        } : current)

    const updatePrice = (index: number, field: 'interval' | 'amount_minor', value: string) =>
        setPlan((current) => current ? {
            ...current,
            prices: current.prices.map((price, priceIndex) => priceIndex === index
                ? { ...price, [field]: field === 'amount_minor' ? Number(value) || 0 : value }
                : price),
        } : current)

    if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
    if (error) return <AdaptiveCard>{t('billingAdmin.loadError')}</AdaptiveCard>

    return <div className="space-y-4">
        <div><h3>{t('billingAdmin.title')}</h3><p className="text-sm text-gray-500">{t('billingAdmin.subtitle')}</p></div>
        {message ? <p className="text-sm text-primary">{message}</p> : null}
        {data?.providers.map((provider) => {
            const form = formFor(provider)
            return <AdaptiveCard key={provider.id}>
                <div className="mb-4 flex items-center justify-between"><h4>{provider.name}</h4><span className="text-sm text-gray-500">{provider.key}</span></div>
                {canManageProviders ? <>
                    <div className="mb-4 flex gap-6"><Switcher checked={Boolean(form.enabled)} onChange={(value) => updateField(provider, 'enabled', value)}>{t('billingAdmin.enabled')}</Switcher><Switcher checked={Boolean(form.test_mode)} onChange={(value) => updateField(provider, 'test_mode', value)}>{t('billingAdmin.testMode')}</Switcher></div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {fieldNames.map((field) => <label key={field} className="text-sm"><span className="mb-1 block">{t(`billingAdmin.fields.${field}`)}</span><Input type={field.includes('secret') ? 'password' : 'text'} value={String(form[field] || '')} onChange={(event) => updateField(provider, field, event.target.value)} /></label>)}
                    </div>
                    <div className="mt-5 flex gap-3"><Button variant="solid" loading={saving === provider.id} onClick={() => save(provider)}>{t('billingAdmin.save')}</Button><Button loading={checking === provider.id} onClick={() => checkHealth(provider)}>{t('billingAdmin.testConnection')}</Button></div>
                </> : null}
            </AdaptiveCard>
        })}
        <AdaptiveCard>
            <div className="flex items-center justify-between gap-3"><h4>{t('billingAdmin.plans')}</h4>{canManagePlans ? <Button size="sm" variant="solid" onClick={() => { setPlan(emptyPlan()); setEditingPlanId(null) }}>{t('billingAdmin.addPlan')}</Button> : null}</div>
            {plan && canManagePlans ? <div className="mt-5 space-y-4 border-t pt-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-sm"><span className="mb-1 block">{t('billingAdmin.planFields.key')}</span><Input disabled={editingPlanId !== null} value={plan.key} onChange={(event) => updatePlan('key', event.target.value)} /></label>
                    <label className="text-sm"><span className="mb-1 block">{t('billingAdmin.planFields.currency')}</span><Input maxLength={3} value={plan.currency} onChange={(event) => updatePlan('currency', event.target.value.toUpperCase())} /></label>
                    <label className="text-sm"><span className="mb-1 block">{t('billingAdmin.planFields.nameEn')}</span><Input value={plan.name.en || ''} onChange={(event) => updateLocalizedPlanField('name', 'en', event.target.value)} /></label>
                    <label className="text-sm"><span className="mb-1 block">{t('billingAdmin.planFields.nameAr')}</span><Input dir="rtl" value={plan.name.ar || ''} onChange={(event) => updateLocalizedPlanField('name', 'ar', event.target.value)} /></label>
                    <label className="text-sm md:col-span-2"><span className="mb-1 block">{t('billingAdmin.planFields.descriptionEn')}</span><Input value={plan.description?.en || ''} onChange={(event) => updateLocalizedPlanField('description', 'en', event.target.value)} /></label>
                    <label className="text-sm md:col-span-2"><span className="mb-1 block">{t('billingAdmin.planFields.descriptionAr')}</span><Input dir="rtl" value={plan.description?.ar || ''} onChange={(event) => updateLocalizedPlanField('description', 'ar', event.target.value)} /></label>
                    <label className="text-sm"><span className="mb-1 block">{t('billingAdmin.planFields.sortOrder')}</span><Input type="number" min={0} value={String(plan.sort_order)} onChange={(event) => updatePlan('sort_order', Number(event.target.value) || 0)} /></label>
                    <div className="flex items-end"><Switcher checked={plan.active} onChange={(value) => updatePlan('active', value)}>{t('billingAdmin.active')}</Switcher></div>
                </div>
                <div><p className="mb-2 text-sm font-semibold">{t('billingAdmin.prices')}</p><div className="space-y-2">{plan.prices.map((price, index) => <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3" key={`${price.interval}-${index}`}><label className="text-sm"><span className="mb-1 block">{t('billingAdmin.planFields.interval')}</span><select className="input input-md h-11 w-full rounded-md" value={price.interval} onChange={(event) => updatePrice(index, 'interval', event.target.value)}><option value="monthly">{t('billingAdmin.intervals.monthly')}</option><option value="annually">{t('billingAdmin.intervals.annually')}</option><option value="one_time">{t('billingAdmin.intervals.oneTime')}</option></select></label><label className="text-sm"><span className="mb-1 block">{t('billingAdmin.planFields.amountMinor')}</span><Input type="number" min={0} value={String(price.amount_minor)} onChange={(event) => updatePrice(index, 'amount_minor', event.target.value)} /></label><Button size="sm" disabled={plan.prices.length === 1} onClick={() => updatePlan('prices', plan.prices.filter((_, priceIndex) => priceIndex !== index))}>{t('billingAdmin.remove')}</Button></div>)}</div><Button size="sm" className="mt-3" onClick={() => updatePlan('prices', [...plan.prices, { interval: 'one_time', amount_minor: 0 }])}>{t('billingAdmin.addPrice')}</Button></div>
                <div className="flex gap-3"><Button variant="solid" loading={savingPlan} onClick={savePlan}>{t('billingAdmin.savePlan')}</Button><Button onClick={() => { setPlan(null); setEditingPlanId(null) }}>{t('billingAdmin.cancel')}</Button></div>
            </div> : null}
            <ul className="mt-4 space-y-2">{data?.plans.map((billingPlan) => <li className="flex items-center justify-between gap-3 rounded border p-3" key={billingPlan.id}><span>{billingPlan.key} · {billingPlan.currency} · {billingPlan.prices.filter((price) => price.active !== false).map((price) => `${price.interval}: ${price.amount_minor}`).join(', ')}</span>{canManagePlans ? <Button size="sm" onClick={() => { setPlan(toPlanPayload(billingPlan)); setEditingPlanId(billingPlan.id) }}>{t('billingAdmin.edit')}</Button> : null}</li>)}</ul>
        </AdaptiveCard>
    </div>
}

export default BillingSettings
