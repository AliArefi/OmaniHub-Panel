import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { apiCreateBillingCheckout } from '@/services/BillingService'
import useTranslation from '@/utils/hooks/useTranslation'
import { useState } from 'react'
import { usePricingStore } from '../store/pricingStore'

const PaymentDialog = () => {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { paymentDialog, setPaymentDialog, selectedPlan, setSelectedPlan } = usePricingStore()

    const close = () => {
        setPaymentDialog(false)
        setSelectedPlan({})
        setError(null)
    }

    const checkout = async () => {
        if (!selectedPlan.id || !selectedPlan.interval) return
        setLoading(true)
        setError(null)
        try {
            const result = await apiCreateBillingCheckout({
                plan_id: selectedPlan.id,
                interval: selectedPlan.interval,
                mode: selectedPlan.interval === 'one_time' ? 'one_time' : 'subscription',
            })
            if (!result.checkout.checkout_url) throw new Error(t('billing.checkoutUnavailable'))
            window.location.assign(result.checkout.checkout_url)
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : t('billing.checkoutError'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog isOpen={paymentDialog} onClose={close} onRequestClose={close}>
            <h4>{t('billing.checkoutTitle')}</h4>
            <p className="mt-3 text-sm text-gray-500">{selectedPlan.name}</p>
            <p className="mt-4 text-sm">{t('billing.hostedCheckoutNotice')}</p>
            {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
            <div className="mt-6 flex gap-3">
                <Button block onClick={close}>{t('billing.cancel')}</Button>
                <Button block variant="solid" loading={loading} onClick={checkout}>{t('billing.continueToPayment')}</Button>
            </div>
        </Dialog>
    )
}

export default PaymentDialog
