import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Segment from '@/components/ui/Segment'
import classNames from '@/utils/classNames'
import sleep from '@/utils/sleep'
import { usePricingStore } from '../store/pricingStore'
import { TbCheck, TbCreditCard, TbMail } from 'react-icons/tb'
import {
    NumericFormat,
    PatternFormat,
    NumberFormatBase,
} from 'react-number-format'
import { useNavigate } from 'react-router'
import { PaymentCycle } from '../types'
import useTranslation from '@/utils/hooks/useTranslation'

function limit(val: string, max: string) {
    if (val.length === 1 && val[0] > max[0]) {
        val = '0' + val
    }

    if (val.length === 2) {
        if (Number(val) === 0) {
            val = '01'
        } else if (val > max) {
            val = max
        }
    }

    return val
}

function cardExpiryFormat(val: string) {
    const month = limit(val.substring(0, 2), '12')
    const date = limit(val.substring(2, 4), '31')

    return month + (date.length ? '/' + date : '')
}

const PaymentDialog = () => {
    const { i18n } = useTranslation()
    const isArabic = i18n.language.toLowerCase().startsWith('ar')
    const [loading, setLoading] = useState(false)
    const [paymentSuccessful, setPaymentSuccessful] = useState(false)

    const navigate = useNavigate()

    const { paymentDialog, setPaymentDialog, selectedPlan, setSelectedPlan } =
        usePricingStore()

    const handleDialogClose = async () => {
        setPaymentDialog(false)
        await sleep(200)
        setSelectedPlan({})
        setPaymentSuccessful(false)
    }

    const handlePaymentChange = (paymentCycle: PaymentCycle) => {
        setSelectedPlan({
            ...selectedPlan,
            paymentCycle,
        })
    }

    const handlePay = async () => {
        setLoading(true)
        await sleep(500)
        setLoading(false)
        setPaymentSuccessful(true)
    }

    const handleManageSubscription = async () => {
        navigate('/concepts/account/settings?view=billing')
        await handleDialogClose()
    }

    return (
        <Dialog
            isOpen={paymentDialog}
            closable={!paymentSuccessful}
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            {paymentSuccessful ? (
                <>
                    <div className="text-center mt-6 mb-2">
                        <div className="inline-flex rounded-full p-5 bg-success">
                            <TbCheck className="text-5xl text-white" />
                        </div>
                        <div className="mt-6">
                            <h4>{isArabic ? 'شكراً لك على شرائك!' : 'Thank you for your purchase!'}</h4>
                            <p className="text-base max-w-[400px] mx-auto mt-4 leading-relaxed">
                                {isArabic ? 'تم استلام طلبك وهو قيد المعالجة. ستتلقى قريباً بريداً إلكترونياً يتضمن تفاصيل طلبك.' : 'Your order has been received and is being processed. You will receive an email with the details shortly.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-8">
                            <Button block onClick={handleManageSubscription}>
                                {isArabic ? 'إدارة الاشتراك' : 'Manage subscription'}
                            </Button>
                            <Button
                                block
                                variant="solid"
                                onClick={handleDialogClose}
                            >
                                {isArabic ? 'إغلاق' : 'Close'}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <h4>{isArabic ? 'خطة' : 'Plan'} {selectedPlan.planName}</h4>
                    <div className="mt-6">
                        <Segment
                            defaultValue={selectedPlan.paymentCycle}
                            className="gap-4 flex bg-transparent"
                            onChange={(value) =>
                                handlePaymentChange(value as PaymentCycle)
                            }
                        >
                            {Object.entries(selectedPlan.price || {}).map(
                                ([key, value]) => (
                                    <Segment.Item key={key} value={key}>
                                        {({ active, onSegmentItemClick }) => {
                                            return (
                                                <div
                                                    className={classNames(
                                                        'flex justify-between border rounded-xl border-gray-300 py-5 px-4 select-none ring-1 w-1/2',
                                                        active
                                                            ? 'ring-primary border-primary '
                                                            : 'ring-transparent bg-gray-100',
                                                    )}
                                                    role="button"
                                                    onClick={onSegmentItemClick}
                                                >
                                                    <div>
                                                        <div className="heading-text mb-0.5">
                                                            {isArabic ? 'دفع' : 'Pay'}{' '}
                                                            {key === 'monthly'
                                                                ? (isArabic ? 'شهري' : 'monthly')
                                                                : (isArabic ? 'سنوي' : 'annually')}
                                                        </div>
                                                        <span className="text-2xl font-bold heading-text items-center flex gap-0.5">
                                                            <NumericFormat
                                                                displayType="text"
                                                                value={value}
                                                                thousandSeparator={
                                                                    true
                                                                }
                                                            />
                                                            <div className="text-lg font-bold px-1">
                                                                <img className='w-6 block' src='./img/others/rial.webp' alt='rial' />
                                                            </div>
                                                        </span>
                                                    </div>
                                                    {active && (
                                                        <TbCheck className="text-primary text-xl" />
                                                    )}
                                                </div>
                                            )
                                        }}
                                    </Segment.Item>
                                ),
                            )}
                        </Segment>
                    </div>
                    <div className="mt-6 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-full">
                                <span>{isArabic ? 'البريد الإلكتروني للفاتورة' : 'Billing email'}</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <TbMail className="text-2xl" />
                                    <input
                                        className="focus:outline-none heading-text flex-1"
                                        placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                                        type="email"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="w-full">
                            <span>{isArabic ? 'بطاقة الائتمان' : 'Credit card'}</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1">
                                        <TbCreditCard className="text-2xl" />
                                    </div>
                                    <PatternFormat
                                        className="focus:outline-none heading-text w-full"
                                        placeholder={isArabic ? 'رقم بطاقة الائتمان' : 'Card number'}
                                        format="#### #### #### ####"
                                    />
                                    <NumberFormatBase
                                        className="focus:outline-none heading-text max-w-12 sm:max-w-28"
                                        placeholder="MM/YY"
                                        format={cardExpiryFormat}
                                    />
                                    <PatternFormat
                                        className="focus:outline-none heading-text max-w-12 sm:max-w-28"
                                        placeholder="CVC"
                                        format="###"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col items-start">
                        <h4 className='flex items-center gap-1'>
                            <span>{isArabic ? 'الفاتورة الآن:' : 'Due now:'}</span>
                            <div className='text-2xl'>
                                <NumericFormat
                                    displayType="text"
                                    value={
                                        selectedPlan.price?.[
                                        selectedPlan.paymentCycle as PaymentCycle
                                        ]
                                    }
                                    thousandSeparator={true}
                                />
                            </div>
                            <div className="text-lg font-bold px-1">
                                <img className='w-6 block' src='./img/others/rial.webp' alt='rial' />
                            </div>
                        </h4>
                        <div className="max-w-[350px] text-start leading-none mt-2 opacity-80">
                            <small>
                                {isArabic ? 'بالنقر على الدفع، فإنك توافق على الخصم الدوري ويمكنك إلغاء الاشتراك في أي وقت.' : 'By clicking Pay, you authorize recurring charges and can cancel your subscription at any time.'}
                            </small>
                        </div>

                    </div>
                    <div className="mt-6">
                        <Button
                            block
                            variant="solid"
                            loading={loading}
                            onClick={handlePay}
                        >
                            {isArabic ? 'الدفع' : 'Pay'}
                        </Button>
                    </div>
                </>
            )}
        </Dialog>
    )
}

export default PaymentDialog
