import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { usePricingStore } from '../store/pricingStore'
import { apiGetPricingPlans } from '@/services/AccontsService'
import { featuresList } from '../constants'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import useQuery from '@/utils/hooks/useQuery'
import useSWR from 'swr'
import { NumericFormat } from 'react-number-format'
import { TbArrowDown, TbArrowUp, TbCheck, TbChevronDown } from 'react-icons/tb'
import type { GetPricingPanResponse } from '../types'
import { Card, Tooltip } from '@/components/ui'
import { HiOutlineInformationCircle } from 'react-icons/hi'
import { useState } from 'react'

const Plans = () => {
    const { paymentCycle, setPaymentDialog, setSelectedPlan } =
        usePricingStore()

    const query = useQuery()
    const subcription = query.get('subcription')
    const cycle = query.get('cycle')

    const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})

    const togglePlan = (planId: string) => {
        setExpandedPlans(prev => ({ ...prev, [planId]: !prev[planId] }))
    }

    // const { data } = useSWR(
    //     ['/api/pricing'],
    //     () => apiGetPricingPlans<GetPricingPanResponse>(),
    //     {
    //         revalidateOnFocus: false,
    //         revalidateIfStale: false,
    //         revalidateOnReconnect: false,
    //     },
    // )

    const data = {
        featuresModel: [
            {
                id: '',
                description: '',
            },
        ],
        plans: [
            {
                id: 'basic',
                name: 'أساسي',
                description:
                    'مناسب للأفراد أو الفرق الصغيرة. يشمل الميزات الأساسية لإدارة المهام والمشاريع.',
                price: {
                    monthly: 59,
                    annually: 500,
                },
                features: [
                    'taskManagement',
                    'managementTools',
                    'reporting',
                    'support',
                ],
                recommended: false,
            },
            {
                id: 'standard',
                name: 'قياسي',
                description:
                    'مناسب للفرق النامية. ميزات متقدمة لزيادة الإنتاجية وتعزيز التعاون.',
                price: {
                    monthly: 79,
                    annually: 700,
                },
                features: [
                    'taskManagement',
                    'managementTools',
                    'reporting',
                    'support',
                    'fileSharing',
                ],
                recommended: false,
            },
            {
                id: 'pro',
                name: 'احترافي',
                description:
                    'مناسب للفرق الكبيرة. يشمل ميزات متقدمة ودعماً مخصصاً لتحسين سير العمل.',
                price: {
                    monthly: 129,
                    annually: 1000,
                },
                features: [
                    'taskManagement',
                    'managementTools',
                    'reporting',
                    'support',
                    'fileSharing',
                    'advancedSecurity',
                    'customIntegrations',
                ],
                recommended: true,
            },
        ],
    }

    return (
        <>
            <Card className="hidden sm:block mb-4">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-4">
                    {data?.plans.map((plan, index) => (
                        <div
                            key={plan.id}
                            className={classNames(
                                'px-6 pt-2 flex flex-col justify-between',
                                !isLastChild(data.plans, index) &&
                                'border-e-0 xl:border-e border-gray-200 dark:border-gray-700',
                            )}
                        >
                            <div>
                                <h5 className="mb-6 flex items-center gap-2">
                                    <span>{plan.name}</span>
                                    {plan.recommended && (
                                        <Tag className="rounded-full bg-green-200 font-bold">
                                            مُستَحسَن
                                        </Tag>
                                    )}
                                </h5>
                                <div className="">{plan.description}</div>
                                <div className="mt-6 flex items-center gap-2">
                                    <NumericFormat
                                        className="h1"
                                        displayType="text"
                                        value={plan.price[paymentCycle]}
                                        thousandSeparator={true}
                                    />
                                    <div className="text-lg font-bold px-1">
                                        <img className='w-6 block' src='./img/others/rial.webp' alt='rial' />
                                        <div className='text-sm'>{paymentCycle === 'monthly' ? 'شهريا' : 'سنوي'}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4 border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
                                    {featuresList.map((feature) => (
                                        <div
                                            key={feature.id}
                                            className="flex items-center gap-4 font-semibold heading-text"
                                        >
                                            {plan.features.includes(feature.id) && (
                                                <>
                                                    <TbCheck
                                                        className={classNames(
                                                            'text-2xl',
                                                            plan.features.includes(
                                                                feature.id,
                                                            )
                                                                ? 'text-primary'
                                                                : 'text-gray-100',
                                                        )}
                                                    />
                                                    <span>
                                                        {
                                                            feature.description[
                                                            plan.id as string
                                                            ]
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-10">
                                <Button
                                    block
                                    disabled={
                                        subcription === plan.id &&
                                        cycle === paymentCycle
                                    }
                                    onClick={() => {
                                        setSelectedPlan({
                                            paymentCycle,
                                            planName: plan.name,
                                            price: plan.price,
                                        })
                                        setPaymentDialog(true)
                                    }}
                                >
                                    {subcription === plan.id && cycle === paymentCycle
                                        ? 'الخطة الحالية'
                                        : 'اختر الخطة'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid sm:hidden grid-cols-1 gap-4 mb-8">
                {data?.plans.map((plan, index) => (
                    <Card key={plan.id}>
                        <div

                            className={classNames(
                                'px-2 pt-2 flex flex-col justify-between',
                                !isLastChild(data.plans, index) &&
                                'border-e-0 xl:border-e border-gray-200 dark:border-gray-700',
                            )}
                        >
                            <div className='relative flex items-center justify-between gap-1 pb-4'>
                                <h5 className=" flex items-center gap-2">
                                    <span className='text-2xl font-bold'>{plan.name}</span>
                                    <Tooltip title={plan.description}>
                                        <span className="cursor-pointer">
                                            <HiOutlineInformationCircle size={15} className='text-gray-400' />
                                        </span>
                                    </Tooltip>
                                    {plan.recommended && (
                                        <Tag className="w-auto text-xs rounded-full bg-green-200">
                                            مقترح
                                        </Tag>
                                    )}
                                </h5>
                                <div className='flex items-center justify-center gap-1'>

                                    <NumericFormat
                                        className="text-2xl font-bold text-black"
                                        displayType="text"
                                        value={plan.price[paymentCycle]}
                                        thousandSeparator={true}

                                    />
                                    <div className="text-lg font-bold px-1">
                                        <img className='w-6 block' src='./img/others/rial.webp' alt='rial' />
                                        <div className='text-xs'>{paymentCycle === 'monthly' ? 'شهريا' : 'سنوي'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="py-4">
                                <button
                                    onClick={() => togglePlan(plan.id)}
                                    className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-600 dark:text-gray-300"
                                >
                                    <span>عرض الميزات</span>
                                    <TbChevronDown
                                        className={classNames(
                                            'transition-transform duration-200',
                                            expandedPlans[plan.id] ? 'rotate-180' : ''
                                        )}
                                    />
                                </button>

                                {expandedPlans[plan.id] && (
                                    <div className="flex flex-col gap-3 pb-2">
                                        {featuresList.map((feature) => (
                                            plan.features.includes(feature.id) && (
                                                <div
                                                    key={feature.id}
                                                    className="flex items-center gap-3 text-sm font-semibold heading-text"
                                                >
                                                    <TbCheck className="text-primary shrink-0" />
                                                    <span>{feature.description[plan.id as string]}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}

                            </div>
                            <div>
                                <Button
                                    block
                                    size="sm"
                                    disabled={
                                        subcription === plan.id &&
                                        cycle === paymentCycle
                                    }
                                    onClick={() => {
                                        setSelectedPlan({
                                            paymentCycle,
                                            planName: plan.name,
                                            price: plan.price,
                                        })
                                        setPaymentDialog(true)
                                    }}
                                >
                                    {subcription === plan.id && cycle === paymentCycle
                                        ? 'الخطة الحالية'
                                        : 'اختر الخطة'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>

    )
}

export default Plans
