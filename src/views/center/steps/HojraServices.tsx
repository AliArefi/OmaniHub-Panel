// steps/HojraServices.tsx
import { Button, Card, FormItem, Input, Select, toast } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { ServiceItem, useCreateStore } from '@/context/createStoreContext'
import { useEffect, useMemo, useState } from 'react'
import { apiCreateAgencyService, getServices } from '@/services/CenterService'

interface HojraServicesProps {
    changeState: (value: number) => void
}

type ServiceNode = {
    id: number
    name: string
    slug: string | null
    children?: ServiceNode[]
}

type SelectOption = { value: number; label: string }

export const HojraServices = ({ changeState }: HojraServicesProps) => {
    const { services, addService, removeService, newHojraData, hojraInfo } =
        useCreateStore()

    const [serviceTree, setServiceTree] = useState<ServiceNode[]>([])
    const [servicePath, setServicePath] = useState<number[]>([])
    const [isLoadingTree, setIsLoadingTree] = useState(false)

    const [duration, setDuration] = useState<string>('')
    const [price, setPrice] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const rootId = hojraInfo.service_id ?? null
        if (!rootId) return

        let isMounted = true
        setServicePath([])
        setIsLoadingTree(true)

        getServices({ parent_id: rootId, tree: 1 })
            .then((resp) => {
                const data = (resp?.data ?? resp) as ServiceNode[]
                if (!isMounted) return
                setServiceTree(Array.isArray(data) ? data : [])
            })
            .catch(() => {
                if (!isMounted) return
                setServiceTree([])
            })
            .finally(() => {
                if (!isMounted) return
                setIsLoadingTree(false)
            })

        return () => {
            isMounted = false
        }
    }, [hojraInfo.service_id])

    const levels = useMemo(() => {
        const result: ServiceNode[][] = [serviceTree]
        let cursor = serviceTree

        for (const id of servicePath) {
            const node = cursor.find((n) => n.id === id)
            if (!node?.children?.length) break
            cursor = node.children
            result.push(cursor)
        }

        return result.filter((l) => l.length > 0)
    }, [servicePath, serviceTree])

    const selectedLabels = useMemo(() => {
        const labels: string[] = []
        let cursor = serviceTree
        for (const id of servicePath) {
            const node = cursor.find((n) => n.id === id)
            if (!node) break
            labels.push(node.name)
            cursor = node.children ?? []
        }
        return labels
    }, [servicePath, serviceTree])

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
            price.trim() !== '' &&
            Number(price) > 0 &&
            description.trim() !== '' &&
            !isDuplicate(selectedServiceId)
        )
    }

    const handleSelectLevel = (levelIndex: number, option: SelectOption | null) => {
        const next = servicePath.slice(0, levelIndex)
        if (option?.value) {
            next[levelIndex] = option.value
        }
        setServicePath(next)
    }

    const handleAddService = async () => {
        if (isSaving || !isFormComplete() || selectedServiceId === null) return

        if (!newHojraData?.id) {
            toast.push(
                <Notification type="danger">
                    لم يتم إنشاء المركز بعد. ارجع للخطوة السابقة وأنشئ المركز أولاً.
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
                price: Number(price),
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
                price: Number(price),
                description: description.trim(),
            }

            addService(newService)
        } catch (err: unknown) {
            const apiMessage = (() => {
                if (typeof err !== 'object' || err === null) return undefined
                const response = (err as { response?: unknown }).response
                if (typeof response !== 'object' || response === null)
                    return undefined
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
                ) : serviceTree.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        لا توجد خدمات فرعية متاحة لهذا النوع حالياً.
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
                                                    opt.value ===
                                                    servicePath[idx],
                                            ) || null
                                        }
                                        onChange={(opt) =>
                                            handleSelectLevel(
                                                idx,
                                                opt ?? null,
                                            )
                                        }
                                    />
                                </FormItem>
                            )
                        })}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <FormItem label="المدة (دقيقة)">
                        <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="المدة"
                            min="1"
                        />
                    </FormItem>

                    <FormItem label="السعر (ريال)">
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="السعر"
                            min="1"
                        />
                    </FormItem>
                </div>

                <FormItem label="وصف موجز للخدمة">
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="وصف موجز للخدمة"
                    />
                </FormItem>

                {selectedServiceId !== null && isDuplicate(selectedServiceId) && (
                    <div className="text-red-500 text-xs">
                        هذه الخدمة مضافة مسبقًا.
                    </div>
                )}

                <FormItem>
                    <Button
                        variant="default"
                        type="button"
                        block
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
                                            <span>
                                                المدة: {service.duration} دقيقة
                                            </span>
                                            <span>
                                                السعر: {service.price} ريال
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
                                            onClick={() =>
                                                removeService(service.id)
                                            }
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
                            onClick={() => changeState(1)}
                        >
                            خلف
                        </Button>
                        {services.length > 0 && (
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => changeState(3)}
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
