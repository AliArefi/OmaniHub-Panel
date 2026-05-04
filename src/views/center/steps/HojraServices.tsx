import { Button, Card, FormItem, Input, Select, toast } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { ServiceItem, useCreateStore } from '@/context/createStoreContext'
import { useEffect, useMemo, useState } from 'react'
import { apiCreateAgencyService, getServices } from '@/services/CenterService'
import { extractDigits } from '@/utils/normalizeDigits'
import { getPricingTypeLabel, getServicePricingLabel } from '@/utils/pricing'

interface HojraServicesProps {
    changeState: (value: number) => void
}

type ServiceNode = {
    id: number
    name: string
    slug: string | null
}

type SelectOption = { value: number; label: string }

const resolveServiceNodes = (response: unknown): ServiceNode[] => {
    if (!response || typeof response !== 'object') {
        return []
    }

    const payload = response as { data?: unknown }
    const data = payload.data ?? response

    return Array.isArray(data) ? (data as ServiceNode[]) : []
}

export const HojraServices = ({ changeState }: HojraServicesProps) => {
    const { services, addService, removeService, newHojraData, hojraInfo } =
        useCreateStore()

    const [serviceLevels, setServiceLevels] = useState<ServiceNode[][]>([])
    const [servicePath, setServicePath] = useState<number[]>([])
    const [isLoadingTree, setIsLoadingTree] = useState(false)
    const [isLoadingNextLevel, setIsLoadingNextLevel] = useState(false)

    const [duration, setDuration] = useState<string>('')
    const [pricingType, setPricingType] = useState<
        'fixed' | 'coordination' | 'member_based'
    >('fixed')
    const [price, setPrice] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const rootId = hojraInfo.service_id ?? null
        if (!rootId) return

        let isMounted = true
        setServicePath([])
        setServiceLevels([])
        setIsLoadingTree(true)

        getServices({ parent_id: rootId })
            .then((resp) => {
                if (!isMounted) return
                const nodes = resolveServiceNodes(resp)
                setServiceLevels(nodes.length > 0 ? [nodes] : [])
            })
            .catch(() => {
                if (!isMounted) return
                setServiceLevels([])
            })
            .finally(() => {
                if (!isMounted) return
                setIsLoadingTree(false)
            })

        return () => {
            isMounted = false
        }
    }, [hojraInfo.service_id])

    const levels = useMemo(
        () => serviceLevels.filter((level) => level.length > 0),
        [serviceLevels],
    )

    const selectedLabels = useMemo(() => {
        const labels: string[] = []

        for (let idx = 0; idx < servicePath.length; idx++) {
            const levelNodes = serviceLevels[idx] ?? []
            const node = levelNodes.find((item) => item.id === servicePath[idx])
            if (!node) break
            labels.push(node.name)
        }

        return labels
    }, [serviceLevels, servicePath])

    const selectedServiceId = servicePath.length
        ? servicePath[servicePath.length - 1]
        : null

    const serviceLabel = selectedLabels.length ? selectedLabels.join(' / ') : ''

    const isDuplicate = (serviceId: number): boolean => {
        return services.some((service) => service.serviceId === serviceId)
    }

    const isFormComplete = (): boolean => {
        return (
            selectedServiceId !== null &&
            duration.trim() !== '' &&
            Number(duration) > 0 &&
            (pricingType !== 'fixed' ||
                (price.trim() !== '' && Number(price) > 0)) &&
            description.trim() !== '' &&
            !isDuplicate(selectedServiceId)
        )
    }

    const handleSelectLevel = async (
        levelIndex: number,
        option: SelectOption | null,
    ) => {
        const nextPath = servicePath.slice(0, levelIndex)
        if (option?.value) {
            nextPath[levelIndex] = option.value
        }

        setServicePath(nextPath)
        setServiceLevels((prev) => prev.slice(0, levelIndex + 1))

        if (!option?.value) {
            return
        }

        setIsLoadingNextLevel(true)

        try {
            const resp = await getServices({ parent_id: option.value })
            const nodes = resolveServiceNodes(resp)

            if (nodes.length > 0) {
                setServiceLevels((prev) => {
                    const updated = prev.slice(0, levelIndex + 1)
                    updated[levelIndex + 1] = nodes
                    return updated
                })
            }
        } catch {
            // Hide deeper levels and keep the chosen level only.
        } finally {
            setIsLoadingNextLevel(false)
        }
    }

    const handleAddService = async () => {
        if (isSaving || !isFormComplete() || selectedServiceId === null) return

        if (!newHojraData?.id) {
            toast.push(
                <Notification type="danger">
                    لم يتم إنشاء المركز بعد. ارجع للخطوة السابقة وأنشئ المركز أولًا.
                </Notification>,
            )
            return
        }

        setIsSaving(true)
        try {
            const resp = await apiCreateAgencyService({
                agency_id: newHojraData.id,
                service_id: selectedServiceId,
                title: serviceLabel || undefined,
                sub_title: description.trim().slice(0, 191),
                estimate_time: Number(duration),
                pricing_type: pricingType,
                price: pricingType === 'fixed' ? Number(price) : null,
                body: description.trim(),
            })

            if (!resp?.success) {
                throw new Error(resp?.message || 'تعذر حفظ الخدمة')
            }

            const newService: ServiceItem = {
                id: resp.data.id,
                serviceId: selectedServiceId,
                serviceLabel,
                duration: Number(duration),
                pricingType,
                needsCoordination: pricingType !== 'fixed',
                price: pricingType === 'fixed' ? Number(price) : null,
                priceMin: null,
                priceMax: null,
                description: description.trim(),
            }

            addService(newService)
        } catch (err: unknown) {
            const apiMessage = (() => {
                if (typeof err !== 'object' || err === null) return undefined
                const response = (err as { response?: unknown }).response
                if (typeof response !== 'object' || response === null) {
                    return undefined
                }
                const data = (response as { data?: unknown }).data
                if (typeof data !== 'object' || data === null) return undefined
                const message = (data as { message?: unknown }).message
                return typeof message === 'string' && message.trim()
                    ? message
                    : undefined
            })()

            const message = err instanceof Error ? err.message : undefined

            toast.push(
                <Notification type="danger">
                    {apiMessage || message || 'حدث خطأ أثناء حفظ الخدمة'}
                </Notification>,
            )
            return
        } finally {
            setIsSaving(false)
        }

        setServicePath([])
        setDuration('')
        setPricingType('fixed')
        setPrice('')
        setDescription('')
    }

    return (
        <Card
            header={{
                content: 'تعريف الخدمات',
                bordered: false,
            }}
        >
            <div className="space-y-4">
                {isLoadingTree ? (
                    <div className="text-sm text-gray-500">
                        جاري تحميل الخدمات...
                    </div>
                ) : levels.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        لا توجد خدمات فرعية متاحة لهذا النوع حاليًا.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {levels.map((nodes, idx) => {
                            const options: SelectOption[] = nodes.map((n) => ({
                                value: n.id,
                                label: n.name,
                            }))

                            const label =
                                idx === 0
                                    ? 'نوع الخدمة الرئيسية'
                                    : idx === 1
                                      ? 'الخدمة الفرعية'
                                      : `تصنيف فرعي (المستوى ${idx + 1})`

                            return (
                                <FormItem key={idx} label={label}>
                                    <Select<SelectOption>
                                        placeholder="اختر"
                                        options={options}
                                        value={
                                            options.find(
                                                (opt) =>
                                                    opt.value === servicePath[idx],
                                            ) || null
                                        }
                                        onChange={(opt) =>
                                            handleSelectLevel(idx, opt ?? null)
                                        }
                                    />
                                </FormItem>
                            )
                        })}

                        {isLoadingNextLevel && (
                            <div className="text-sm text-gray-500">
                                جاري تحميل المستوى التالي...
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <FormItem label="المدة (دقيقة)">
                        <Input
                            type="text"
                            inputMode="numeric"
                            value={duration}
                            placeholder="المدة"
                            min="1"
                            onChange={(e) =>
                                setDuration(extractDigits(e.target.value))
                            }
                        />
                    </FormItem>

                    <FormItem label="نوع التسعير">
                        <Select<SelectOption>
                            placeholder="اختر نوع التسعير"
                            options={[
                                { value: 1, label: 'سعر ثابت' },
                                { value: 2, label: 'بحسب التنسيق' },
                                { value: 3, label: 'بحسب العضو' },
                            ]}
                            value={
                                pricingType === 'fixed'
                                    ? { value: 1, label: 'سعر ثابت' }
                                    : pricingType === 'coordination'
                                      ? { value: 2, label: 'بحسب التنسيق' }
                                      : { value: 3, label: 'بحسب العضو' }
                            }
                            onChange={(option) => {
                                if (option?.value === 2) {
                                    setPricingType('coordination')
                                    setPrice('')
                                    return
                                }

                                if (option?.value === 3) {
                                    setPricingType('member_based')
                                    setPrice('')
                                    return
                                }

                                setPricingType('fixed')
                            }}
                        />
                    </FormItem>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <FormItem label="السعر (ريال)">
                        <Input
                            type="text"
                            inputMode="numeric"
                            value={price}
                            placeholder="السعر"
                            min="1"
                            disabled={pricingType !== 'fixed'}
                            onChange={(e) =>
                                setPrice(extractDigits(e.target.value))
                            }
                        />
                    </FormItem>
                </div>

                {pricingType !== 'fixed' && (
                    <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm text-gray-700">
                        {pricingType === 'coordination'
                            ? 'لن يظهر سعر للعميل أثناء الحجز، وسيتم تحديده لاحقًا من قسم الحجوزات.'
                            : 'سيعتمد السعر على تسعير العضو/الموظف. إذا لم يكن هناك سعر محدد للعضو فسيظهر للعميل أن الخدمة بحاجة إلى تنسيق.'}
                    </div>
                )}

                <FormItem label="وصف موجز للخدمة">
                    <Input
                        value={description}
                        placeholder="وصف موجز للخدمة"
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </FormItem>

                {selectedServiceId !== null && isDuplicate(selectedServiceId) && (
                    <div className="text-red-500 text-xs">
                        هذه الخدمة مضافة مسبقًا.
                    </div>
                )}

                <FormItem>
                    <Button
                        block
                        variant="default"
                        type="button"
                        loading={isSaving}
                        disabled={isSaving || !isFormComplete()}
                        onClick={handleAddService}
                    >
                        إضافة خدمة
                    </Button>
                </FormItem>

                {services.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-lg font-semibold">
                            الخدمات المضافة ({services.length})
                        </h3>
                        {services.map((service) => (
                            <Card key={service.id}>
                                <div className="flex justify-between items-center flex-row">
                                    <div className="flex-1">
                                        <div className="font-semibold text-primary-deep text-base mb-1">
                                            {service.serviceLabel}
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1 flex gap-4">
                                            <span>المدة: {service.duration} دقيقة</span>
                                            <span>
                                                التسعير: {getPricingTypeLabel(service.pricingType)}
                                            </span>
                                            <span>
                                                السعر: {getServicePricingLabel(service)}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {service.description}
                                        </div>
                                    </div>
                                    <div>
                                        <Button
                                            variant="solid"
                                            shape="circle"
                                            size="xs"
                                            className="bg-red-300 hover:bg-red-400 transition-all"
                                            onClick={() => removeService(service.id)}
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => changeState(3)}
                        >
                            خلف
                        </Button>
                        {services.length > 0 && (
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => changeState(5)}
                            >
                                التالي: تعيين الفريق
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
