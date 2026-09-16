import Card from '@/components/ui/Card'
import Plans from './components/Plans'
import PaymentCycleToggle from './components/PaymentCycleToggle'
import Faq from './components/Faq'
import PaymentDialog from './components/PaymentDialog'

const Pricing = () => {
    return (
        <>
            <div className="flex items-center justify-between p-2 mb-5">
                <h3>خطة الاشتراك</h3>
                <PaymentCycleToggle />
            </div>
            <Plans />
            <Faq />
            <PaymentDialog />
        </>
    )
}

export default Pricing
