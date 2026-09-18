import Segment from '@/components/ui/Segment'
import { usePricingStore } from '../store/pricingStore'
import useTranslation from '@/utils/hooks/useTranslation'
import type { PaymentCycle } from '../types'

const PaymentCycleToggle = () => {
    const { t } = useTranslation()
    const { paymentCycle, setPaymentCycle } = usePricingStore()

    return (
        <Segment
            value={paymentCycle}
            onChange={(val) => setPaymentCycle(val as PaymentCycle)}
        >
            <Segment.Item value="monthly">{t('billing.monthly')}</Segment.Item>
            <Segment.Item value="annually">{t('billing.annually')}</Segment.Item>
        </Segment>
    )
}

export default PaymentCycleToggle
