import Segment from '@/components/ui/Segment'
import { usePricingStore } from '../store/pricingStore'
import useTranslation from '@/utils/hooks/useTranslation'
import type { PaymentCycle } from '../types'

const PaymentCycleToggle = () => {
    const { i18n } = useTranslation()
    const isArabic = i18n.language.toLowerCase().startsWith('ar')
    const { paymentCycle, setPaymentCycle } = usePricingStore()

    return (
        <Segment
            value={paymentCycle}
            onChange={(val) => setPaymentCycle(val as PaymentCycle)}
        >
            <Segment.Item value="monthly">{isArabic ? 'شهری' : 'Monthly'}</Segment.Item>
            <Segment.Item value="annually">{isArabic ? 'سنوی' : 'Annual'}</Segment.Item>
        </Segment>
    )
}

export default PaymentCycleToggle
