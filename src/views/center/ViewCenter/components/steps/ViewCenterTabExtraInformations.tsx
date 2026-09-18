import {
    Button,
    Card,
    Form,
    FormItem,
    Input,
    Select,
    Spinner,
    toast,
} from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import useTranslation from '@/utils/hooks/useTranslation'
import { useCreateStore } from '@/context/createStoreContext'
import { MapPicker } from './components/MapPicker'
import PhoneNumberInput, {
    type PhoneNumberValue,
} from '@/components/shared/PhoneNumberInput'
import {
    apiGetCities,
    apiGetMyAgency,
    apiUpdateInfoMyAgency,
    apiUploadMyAgencyMedia,
} from '@/services/CenterService'
import { AgencyExtraInfoItem, Cities } from '@/@types/center'
import { htmlToPlainText } from '@/utils/text/htmlToPlainText'
import { prepareValidatedFile } from '../utils/fileUpload'
import { AdditionalInfo, AdditionalInfoEditor, DEFAULT_ADDITIONAL_INFO, DEFAULT_SCHEDULE, OpeningHoursEditor, WeeklySchedule } from './components/WorkingHoursEditor'

const buildValidationSchema = (t: (key: string) => string) => z.object({
    logo: z.union([z.instanceof(File), z.null()]).optional(),
    banner: z.union([z.instanceof(File), z.null()]).optional(),
    latitude: z.string().refine((value) => value === '' || (Number(value) >= -90 && Number(value) <= 90), t('viewCenterExtraValidation.invalidLatitude')).optional(),
    longitude: z.string().refine((value) => value === '' || (Number(value) >= -180 && Number(value) <= 180), t('viewCenterExtraValidation.invalidLongitude')).optional(),
    city_id: z.number().nullable().optional(),
    phone: z.string().optional(),
    website: z.union([z.literal(''), z.string().url(t('viewCenterExtraValidation.invalidWebsite'))]).optional(),
    address: z.string().max(500, t('viewCenterExtraValidation.addressTooLong')).optional(),
    instagram: z.union([z.literal(''), z.string().url(t('viewCenterExtraValidation.invalidInstagram'))]).optional(),
    youtube: z.union([z.literal(''), z.string().url(t('viewCenterExtraValidation.invalidYouTube'))]).optional(),
    linkedin: z.union([z.literal(''), z.string().url(t('viewCenterExtraValidation.invalidLinkedIn'))]).optional(),
    facebook: z.union([z.literal(''), z.string().url(t('viewCenterExtraValidation.invalidFacebook'))]).optional(),
    h1: z.string().max(191).optional(),
    meta_description: z.string().max(400).optional(),
})

type FormValues = z.infer<ReturnType<typeof buildValidationSchema>>

const DEFAULT_COUNTRY_CODE = '+968'
const DAY_KEYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const ADDITIONAL_INFO_LABEL_KEYS: Record<keyof AdditionalInfo, string> = {
    instant_confirmation: 'viewCenterExtra.additionalInfo.instant_confirmation',
    kid_friendly: 'viewCenterExtra.additionalInfo.kid_friendly',
    parking_available: 'viewCenterExtra.additionalInfo.parking_available',
    near_public_transport: 'viewCenterExtra.additionalInfo.near_public_transport',
    environmentally_friendly: 'viewCenterExtra.additionalInfo.environmentally_friendly',
    woman_owned: 'viewCenterExtra.additionalInfo.woman_owned',
}

const parsePhoneValue = (
    phone: string | null | undefined,
): PhoneNumberValue => {
    const normalized = (phone || '').trim()
    if (!normalized) {
        return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: '' }
    }

    if (normalized.startsWith(DEFAULT_COUNTRY_CODE)) {
        return {
            countryCode: DEFAULT_COUNTRY_CODE,
            localNumber: normalized.slice(DEFAULT_COUNTRY_CODE.length),
        }
    }

    if (normalized.startsWith('968')) {
        return {
            countryCode: DEFAULT_COUNTRY_CODE,
            localNumber: normalized.slice(3),
        }
    }

    return {
        countryCode: DEFAULT_COUNTRY_CODE,
        localNumber: normalized.replace(/^\+/, ''),
    }
}

const stringifyPhoneValue = (value: PhoneNumberValue) =>
    `${value.countryCode}${value.localNumber}`.trim()

const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-sm font-semibold text-gray-800 mt-10 mb-6 pb-2 border-b border-gray-200">
        {title}
    </h3>
)

export const ViewCenterTabExtraInformations = () => {
    const { t } = useTranslation()
    const validationSchema = useMemo(() => buildValidationSchema(t), [t])
    const {
        newHojraData,
        extraInformationDraft,
        updateExtraInformationDraft,
        setExtraInformationDraft,
    } = useCreateStore()

    const [loadingCities, setLoadingCities] = useState(true)
    const [cities, setCities] = useState<Cities[]>([])
    const [error, setError] = useState<string | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(null)
    const [publicImagePreview, setPublicImagePreview] = useState<string | null>(null)
    const [publicImageFile, setPublicImageFile] = useState<File | null>(null)
    const [phoneValue, setPhoneValue] = useState<PhoneNumberValue>({
        countryCode: DEFAULT_COUNTRY_CODE,
        localNumber: '',
    })

    const logoInputRef = useRef<HTMLInputElement | null>(null)
    const bannerInputRef = useRef<HTMLInputElement | null>(null)
    const publicImageInputRef = useRef<HTMLInputElement | null>(null)

    const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE)
    const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>(DEFAULT_ADDITIONAL_INFO)
    const [existingExtraInfo, setExistingExtraInfo] = useState<AgencyExtraInfoItem[]>([])


    const revokeIfBlobUrl = (url: string | null) => {
        if (!url) return
        if (!url.startsWith('blob:')) return
        try {
            URL.revokeObjectURL(url)
        } catch {
            // no-op
        }
    }

    const getApiErrorMessage = (err: unknown): string | undefined => {
        const response = (err as {
            response?: { data?: { errors?: Record<string, unknown>; message?: unknown } }
        })?.response
        const data = response?.data
        const errors = data?.errors

        if (errors && typeof errors === 'object') {
            const first = Object.values(errors).find(
                (v) => Array.isArray(v) && typeof v[0] === 'string',
            ) as string[] | undefined
            if (first?.[0]) return first[0]
        }

        if (typeof data?.message === 'string') return data.message
        return
    }

    const form = useForm<FormValues>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            logo: null,
            banner: null,
            latitude: '',
            longitude: '',
            city_id: undefined,
            phone: '',
            website: '',
            address: '',
            instagram: '',
            youtube: '',
            linkedin: '',
            facebook: '',
            h1: '',
            meta_description: '',
        },
    })

    const {
        handleSubmit,
        control,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = form

    useEffect(() => {
        const fetchData = async () => {
            const slug =
                typeof newHojraData?.slug === 'string' ? newHojraData.slug : ''

            if (!slug.trim()) {
                setError(t('viewCenterExtra.unavailable'))
                setLoadingCities(false)
                return
            }

            try {
                const hasDraft =
                    Boolean(extraInformationDraft?.logoPreview) ||
                    Boolean(extraInformationDraft?.bannerPreview) ||
                    Boolean(
                        extraInformationDraft?.values &&
                        Object.keys(extraInformationDraft.values).length >
                        0,
                    )

                if (hasDraft) {
                    const draftValues = extraInformationDraft?.values ?? {}
                    reset({ ...form.getValues(), ...draftValues })

                    setLogoPreview(extraInformationDraft.logoPreview ?? null)
                    setBannerPreview(
                        extraInformationDraft.bannerPreview ?? null,
                    )
                    setPhoneValue(parsePhoneValue(draftValues.phone as string))
                    if (extraInformationDraft.weeklySchedule) {
                        setWeeklySchedule(
                            extraInformationDraft.weeklySchedule as WeeklySchedule,
                        )
                    }
                    if (extraInformationDraft.additionalInfo) {
                        setAdditionalInfo(
                            extraInformationDraft.additionalInfo as AdditionalInfo,
                        )
                    }
                }

                if (!hasDraft) {
                    const agencyResp = await apiGetMyAgency(slug)
                    const agency = agencyResp.data

                    setLogoPreview(agency.logo || null)
                    setBannerPreview(agency.banner || null)
                    setPublicImagePreview(agency.public_image?.url || null)

                    setValue('city_id', agency.city?.id)
                    setValue('latitude', agency.latitude || '')
                    setValue('longitude', agency.longitude || '')
                    setValue('address', htmlToPlainText(agency.address || ''))
                    setValue('facebook', agency.facebook || '')
                    setValue('instagram', agency.instagram || '')
                    setValue('linkedin', agency.linkedin || '')
                    setValue('phone', agency.phone || '')
                    setPhoneValue(parsePhoneValue(agency.phone || ''))
                    setValue('website', agency.website || '')
                    setValue('youtube', agency.youtube || '')
                    setValue('h1', htmlToPlainText(agency.h1 || ''))
                    setValue(
                        'meta_description',
                        htmlToPlainText(agency.meta_description || ''),
                    )

                    const schedule = { ...DEFAULT_SCHEDULE }
                    for (const day of agency.working_hours_days ?? []) {
                        const key = DAY_KEYS[day.day_of_week]
                        if (!key) continue
                        const firstSlot = day.slots?.[0]
                        schedule[key] = {
                            closed: day.is_closed || !firstSlot,
                            open: firstSlot?.start ?? DEFAULT_SCHEDULE[key].open,
                            close: firstSlot?.end ?? DEFAULT_SCHEDULE[key].close,
                        }
                    }
                    setWeeklySchedule(schedule)

                    const loadedExtraInfo = agency.extra_info ?? []
                    setExistingExtraInfo(loadedExtraInfo)
                    setAdditionalInfo((current) => {
                        const next = { ...current }
                        for (const item of loadedExtraInfo) {
                            if (item.key && item.key in next) {
                                next[item.key as keyof AdditionalInfo] =
                                    item.is_active &&
                                    ['1', 'true', 'on', 'yes'].includes(
                                        String(item.value ?? '').toLowerCase(),
                                    )
                            }
                        }
                        return next
                    })

                    updateExtraInformationDraft({
                        logoPreview: agency.logo || null,
                        bannerPreview: agency.banner || null,
                        weeklySchedule: schedule,
                        additionalInfo: loadedExtraInfo.reduce(
                            (next, item) => {
                                if (item.key && item.key in next) {
                                    next[item.key as keyof AdditionalInfo] =
                                        item.is_active &&
                                        ['1', 'true', 'on', 'yes'].includes(
                                            String(item.value ?? '').toLowerCase(),
                                        )
                                }
                                return next
                            },
                            { ...DEFAULT_ADDITIONAL_INFO },
                        ),
                        values: {
                            city_id: agency.city?.id,
                            latitude: agency.latitude || '',
                            longitude: agency.longitude || '',
                            address: htmlToPlainText(agency.address || ''),
                            facebook: agency.facebook || '',
                            instagram: agency.instagram || '',
                            linkedin: agency.linkedin || '',
                            phone: agency.phone || '',
                            website: agency.website || '',
                            youtube: agency.youtube || '',
                            h1: htmlToPlainText(agency.h1 || ''),
                            meta_description: htmlToPlainText(
                                agency.meta_description || '',
                            ),
                        },
                    })
                }
            } catch (err) {
                setError(getApiErrorMessage(err) || t('viewCenterExtra.loadInfoError'))
            }

            try {
                const citiesResp = await apiGetCities()
                setCities(citiesResp.data)
            } catch (err) {
                setError(getApiErrorMessage(err) || t('viewCenterExtra.loadCitiesError'))
            } finally {
                setLoadingCities(false)
            }
        }

        fetchData()
        // Intentionally exclude `extraInformationDraft` to avoid overwriting
        // in-progress form edits on every draft update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newHojraData.slug, setValue, updateExtraInformationDraft])

    useEffect(() => {
        const subscription = watch((values) => {
            updateExtraInformationDraft({
                values,
            })
        })

        return () => subscription.unsubscribe()
    }, [updateExtraInformationDraft, watch])

    useEffect(() => {
        updateExtraInformationDraft({
            weeklySchedule,
            additionalInfo,
        })
    }, [additionalInfo, updateExtraInformationDraft, weeklySchedule])

    const lat = watch('latitude')
    const lng = watch('longitude')

    const onSubmit = async (values: FormValues) => {
        try {
            const slug =
                typeof newHojraData?.slug === 'string' ? newHojraData.slug : ''
            if (!slug.trim()) {
            throw new Error(t('viewCenterExtra.unavailable'))
            }

            const formData = new FormData()

            Object.entries(values).forEach(([key, value]) => {
                if (value instanceof File) {
                    formData.append(key, value)
                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value))
                }
            })

            DAY_KEYS.forEach((key, index) => {
                const day = weeklySchedule[key]
                formData.append(`working_hours_days[${index}][day_of_week]`, String(index))
                formData.append(`working_hours_days[${index}][is_closed]`, day.closed ? '1' : '0')
                if (!day.closed) {
                    formData.append(`working_hours_days[${index}][slots][0][start]`, day.open)
                    formData.append(`working_hours_days[${index}][slots][0][end]`, day.close)
                    formData.append(`working_hours_days[${index}][slots][0][is_active]`, '1')
                }
            })

            const knownKeys = new Set(Object.keys(additionalInfo))
            const extraInfo = [
                ...existingExtraInfo.filter((item) => !item.key || !knownKeys.has(item.key)),
                ...Object.entries(additionalInfo).map(([key, enabled], index) => ({
                    key,
                    label: t(ADDITIONAL_INFO_LABEL_KEYS[key as keyof AdditionalInfo]),
                    value: '1',
                    type: 'boolean',
                    is_active: enabled,
                    order_number: index,
                })),
            ]

            extraInfo.forEach((item, index) => {
                if (item.key) formData.append(`extra_info[${index}][key]`, item.key)
                formData.append(`extra_info[${index}][label]`, item.label)
                formData.append(`extra_info[${index}][value]`, item.value ?? '')
                formData.append(`extra_info[${index}][type]`, item.type || 'text')
                formData.append(`extra_info[${index}][is_active]`, item.is_active ? '1' : '0')
                formData.append(`extra_info[${index}][order_number]`, String(item.order_number ?? index))
            })

            const resp = await apiUpdateInfoMyAgency(slug, formData)

            if (!resp?.success) {
            throw new Error(resp?.message || t('viewCenterExtra.saveError'))
            }

            if (publicImageFile) {
                const media = new FormData()
                media.append('collection', 'agency_public_images')
                media.append('file', publicImageFile)

                const upload = await apiUploadMyAgencyMedia(slug, media)
                if (!upload?.success) {
            throw new Error(upload?.message || t('viewCenterExtra.uploadPublicImageError'))
                }
            }

            toast.push(
                <Notification type="success">
                    {t('viewCenterExtra.saved')}
                </Notification>,
            )

            updateExtraInformationDraft({
                values: {
                    ...values,
                },
            })

            const agencyResp = await apiGetMyAgency(slug)
            const agency = agencyResp.data

            revokeIfBlobUrl(logoPreview)
            revokeIfBlobUrl(bannerPreview)

            const nextLogoPreview = agency.logo || null
            const nextBannerPreview = agency.banner || null
            const nextPublicImagePreview = agency.public_image?.url || null

            setLogoPreview(nextLogoPreview)
            setBannerPreview(nextBannerPreview)
            revokeIfBlobUrl(publicImagePreview)
            setPublicImagePreview(nextPublicImagePreview)
            setPublicImageFile(null)

            setValue('logo', null, { shouldDirty: false })
            setValue('banner', null, { shouldDirty: false })

            if (logoInputRef.current) logoInputRef.current.value = ''
            if (bannerInputRef.current) bannerInputRef.current.value = ''
            if (publicImageInputRef.current) publicImageInputRef.current.value = ''

            setExtraInformationDraft({
                values: {
                    ...values,
                    logo: null,
                    banner: null,
                },
                logoPreview: nextLogoPreview,
                bannerPreview: nextBannerPreview,
            })

            toast.push(
                <Notification type="success">
                    {t('viewCenterExtra.changesSaved')}
                </Notification>,
            )
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(err) ||
                        (err instanceof Error ? err.message : undefined) ||
                        t('viewCenterExtra.saveError')}
                </Notification>,
            )
        }
    }

    const cityOptions = useMemo(
        () => cities.map((c) => ({ value: c.id, label: c.name })),
        [cities],
    )

    if (loadingCities)
        return (
            <div className="flex flex-col items-center">
                <Spinner />
                <div>{t('loading')}</div>
            </div>
        )

    if (error) return <div className="text-red-500 p-4">{error}</div>
    return (
        <div>
            <Card>
                <Form size="md" onSubmit={handleSubmit(onSubmit)}>
                    {/* ===================== الصور والوسائط ===================== */}
                    <SectionTitle title={t('viewCenterExtra.media')} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo */}
                        <FormItem label={t('viewCenterExtra.logo')}>
                            <Controller
                                name="logo"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-3">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Logo"
                                                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
                                                {t('viewCenterExtra.noLogo')}
                                            </div>
                                        )}

                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const inputFile =
                                                    e.target.files?.[0]
                                                if (!inputFile) return
                                                const { file, error: fileError } =
                                                    prepareValidatedFile(
                                                        inputFile,
                                                        {
                                                            category: 'image',
                                                        },
                                                    )
                                                if (fileError || !file) {
                                                    toast.push(
                                                        <Notification type="danger">
                                                            {fileError}
                                                        </Notification>,
                                                    )
                                                    e.target.value = ''
                                                    return
                                                }
                                                field.onChange(file)
                                                const nextPreview =
                                                    URL.createObjectURL(file)
                                                revokeIfBlobUrl(logoPreview)
                                                setLogoPreview(nextPreview)
                                                updateExtraInformationDraft({
                                                    logoPreview: nextPreview,
                                                })
                                            }}
                                        />

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                type="button"
                                                onClick={() =>
                                                    logoInputRef.current?.click()
                                                }
                                            >
                                                {logoPreview
                                                    ? t('viewCenterExtra.changeLogo')
                                                    : t('viewCenterExtra.chooseLogo')}
                                            </Button>

                                            {logoPreview && (
                                                <Button
                                                    size="sm"
                                                    variant="plain"
                                                    type="button"
                                                    onClick={() => {
                                                        revokeIfBlobUrl(logoPreview)
                                                        setLogoPreview(null)
                                                        field.onChange(null)
                                                        updateExtraInformationDraft(
                                                            {
                                                                logoPreview: null,
                                                            },
                                                        )
                                                        if (logoInputRef.current) {
                                                            logoInputRef.current.value =
                                                                ''
                                                        }
                                                    }}
                                                >
                                                    {t('viewCenterExtra.delete')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            />
                        </FormItem>

                        {/* Public page image */}
                        <FormItem label={t('viewCenterExtra.publicImage')}>
                            <div className="space-y-3">
                                {publicImagePreview ? (
                                    <img
                                        src={publicImagePreview}
                                        alt="Public page image"
                                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                    />
                                ) : (
                                    <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
                                        {t('viewCenterExtra.noPublicImage')}
                                    </div>
                                )}

                                <input
                                    ref={publicImageInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/avif"
                                    className="hidden"
                                    onChange={(event) => {
                                        const inputFile = event.target.files?.[0]
                                        if (!inputFile) return

                                        const { file, error: fileError } =
                                            prepareValidatedFile(inputFile, {
                                                category: 'image',
                                            })
                                        if (fileError || !file) {
                                            toast.push(
                                                <Notification type="danger">
                                                    {fileError}
                                                </Notification>,
                                            )
                                            event.target.value = ''
                                            return
                                        }

                                        revokeIfBlobUrl(publicImagePreview)
                                        setPublicImageFile(file)
                                        setPublicImagePreview(
                                            URL.createObjectURL(file),
                                        )
                                    }}
                                />

                                <Button
                                    size="sm"
                                    variant="solid"
                                    type="button"
                                    onClick={() =>
                                        publicImageInputRef.current?.click()
                                    }
                                >
                                    {publicImagePreview
                                        ? t('viewCenterExtra.changePublicImage')
                                        : t('viewCenterExtra.choosePublicImage')}
                                </Button>
                            </div>
                        </FormItem>
                    </div>

                    {/* Banner */}
                    <FormItem label={t('viewCenterExtra.banner')} className="mt-6">
                        <Controller
                            name="banner"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-3">
                                    {bannerPreview ? (
                                        <img
                                            src={bannerPreview}
                                            alt="Banner"
                                            className="w-full max-w-2xl h-48 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-full max-w-2xl h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
                                            {t('viewCenterExtra.noBanner')}
                                        </div>
                                    )}

                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const inputFile =
                                                e.target.files?.[0]
                                            if (!inputFile) return
                                            const { file, error: fileError } =
                                                prepareValidatedFile(
                                                    inputFile,
                                                    {
                                                        category: 'image',
                                                    },
                                                )
                                            if (fileError || !file) {
                                                toast.push(
                                                    <Notification type="danger">
                                                        {fileError}
                                                    </Notification>,
                                                )
                                                e.target.value = ''
                                                return
                                            }
                                            field.onChange(file)
                                            const nextPreview =
                                                URL.createObjectURL(file)
                                            revokeIfBlobUrl(bannerPreview)
                                            setBannerPreview(nextPreview)
                                            updateExtraInformationDraft({
                                                bannerPreview: nextPreview,
                                            })
                                        }}
                                    />

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="solid"
                                            type="button"
                                            onClick={() =>
                                                bannerInputRef.current?.click()
                                            }
                                        >
                                            {bannerPreview
                                                ? t('viewCenterExtra.changeBanner')
                                                : t('viewCenterExtra.chooseBanner')}
                                        </Button>

                                        {bannerPreview && (
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                type="button"
                                                onClick={() => {
                                                    revokeIfBlobUrl(
                                                        bannerPreview,
                                                    )
                                                    setBannerPreview(null)
                                                    field.onChange(null)
                                                    updateExtraInformationDraft(
                                                        {
                                                            bannerPreview: null,
                                                        },
                                                    )
                                                    if (
                                                        bannerInputRef.current
                                                    ) {
                                                        bannerInputRef.current.value =
                                                            ''
                                                    }
                                                }}
                                            >
                                                {t('viewCenterExtra.delete')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </FormItem>

                    {/* ===================== الموقع الجغرافي ===================== */}
                    <SectionTitle title={t('viewCenterExtra.location')} />

                    {/* Map */}
                    <div className="mb-8">
                        <FormItem label={t('viewCenterExtra.mapLocation')}>
                            <MapPicker
                                lat={lat ? Number(lat) : undefined}
                                lng={lng ? Number(lng) : undefined}
                                onPick={(la, ln) => {
                                    setValue('latitude', String(la))
                                    setValue('longitude', String(ln))
                                }}
                            />
                        </FormItem>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <FormItem
                                label={t('viewCenterExtra.latitude')}
                                invalid={Boolean(errors.latitude)}
                                errorMessage={errors.latitude?.message}
                            >
                                <Controller
                                    name="latitude"
                                    control={control}
                                    render={({ field }) => (
                                        <div dir="ltr">
                                            <Input
                                                type="text"
                                                placeholder="23.5880"
                                                className="text-left"
                                                {...field}
                                            />
                                        </div>
                                    )}
                                />
                            </FormItem>

                            <FormItem
                                label={t('viewCenterExtra.longitude')}
                                invalid={Boolean(errors.longitude)}
                                errorMessage={errors.longitude?.message}
                            >
                                <Controller
                                    name="longitude"
                                    control={control}
                                    render={({ field }) => (
                                        <div dir="ltr">
                                            <Input
                                                type="text"
                                                placeholder="58.3829"
                                                className="text-left"
                                                {...field}
                                            />
                                        </div>
                                    )}
                                />
                            </FormItem>
                        </div>
                    </div>

                    <FormItem label={t('viewCenterExtra.city')} className="mb-6">
                        <Controller
                            name="city_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    size="sm"
                                    placeholder={t('viewCenterExtra.chooseCity')}
                                    options={cityOptions}
                                    value={
                                        cityOptions.find(
                                            (c) => c.value === field.value,
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        field.onChange(opt?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label={t('viewCenterExtra.address')} className="mb-6">
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    placeholder={t('viewCenterExtra.address')}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* ===================== معلومات التواصل ===================== */}
                    <SectionTitle title={t('viewCenterExtra.contact')} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormItem label={t('viewCenterExtra.phone')}>
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <PhoneNumberInput
                                        value={phoneValue}
                                        invalid={Boolean(errors.phone)}
                                        onChange={(nextValue) => {
                                            setPhoneValue(nextValue)
                                            field.onChange(
                                                stringifyPhoneValue(nextValue),
                                            )
                                        }}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label={t('viewCenterExtra.website')}>
                            <Controller
                                name="website"
                                control={control}
                                render={({ field }) => (
                                    <div dir="ltr">
                                        <Input
                                            type="text"
                                            placeholder="https://example.com"
                                            className="text-left"
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </FormItem>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FormItem label="Instagram">
                            <Controller
                                name="instagram"
                                control={control}
                                render={({ field }) => (
                                    <div dir="ltr">
                                        <Input
                                            placeholder="https://instagram.com/..."
                                            className="text-left"
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </FormItem>

                        <FormItem label="YouTube">
                            <Controller
                                name="youtube"
                                control={control}
                                render={({ field }) => (
                                    <div dir="ltr">
                                        <Input
                                            placeholder="https://youtube.com/..."
                                            className="text-left"
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </FormItem>

                        <FormItem label="LinkedIn">
                            <Controller
                                name="linkedin"
                                control={control}
                                render={({ field }) => (
                                    <div dir="ltr">
                                        <Input
                                            placeholder="https://linkedin.com/..."
                                            className="text-left"
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </FormItem>

                        <FormItem label="Facebook">
                            <Controller
                                name="facebook"
                                control={control}
                                render={({ field }) => (
                                    <div dir="ltr">
                                        <Input
                                            placeholder="https://facebook.com/..."
                                            className="text-left"
                                            {...field}
                                        />
                                    </div>
                                )}
                            />
                        </FormItem>
                    </div>

                    {/* ===================== ساعات العمل ===================== */}
                    <SectionTitle title={t('viewCenterExtra.workingHours')} />
                    <FormItem className="mb-6">
                        <OpeningHoursEditor value={weeklySchedule} onChange={setWeeklySchedule} />
                    </FormItem>

                    {/* ===================== معلومات إضافية ===================== */}
                    <SectionTitle title={t('viewCenterExtra.additionalInformation')} />
                    <FormItem className="mb-6">
                        <AdditionalInfoEditor value={additionalInfo} onChange={setAdditionalInfo} />
                    </FormItem>




                    {/* ===================== سئو ===================== */}
                    <SectionTitle title={t('viewCenterExtra.seo')} />

                    <FormItem
                        label={t('viewCenterExtra.h1')}
                        invalid={Boolean(errors.h1)}
                        errorMessage={errors.h1?.message}
                        className="mb-6"
                    >
                        <Controller
                            name="h1"
                            control={control}
                            render={({ field }) => (
                                <Input placeholder="H1" {...field} />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label={t('viewCenterExtra.metaDescription')}
                        invalid={Boolean(errors.meta_description)}
                        errorMessage={errors.meta_description?.message}
                        className="mb-6"
                    >
                        <Controller
                            name="meta_description"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    placeholder="Meta Description"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem>
                        <div className="flex justify-end">
                            <Button
                                loading={isSubmitting}
                                type="submit"
                                variant="solid"
                            >
                                {t('viewCenterExtra.update')}
                            </Button>
                        </div>
                    </FormItem>
                </Form>
            </Card>
        </div>
    )
}
