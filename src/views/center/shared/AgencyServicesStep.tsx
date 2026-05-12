import {
    Button,
    Card,
    FormItem,
    Input,
    Select,
    Switcher,
    toast,
} from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { useCreateStore } from '@/context/createStoreContext'
import {
    apiCreateAgencyService,
    apiDeleteAgencyService,
    apiSyncDemoAgencyServices,
    getServices,
} from '@/services/CenterService'
import { extractDigits } from '@/utils/normalizeDigits'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    flattenServiceTree,
    mapAgencyServiceToStoreItem,
    resolveServiceNodes,
    type DemoCatalogItem,
    type SelectOption,
    type ServiceNode,
} from './agencyServices'
import {
    durationToMinutes,
    durationUnitOptions,
    type DurationUnit,
} from './duration'

type PricingType = 'fixed' | 'coordination' | 'member_based'
type DurationUnitOption = { value: DurationUnit; label: string }
type ViewMode = 'picker' | 'legacy'

type DemoDraft = {
    enabled: boolean
    duration: string
    durationUnit: DurationUnit
    pricingType: PricingType
    price: string
    description: string
}

type AgencyServicesStepProps = {
    onBack?: () => void
    onNext?: () => void
}

const getPickerValidationErrorCode = (
    draft: DemoDraft,
): 'duration_required' | 'price_required' | null => {
    if (!draft.enabled) {
        return null
    }

    if (draft.duration.trim() === '' || Number(draft.duration) <= 0) {
        return 'duration_required'
    }

    if (draft.pricingType === 'fixed') {
        if (draft.price.trim() === '' || Number(draft.price) <= 0) {
            return 'price_required'
        }
    }

    return null
}

const buildLegacySelectedLabels = (
    serviceLevels: ServiceNode[][],
    servicePath: number[],
): string[] => {
    const labels: string[] = []

    for (let index = 0; index < servicePath.length; index += 1) {
        const levelNodes = serviceLevels[index] ?? []
        const node = levelNodes.find((item) => item.id === servicePath[index])
        if (!node) {
            break
        }

        labels.push(node.name)
    }

    return labels
}

export const AgencyServicesStep = ({
    onBack,
    onNext,
}: AgencyServicesStepProps) => {
    const { t, i18n } = useTranslation()
    const {
        services,
        addService,
        removeService,
        replaceServices,
        newHojraData,
        hojraInfo,
    } = useCreateStore()

    const [serviceLevels, setServiceLevels] = useState<ServiceNode[][]>([])
    const [servicePath, setServicePath] = useState<number[]>([])
    const [serviceCatalog, setServiceCatalog] = useState<DemoCatalogItem[]>([])
    const [demoDrafts, setDemoDrafts] = useState<Record<number, DemoDraft>>({})
    const [viewMode, setViewMode] = useState<ViewMode>('picker')
    const [isLoadingTree, setIsLoadingTree] = useState(false)
    const [isLoadingNextLevel, setIsLoadingNextLevel] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDemoSaving, setIsDemoSaving] = useState(false)
    const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null)

    const [duration, setDuration] = useState<string>('')
    const [durationUnit, setDurationUnit] = useState<DurationUnit>('minute')
    const [pricingType, setPricingType] = useState<PricingType>('fixed')
    const [price, setPrice] = useState<string>('')
    const [description, setDescription] = useState<string>('')

    useEffect(() => {
        const rootId = hojraInfo.service_id ?? null
        if (!rootId) {
            setServiceLevels([])
            setServiceCatalog([])
            return
        }

        let isMounted = true
        setServicePath([])
        setServiceLevels([])
        setServiceCatalog([])
        setIsLoadingTree(true)

        Promise.all([
            getServices({ parent_id: rootId }),
            getServices({ parent_id: rootId, tree: 1 }),
        ])
            .then(([legacyResponse, treeResponse]) => {
                if (!isMounted) {
                    return
                }

                const legacyNodes = resolveServiceNodes(legacyResponse)
                setServiceLevels(legacyNodes.length > 0 ? [legacyNodes] : [])

                const treeNodes = resolveServiceNodes(treeResponse)
                setServiceCatalog(flattenServiceTree(treeNodes))
            })
            .catch(() => {
                if (!isMounted) {
                    return
                }

                setServiceLevels([])
                setServiceCatalog([])
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingTree(false)
                }
            })

        return () => {
            isMounted = false
        }
    }, [hojraInfo.service_id])

    useEffect(() => {
        if (serviceCatalog.length === 0) {
            return
        }

        setDemoDrafts((previousDrafts) => {
            const nextDrafts: Record<number, DemoDraft> = {}

            for (const catalogItem of serviceCatalog) {
                const existingService = services.find(
                    (service) => service.serviceId === catalogItem.serviceId,
                )
                const previousDraft = previousDrafts[catalogItem.serviceId]

                nextDrafts[catalogItem.serviceId] = {
                    enabled: existingService
                        ? true
                        : previousDraft?.enabled ?? false,
                    duration: existingService
                        ? String(existingService.duration)
                        : previousDraft?.duration ?? '',
                    durationUnit: existingService?.durationUnit
                        ? existingService.durationUnit
                        : previousDraft?.durationUnit ?? 'minute',
                    pricingType: existingService?.pricingType
                        ? existingService.pricingType
                        : previousDraft?.pricingType ?? 'fixed',
                    price:
                        existingService?.price !== null &&
                        typeof existingService?.price === 'number'
                            ? String(existingService.price)
                            : previousDraft?.price ?? '',
                    description: existingService
                        ? existingService.description
                        : previousDraft?.description ?? '',
                }
            }

            return nextDrafts
        })
    }, [serviceCatalog, services])

    const levels = useMemo(
        () => serviceLevels.filter((level) => level.length > 0),
        [serviceLevels],
    )

    const selectedLabels = useMemo(
        () => buildLegacySelectedLabels(serviceLevels, servicePath),
        [serviceLevels, servicePath],
    )

    const selectedServiceId = servicePath.length
        ? servicePath[servicePath.length - 1]
        : null

    const selectedServiceLabel = selectedLabels.length
        ? selectedLabels.join(' / ')
        : ''

    const durationUnitOptionsLocalized = useMemo<DurationUnitOption[]>(
        () =>
            durationUnitOptions.map((option) => ({
                value: option.value,
                label: t(`center.services.units.${option.value}`),
            })),
        [t],
    )

    const pricingOptionsLocalized = useMemo<
        Array<SelectOption & { pricingType: PricingType }>
    >(
        () => [
            {
                value: 1,
                label: t('center.services.pricingTypes.fixed'),
                pricingType: 'fixed',
            },
            {
                value: 2,
                label: t('center.services.pricingTypes.coordination'),
                pricingType: 'coordination',
            },
            {
                value: 3,
                label: t('center.services.pricingTypes.memberBased'),
                pricingType: 'member_based',
            },
        ],
        [t],
    )

    const getPricingOption = (type: PricingType): SelectOption => {
        const option = pricingOptionsLocalized.find((item) => item.pricingType === type)

        return option
            ? { value: option.value, label: option.label }
            : { value: 1, label: t('center.services.pricingTypes.fixed') }
    }

    const getDurationUnitOption = (unit: DurationUnit): DurationUnitOption => {
        const option = durationUnitOptionsLocalized.find((item) => item.value === unit)

        return option
            ? { value: option.value, label: option.label }
            : { value: 'minute', label: t('center.services.units.minute') }
    }

    const formatDurationLabelLocalized = (
        value: number,
        unit: DurationUnit,
    ): string => {
        const safeValue = Number.isFinite(value) ? Math.max(1, value) : 1
        const isArabic = i18n.language?.toLowerCase().startsWith('ar')

        if (isArabic) {
            return `${safeValue} ${t(`center.services.units.${unit}`)}`
        }

        const unitLabel = t(`center.services.units.${unit}`)
        const pluralUnitLabel =
            safeValue === 1 ? unitLabel : t(`center.services.unitsPlural.${unit}`)
        return `${safeValue} ${pluralUnitLabel}`
    }

    const getPricingTypeLabelLocalized = (type?: PricingType | null): string => {
        if (type === 'coordination') return t('center.services.pricingTypes.coordination')
        if (type === 'member_based') return t('center.services.pricingTypes.memberBased')
        return t('center.services.pricingTypes.fixed')
    }

    const formatAmount = (amount: number, currency = 'OMR') =>
        `${amount.toFixed(2)} ${currency}`

    const getServicePricingLabelLocalized = (service: {
        needsCoordination?: boolean | null
        price?: number | null
        priceMin?: number | null
        priceMax?: number | null
    }): string => {
        if (service.needsCoordination) return t('center.services.pricingLabels.coordination')

        const fixed =
            typeof service.price === 'number' && Number.isFinite(service.price)
                ? service.price
                : null
        if (fixed !== null) return formatAmount(fixed)

        const min =
            typeof service.priceMin === 'number' && Number.isFinite(service.priceMin)
                ? service.priceMin
                : null
        const max =
            typeof service.priceMax === 'number' && Number.isFinite(service.priceMax)
                ? service.priceMax
                : null

        if (min !== null && max !== null) {
            if (min === max) return formatAmount(min)
            return t('center.services.pricingLabels.range', {
                min: min.toFixed(2),
                max: max.toFixed(2),
            })
        }

        if (min !== null) {
            return t('center.services.pricingLabels.startsFrom', {
                min: min.toFixed(2),
            })
        }

        return t('center.services.pricingLabels.coordination')
    }

    const canGoNext = services.length > 0 && typeof onNext === 'function'

    const hasDemoValidationErrors = useMemo(
        () =>
            serviceCatalog.some((catalogItem) => {
                const draft = demoDrafts[catalogItem.serviceId]
                return draft ? getPickerValidationErrorCode(draft) !== null : false
            }),
        [demoDrafts, serviceCatalog],
    )

    const isLegacyDuplicate = (serviceId: number): boolean =>
        services.some((service) => service.serviceId === serviceId)

    const isLegacyFormComplete = (): boolean =>
        selectedServiceId !== null &&
        duration.trim() !== '' &&
        Number(duration) > 0 &&
        (pricingType !== 'fixed' || (price.trim() !== '' && Number(price) > 0)) &&
        !isLegacyDuplicate(selectedServiceId)

    const setDemoDraft = (
        serviceId: number,
        updater: (draft: DemoDraft) => DemoDraft,
    ) => {
        setDemoDrafts((previousDrafts) => ({
            ...previousDrafts,
            [serviceId]: updater(
                previousDrafts[serviceId] ?? {
                    enabled: false,
                    duration: '',
                    durationUnit: 'minute',
                    pricingType: 'fixed',
                    price: '',
                    description: '',
                },
            ),
        }))
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
        setServiceLevels((previousLevels) => previousLevels.slice(0, levelIndex + 1))

        if (!option?.value) {
            return
        }

        setIsLoadingNextLevel(true)

        try {
            const response = await getServices({ parent_id: option.value })
            const nodes = resolveServiceNodes(response)

            if (nodes.length > 0) {
                setServiceLevels((previousLevels) => {
                    const updatedLevels = previousLevels.slice(0, levelIndex + 1)
                    updatedLevels[levelIndex + 1] = nodes
                    return updatedLevels
                })
            }
        } finally {
            setIsLoadingNextLevel(false)
        }
    }

    const handleLegacyAddService = async () => {
        if (isSaving || !isLegacyFormComplete() || selectedServiceId === null) {
            return
        }

        if (!newHojraData?.id) {
            toast.push(
                <Notification type="danger">
                    {t('center.services.errors.agencyMustBeCreated')}
                </Notification>,
            )
            return
        }

        setIsSaving(true)

        try {
            const response = await apiCreateAgencyService({
                agency_id: newHojraData.id,
                service_id: selectedServiceId,
                title: selectedServiceLabel || undefined,
                sub_title:
                    description.trim().slice(0, 191) ||
                    selectedServiceLabel ||
                    t('center.services.labels.service'),
                estimate_time: Number(duration),
                duration_unit: durationUnit,
                pricing_type: pricingType,
                price: pricingType === 'fixed' ? Number(price) : null,
                body: description.trim() || undefined,
            })

            addService({
                id: response.data.id,
                serviceId: selectedServiceId,
                serviceLabel: selectedServiceLabel,
                duration: Number(duration),
                durationUnit,
                durationLabel: formatDurationLabelLocalized(
                    Number(duration),
                    durationUnit,
                ),
                durationMinutes: durationToMinutes(Number(duration), durationUnit),
                pricingType,
                needsCoordination: pricingType !== 'fixed',
                price: pricingType === 'fixed' ? Number(price) : null,
                priceMin: null,
                priceMax: null,
                description: description.trim(),
            })

            setServicePath([])
            setDuration('')
            setDurationUnit('minute')
            setPricingType('fixed')
            setPrice('')
            setDescription('')
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : t('center.services.errors.saveSelectedFailed')

            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemoveService = async (agencyServiceId: number) => {
        if (deletingServiceId !== null) {
            return
        }

        setDeletingServiceId(agencyServiceId)

        try {
            const response = await apiDeleteAgencyService(agencyServiceId)
            if (!response?.success) {
                throw new Error(
                    response?.message || t('center.services.errors.deleteFailed'),
                )
            }

            removeService(agencyServiceId)
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : t('center.services.errors.deleteFailed')

            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setDeletingServiceId(null)
        }
    }

    const handleDemoSave = async () => {
        if (isDemoSaving) {
            return
        }

        if (!newHojraData?.id) {
            toast.push(
                <Notification type="danger">
                    {t('center.services.errors.agencyMustBeCreated')}
                </Notification>,
            )
            return
        }

        for (const catalogItem of serviceCatalog) {
            const draft = demoDrafts[catalogItem.serviceId]
            if (!draft) {
                continue
            }

            const validationErrorCode = getPickerValidationErrorCode(draft)
            if (validationErrorCode) {
                toast.push(
                    <Notification type="danger">
                        {catalogItem.label}:{' '}
                        {validationErrorCode === 'duration_required'
                            ? t('center.services.validation.durationRequired')
                            : t('center.services.validation.priceRequired')}
                    </Notification>,
                )
                return
            }
        }

        setIsDemoSaving(true)

        try {
            const response = await apiSyncDemoAgencyServices({
                agency_id: newHojraData.id,
                services: serviceCatalog.map((catalogItem) => {
                    const draft = demoDrafts[catalogItem.serviceId] ?? {
                        enabled: false,
                        duration: '',
                        durationUnit: 'minute' as const,
                        pricingType: 'fixed' as const,
                        price: '',
                        description: '',
                    }

                    const body = draft.description.trim()

                    return {
                        service_id: catalogItem.serviceId,
                        enabled: draft.enabled,
                        title: catalogItem.label,
                        sub_title: body.slice(0, 191) || catalogItem.label,
                        estimate_time:
                            draft.enabled && draft.duration.trim() !== ''
                                ? Number(draft.duration)
                                : undefined,
                        duration_unit: draft.enabled ? draft.durationUnit : undefined,
                        pricing_type: draft.enabled ? draft.pricingType : undefined,
                        price:
                            draft.enabled && draft.pricingType === 'fixed'
                                ? Number(draft.price)
                                : null,
                        body: body || undefined,
                    }
                }),
            })

            replaceServices(response.data.map(mapAgencyServiceToStoreItem))

            toast.push(
                <Notification type="success">
                    {t('center.services.success.synced')}
                </Notification>,
            )
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : t('center.services.errors.syncFailed')

            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setIsDemoSaving(false)
        }
    }

    return (
        <Card
            header={{
                content: t('center.services.title'),
                bordered: false,
            }}
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/10 bg-primary/5 p-4">
                    <div>
                        <div className="text-sm font-semibold text-primary-deep">
                            {t('center.services.flow.title')}
                        </div>
                        <div className="text-xs text-gray-500">
                            {t('center.services.flow.subtitle')}
                        </div>
                    </div>
                    <Switcher
                        checked={viewMode === 'picker'}
                        checkedContent={t('center.services.flow.picker')}
                        unCheckedContent={t('center.services.flow.legacy')}
                        onChange={(checked) =>
                            setViewMode(checked ? 'picker' : 'legacy')
                        }
                    />
                </div>

                {isLoadingTree ? (
                    <div className="text-sm text-gray-500">
                        {t('center.services.loading.available')}
                    </div>
                ) : serviceCatalog.length === 0 && levels.length === 0 ? (
                    <div className="text-sm text-gray-500">
                        {t('center.services.empty.noChildren')}
                    </div>
                ) : viewMode === 'picker' ? (
                    <div className="space-y-4">
                        <div className="grid gap-3">
                            {serviceCatalog.map((catalogItem) => {
                                const draft =
                                    demoDrafts[catalogItem.serviceId] ?? {
                                        enabled: false,
                                        duration: '',
                                        pricingType: 'fixed' as const,
                                        price: '',
                                        description: '',
                                    }
                                const infoText =
                                    draft.pricingType === 'coordination'
                                        ? t('center.services.info.coordination')
                                        : draft.pricingType === 'member_based'
                                          ? t('center.services.info.memberBased')
                                          : null

                                return (
                                    <Card key={catalogItem.serviceId}>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="font-semibold text-primary-deep">
                                                    {catalogItem.label}
                                                </div>
                                                <Switcher
                                                    checked={draft.enabled}
                                                    onChange={(checked) =>
                                                        setDemoDraft(
                                                            catalogItem.serviceId,
                                                            (currentDraft) => ({
                                                                ...currentDraft,
                                                                enabled: checked,
                                                            }),
                                                        )
                                                    }
                                                />
                                            </div>

                                            {draft.enabled && (
                                                <>
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                                        <FormItem
                                                            label={t(
                                                                'center.services.labels.duration',
                                                            )}
                                                        >
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={draft.duration}
                                                                placeholder={t(
                                                                    'center.services.placeholders.duration',
                                                                )}
                                                                onChange={(event) =>
                                                                    setDemoDraft(
                                                                        catalogItem.serviceId,
                                                                        (
                                                                            currentDraft,
                                                                        ) => ({
                                                                            ...currentDraft,
                                                                            duration:
                                                                                extractDigits(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </FormItem>

                                                        <FormItem
                                                            label={t(
                                                                'center.services.labels.durationUnit',
                                                            )}
                                                        >
                                                            <Select<DurationUnitOption>
                                                                options={
                                                                    durationUnitOptionsLocalized
                                                                }
                                                                value={getDurationUnitOption(
                                                                    draft.durationUnit,
                                                                )}
                                                                onChange={(option) =>
                                                                    setDemoDraft(
                                                                        catalogItem.serviceId,
                                                                        (
                                                                            currentDraft,
                                                                        ) => ({
                                                                            ...currentDraft,
                                                                            durationUnit:
                                                                                (option?.value as DurationUnit) ??
                                                                                'minute',
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </FormItem>

                                                        <FormItem
                                                            label={t(
                                                                'center.services.labels.pricingType',
                                                            )}
                                                        >
                                                            <Select<SelectOption>
                                                                options={pricingOptionsLocalized.map(
                                                                    (
                                                                        option,
                                                                    ) => ({
                                                                        value: option.value,
                                                                        label: option.label,
                                                                    }),
                                                                )}
                                                                value={getPricingOption(
                                                                    draft.pricingType,
                                                                )}
                                                                onChange={(option) =>
                                                                    setDemoDraft(
                                                                        catalogItem.serviceId,
                                                                        (
                                                                            currentDraft,
                                                                        ) => ({
                                                                            ...currentDraft,
                                                                            pricingType:
                                                                                pricingOptionsLocalized.find(
                                                                                    (
                                                                                        pricingOption,
                                                                                    ) =>
                                                                                        pricingOption.value ===
                                                                                        option?.value,
                                                                                )
                                                                                    ?.pricingType ??
                                                                                'fixed',
                                                                            price:
                                                                                option?.value ===
                                                                                1
                                                                                    ? currentDraft.price
                                                                                    : '',
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </FormItem>

                                                        <FormItem
                                                            label={t(
                                                                'center.services.labels.price',
                                                            )}
                                                        >
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={draft.price}
                                                                placeholder={t(
                                                                    'center.services.placeholders.price',
                                                                )}
                                                                disabled={
                                                                    draft.pricingType !==
                                                                    'fixed'
                                                                }
                                                                onChange={(event) =>
                                                                    setDemoDraft(
                                                                        catalogItem.serviceId,
                                                                        (
                                                                            currentDraft,
                                                                        ) => ({
                                                                            ...currentDraft,
                                                                            price:
                                                                                extractDigits(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </FormItem>
                                                    </div>

                                                    <FormItem
                                                        label={t(
                                                            'center.services.labels.description',
                                                        )}
                                                    >
                                                        <Input
                                                            value={draft.description}
                                                            placeholder={t(
                                                                'center.services.placeholders.description',
                                                            )}
                                                            onChange={(event) =>
                                                                setDemoDraft(
                                                                    catalogItem.serviceId,
                                                                    (
                                                                        currentDraft,
                                                                    ) => ({
                                                                        ...currentDraft,
                                                                        description:
                                                                            event.target.value,
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                    </FormItem>

                                                    {infoText && (
                                                        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm text-gray-700">
                                                            {infoText}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>

                        <div className="flex items-center justify-end">
                            <Button
                                variant="solid"
                                loading={isDemoSaving}
                                disabled={
                                    isDemoSaving ||
                                    serviceCatalog.length === 0 ||
                                    hasDemoValidationErrors
                                }
                                onClick={handleDemoSave}
                            >
                                {t('center.services.actions.save')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {levels.length === 0 ? (
                            <div className="text-sm text-gray-500">
                                {t('center.services.empty.noChildren')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {levels.map((nodes, index) => {
                                    const options: SelectOption[] = nodes.map(
                                        (node) => ({
                                            value: node.id,
                                            label: node.name,
                                        }),
                                    )

                                    const label =
                                        index === 0
                                            ? t('center.services.labels.mainService')
                                            : t('center.services.labels.subServiceLevel', {
                                                  level: index + 1,
                                              })

                                    return (
                                        <FormItem key={index} label={label}>
                                            <Select<SelectOption>
                                                placeholder={t(
                                                    'center.services.placeholders.chooseService',
                                                )}
                                                options={options}
                                                value={
                                                    options.find(
                                                        (option) =>
                                                            option.value ===
                                                            servicePath[index],
                                                    ) || null
                                                }
                                                onChange={(option) =>
                                                    handleSelectLevel(
                                                        index,
                                                        option ?? null,
                                                    )
                                                }
                                            />
                                        </FormItem>
                                    )
                                })}

                                {isLoadingNextLevel && (
                                    <div className="text-sm text-gray-500">
                                        {t('center.services.loading.subServices')}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <FormItem label={t('center.services.labels.duration')}>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={duration}
                                    placeholder={t(
                                        'center.services.placeholders.duration',
                                    )}
                                    onChange={(event) =>
                                        setDuration(
                                            extractDigits(event.target.value),
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label={t('center.services.labels.durationUnit')}>
                                    <Select<DurationUnitOption>
                                        options={durationUnitOptionsLocalized}
                                    value={getDurationUnitOption(durationUnit)}
                                    onChange={(option) =>
                                        setDurationUnit(
                                            (option?.value as DurationUnit) ??
                                                'minute',
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label={t('center.services.labels.pricingType')}>
                                <Select<SelectOption>
                                    options={pricingOptionsLocalized.map((option) => ({
                                        value: option.value,
                                        label: option.label,
                                    }))}
                                    value={getPricingOption(pricingType)}
                                    onChange={(option) => {
                                        const nextPricingType =
                                            pricingOptionsLocalized.find(
                                                (pricingOption) =>
                                                    pricingOption.value ===
                                                    option?.value,
                                            )?.pricingType ?? 'fixed'
                                        setPricingType(nextPricingType)

                                        if (nextPricingType !== 'fixed') {
                                            setPrice('')
                                        }
                                    }}
                                />
                            </FormItem>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <FormItem label={t('center.services.labels.price')}>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={price}
                                    placeholder={t(
                                        'center.services.placeholders.price',
                                    )}
                                    disabled={pricingType !== 'fixed'}
                                    onChange={(event) =>
                                        setPrice(extractDigits(event.target.value))
                                    }
                                />
                            </FormItem>
                        </div>

                        {pricingType !== 'fixed' && (
                            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm text-gray-700">
                                {pricingType === 'coordination'
                                    ? t('center.services.info.coordination')
                                    : t('center.services.info.memberBased')}
                            </div>
                        )}

                        <FormItem label={t('center.services.labels.description')}>
                            <Input
                                value={description}
                                placeholder={t(
                                    'center.services.placeholders.description',
                                )}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                        </FormItem>

                        {selectedServiceId !== null &&
                            isLegacyDuplicate(selectedServiceId) && (
                                <div className="text-xs text-red-500">
                                    {t('center.services.validation.duplicateService')}
                                </div>
                            )}

                        <div className="flex items-center justify-end">
                            <Button
                                variant="default"
                                loading={isSaving}
                                disabled={isSaving || !isLegacyFormComplete()}
                                onClick={handleLegacyAddService}
                            >
                                {t('center.services.actions.add')}
                            </Button>
                        </div>
                    </div>
                )}

                {services.length > 0 && (
                    <div className="space-y-3 border-t pt-6">
                        <h3 className="text-lg font-semibold">
                            {t('center.services.enabledServices', {
                                count: services.length,
                            })}
                        </h3>

                        {services.map((service) => (
                            <Card key={service.id}>
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="flex-1">
                                        <div className="mb-1 text-base font-semibold text-primary-deep">
                                            {service.serviceLabel}
                                        </div>
                                        <div className="mb-1 flex flex-wrap gap-4 text-sm text-gray-600">
                                            <span>
                                                {t('center.services.labels.duration')}:{' '}
                                                {formatDurationLabelLocalized(
                                                    service.duration,
                                                    service.durationUnit,
                                                )}
                                            </span>
                                            <span>
                                                {t('center.services.labels.pricingType')}:{' '}
                                                {getPricingTypeLabelLocalized(
                                                    service.pricingType as PricingType,
                                                )}
                                            </span>
                                            <span>
                                                {t('center.services.labels.price')}:{' '}
                                                {getServicePricingLabelLocalized(service)}
                                            </span>
                                        </div>
                                        {service.description && (
                                            <div className="text-sm text-gray-700">
                                                {service.description}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="solid"
                                        shape="circle"
                                        size="xs"
                                        className="bg-red-300 transition-all hover:bg-red-400"
                                        loading={deletingServiceId === service.id}
                                        onClick={() =>
                                            handleRemoveService(service.id)
                                        }
                                    >
                                        {t('center.services.actions.delete')}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {(onBack || canGoNext) && (
                    <div className="flex items-center justify-end gap-3">
                        {onBack && (
                            <Button size="sm" variant="default" onClick={onBack}>
                                {t('center.wizard.back')}
                            </Button>
                        )}
                        {canGoNext && (
                            <Button size="sm" variant="solid" onClick={onNext}>
                                {t('center.services.actions.nextAssign')}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    )
}
