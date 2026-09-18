import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Tag from '@/components/ui/Tag'
import { apiGetBillingPlans, type BillingInterval, type BillingPlan } from '@/services/BillingService'
import useTranslation from '@/utils/hooks/useTranslation'
import { usePricingStore } from '../store/pricingStore'
import useSWR from 'swr'

const localized = (value: Record<string, string> | null | undefined, language: string) =>
    value?.[language] || value?.[language.split('-')[0]] || value?.ar || value?.en || ''

const displayAmount = (minor: number, currency: string, language: string) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-OM' : 'en-OM', {
        style: 'currency',
        currency,
    }).format(minor / 1000)

const Plans = () => {
    const { t, i18n } = useTranslation()
    const { paymentCycle, setPaymentDialog, setSelectedPlan } = usePricingStore()
    const { data, error, isLoading } = useSWR('/billing/plans', apiGetBillingPlans, {
        revalidateOnFocus: false,
    })

    if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
    if (error) return <Card><p className="text-danger">{t('billing.loadPlansError')}</p></Card>
    if (!data?.plans.length) return <Card><p>{t('billing.emptyPlans')}</p></Card>

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {data.plans.map((plan: BillingPlan) => {
                const interval = paymentCycle as BillingInterval
                const price = plan.prices.find((item) => item.interval === interval)
                    || plan.prices.find((item) => item.interval === 'one_time')

                return (
                    <Card key={plan.id} className="flex flex-col">
                        <div className="flex flex-1 flex-col">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h4>{localized(plan.name, i18n.language)}</h4>
                                {plan.key === 'pro' ? <Tag className="rounded-full bg-primary/10 text-primary">{t('billing.recommended')}</Tag> : null}
                            </div>
                            {plan.description ? <p className="mb-5 text-sm text-gray-500">{localized(plan.description, i18n.language)}</p> : null}
                            {price ? <p className="mb-5 text-3xl font-bold">{displayAmount(price.amount_minor, plan.currency, i18n.language)}</p> : <p className="mb-5 text-sm text-gray-500">{t('billing.priceUnavailable')}</p>}
                            <ul className="mb-6 space-y-2 border-t border-gray-200 pt-5 dark:border-gray-700">
                                {(plan.features || []).map((feature) => <li key={feature} className="flex gap-2 text-sm">✓ {feature}</li>)}
                            </ul>
                        </div>
                        <Button
                            block
                            variant="solid"
                            disabled={!price}
                            onClick={() => {
                                if (!price) return
                                setSelectedPlan({
                                    id: plan.id,
                                    name: localized(plan.name, i18n.language),
                                    interval: price.interval,
                                    amountMinor: price.amount_minor,
                                    currency: plan.currency,
                                })
                                setPaymentDialog(true)
                            }}
                        >
                            {t('billing.choosePlan')}
                        </Button>
                    </Card>
                )
            })}
        </div>
    )
}

export default Plans
