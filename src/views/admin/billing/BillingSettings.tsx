import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Switcher from '@/components/ui/Switcher'
import { apiGetBillingSettings, apiUpdateBillingProvider, type AdminBillingProvider } from '@/services/admin/AdminBillingService'
import useTranslation from '@/utils/hooks/useTranslation'
import { useState } from 'react'
import useSWR from 'swr'

type ProviderForm = Record<string, string | boolean>

const fieldNames = ['base_url', 'public_key', 'secret_key', 'hmac_secret', 'payment_methods', 'checkout_url'] as const

const BillingSettings = () => {
    const { t } = useTranslation()
    const { data, error, isLoading, mutate } = useSWR('/admin/billing/settings', apiGetBillingSettings)
    const [forms, setForms] = useState<Record<number, ProviderForm>>({})
    const [saving, setSaving] = useState<number | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const formFor = (provider: AdminBillingProvider): ProviderForm => forms[provider.id] || {
        enabled: provider.enabled,
        test_mode: provider.test_mode,
        base_url: '', public_key: '', secret_key: '', hmac_secret: '', payment_methods: '', checkout_url: '',
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

    if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
    if (error) return <AdaptiveCard>{t('billingAdmin.loadError')}</AdaptiveCard>

    return <div className="space-y-4">
        <div><h3>{t('billingAdmin.title')}</h3><p className="text-sm text-gray-500">{t('billingAdmin.subtitle')}</p></div>
        {message ? <p className="text-sm text-primary">{message}</p> : null}
        {data?.providers.map((provider) => {
            const form = formFor(provider)
            return <AdaptiveCard key={provider.id}>
                <div className="mb-4 flex items-center justify-between"><h4>{provider.name}</h4><span className="text-sm text-gray-500">{provider.key}</span></div>
                <div className="mb-4 flex gap-6"><Switcher checked={Boolean(form.enabled)} onChange={(value) => updateField(provider, 'enabled', value)}>{t('billingAdmin.enabled')}</Switcher><Switcher checked={Boolean(form.test_mode)} onChange={(value) => updateField(provider, 'test_mode', value)}>{t('billingAdmin.testMode')}</Switcher></div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {fieldNames.map((field) => <label key={field} className="text-sm"><span className="mb-1 block">{t(`billingAdmin.fields.${field}`)}</span><Input type={field.includes('secret') ? 'password' : 'text'} value={String(form[field] || '')} onChange={(event) => updateField(provider, field, event.target.value)} /></label>)}
                </div>
                <div className="mt-5"><Button variant="solid" loading={saving === provider.id} onClick={() => save(provider)}>{t('billingAdmin.save')}</Button></div>
            </AdaptiveCard>
        })}
        <AdaptiveCard><h4>{t('billingAdmin.plans')}</h4><ul className="mt-3 space-y-2">{data?.plans.map((plan) => <li key={plan.id}>{plan.key} · {plan.currency} · {plan.prices.map((price) => `${price.interval}: ${price.amount_minor}`).join(', ')}</li>)}</ul></AdaptiveCard>
    </div>
}

export default BillingSettings
