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
import { useTranslation } from '@/store/useTranslation'
import { useCreateStore } from '@/context/createStoreContext'
import { MapPicker } from './components/MapPicker'
import PhoneNumberInput, {
    type PhoneNumberValue,
} from '@/components/shared/PhoneNumberInput'
import {
    apiGetCities,
    apiGetMyAgency,
    apiUpdateInfoMyAgency,
} from '@/services/CenterService'
import { Cities } from '@/@types/center'
import { htmlToPlainText } from '@/utils/text/htmlToPlainText'
import { prepareValidatedFile } from '../utils/fileUpload'

interface HojraExtraInformationsProps {
    changeState: (value: number) => void
}

/* ✅ FIXED */
const validationSchema = z.object({
    logo: z.union([z.instanceof(File), z.null()]).optional(),
    banner: z.union([z.instanceof(File), z.null()]).optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    city_id: z.number().nullable().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional(),
    h1: z.string().max(191).optional(),
    meta_description: z.string().max(400).optional(),
})

type FormValues = z.infer<typeof validationSchema>

const DEFAULT_COUNTRY_CODE = '+968'

const parsePhoneValue = (phone: string | null | undefined): PhoneNumberValue => {
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

export const HojraExtraInformations = ({
    changeState,
}: HojraExtraInformationsProps) => {
    const { t } = useTranslation()
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
    const [phoneValue, setPhoneValue] = useState<PhoneNumberValue>({
        countryCode: DEFAULT_COUNTRY_CODE,
        localNumber: '',
    })

    const logoInputRef = useRef<HTMLInputElement | null>(null)
    const bannerInputRef = useRef<HTMLInputElement | null>(null)

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
        const response = (err as any)?.response
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
        watch,
        formState: { errors, isSubmitting },
    } = form

    useEffect(() => {
        const fetchData = async () => {
            const slug =
                typeof newHojraData?.slug === 'string' ? newHojraData.slug : ''

            if (!slug.trim()) {
                setError('ط§ظ„ظ…ط±ظƒط² ط؛ظٹط± ظ…طھط§ط­ ط­ط§ظ„ظٹط§ظ‹.')
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
                    Object.entries(draftValues).forEach(([key, value]) => {
                        setValue(key as any, value as any, {
                            shouldDirty: false,
                            shouldTouch: false,
                            shouldValidate: false,
                        })
                    })

                    setLogoPreview(extraInformationDraft.logoPreview ?? null)
                    setBannerPreview(
                        extraInformationDraft.bannerPreview ?? null,
                    )
                    setPhoneValue(parsePhoneValue(draftValues.phone as string))
                }

                if (!hasDraft) {
                    const agencyResp = await apiGetMyAgency(slug)
                    const agency = agencyResp.data

                    setLogoPreview(agency.logo || null)
                    setBannerPreview(agency.banner || null)

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

                    updateExtraInformationDraft({
                        logoPreview: agency.logo || null,
                        bannerPreview: agency.banner || null,
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
                setError(getApiErrorMessage(err) || 'ط®ط·ط§ ط¯ط± ط¯ط±غŒط§ظپطھ ط§ط·ظ„ط§ط¹ط§طھ')
            }

            try {
                const citiesResp = await apiGetCities()
                setCities(citiesResp.data)
            } catch (err) {
                setError(getApiErrorMessage(err) || 'ط®ط·ط§ ط¯ط± ط¯ط±غŒط§ظپطھ ط´ظ‡ط±ظ‡ط§')
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
                values: values as any,
            })
        })

        return () => subscription.unsubscribe()
    }, [updateExtraInformationDraft, watch])

    const lat = watch('latitude')
    const lng = watch('longitude')

    const onSubmit = async (values: FormValues) => {
        try {
            const slug =
                typeof newHojraData?.slug === 'string' ? newHojraData.slug : ''

            if (!slug.trim()) {
                throw new Error('ط§ظ„ظ…ط±ظƒط² ط؛ظٹط± ظ…طھط§ط­ ط­ط§ظ„ظٹط§ظ‹.')
            }

            const formData = new FormData()

            Object.entries(values).forEach(([key, value]) => {
                if (value instanceof File) {
                    formData.append(key, value)
                } else if (
                    value !== null &&
                    value !== undefined &&
                    value !== ''
                ) {
                    formData.append(key, String(value))
                }
            })

            const resp = await apiUpdateInfoMyAgency(slug, formData)

            if (!resp?.success) {
                throw new Error(resp?.message || 'ط®ط·ط§ ط¯ط± ط°ط®غŒط±ظ‡ ط§ط·ظ„ط§ط¹ط§طھ')
            }

            toast.push(
                <Notification type="success">
                    تم تحديث المعلومات بنجاح
                </Notification>,
            )

            updateExtraInformationDraft({
                values: {
                    ...(values as any),
                },
            })

            const agencyResp = await apiGetMyAgency(slug)
            const agency = agencyResp.data

            revokeIfBlobUrl(logoPreview)
            revokeIfBlobUrl(bannerPreview)

            const nextLogoPreview = agency.logo || null
            const nextBannerPreview = agency.banner || null

            setLogoPreview(nextLogoPreview)
            setBannerPreview(nextBannerPreview)

            setValue('logo', null, { shouldDirty: false })
            setValue('banner', null, { shouldDirty: false })

            if (logoInputRef.current) logoInputRef.current.value = ''
            if (bannerInputRef.current) bannerInputRef.current.value = ''

            setExtraInformationDraft({
                values: {
                    ...(values as any),
                    logo: null,
                    banner: null,
                },
                logoPreview: nextLogoPreview,
                bannerPreview: nextBannerPreview,
            })

            changeState(3)
        } catch (err: any) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(err) || err.message || 'ط®ط·ط§ ط¯ط± ط°ط®غŒط±ظ‡'}
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
            <Card
                header={{
                    content: 'ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¥ط¶ط§ظپظٹط©',
                    bordered: false,
                }}
            >
                <Form size="md" onSubmit={handleSubmit(onSubmit)}>
                    {/* Logo */}
                    <FormItem label="ط§ظ„ط´ط¹ط§ط± (Logo)" className="mb-6">
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
                                        <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-500">
                                            طھطµظˆغŒط± ظ„ظˆع¯ظˆ ط§ظ†طھط®ط§ط¨ ظ†ط´ط¯ظ‡
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
                                                prepareValidatedFile(inputFile, {
                                                    category: 'image',
                                                })
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
                                                ? 'طھط؛غŒغŒط± ط§ظ„ط´ط¹ط§ط±'
                                                : 'ط§ظ†طھط®ط§ط¨ ط§ظ„ط´ط¹ط§ط±'}
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
                                                ط­ط°ظپ
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </FormItem>

                    {/* Banner */}
                    <FormItem label="ط§ظ„ط¨ط§ظ†ط± (Banner)" className="mb-6">
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
                                            طھطµظˆغŒط± ط¨ظ†ط± ط§ظ†طھط®ط§ط¨ ظ†ط´ط¯ظ‡
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
                                                prepareValidatedFile(inputFile, {
                                                    category: 'image',
                                                })
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
                                                ? 'طھط؛غŒغŒط± ط§ظ„ط¨ط§ظ†ط±'
                                                : 'ط§ظ†طھط®ط§ط¨ ط§ظ„ط¨ط§ظ†ط±'}
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
                                                ط­ط°ظپ
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </FormItem>

                    {/* Map */}
                    <div className="mb-8">
                        <FormItem label="ط§ظ„ظ…ظˆظ‚ط¹ ط¹ظ„ظ‰ ط§ظ„ط®ط±ظٹط·ط©">
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
                                label="ط®ط· ط§ظ„ط¹ط±ط¶ (Latitude)"
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
                                label="ط®ط· ط§ظ„ط·ظˆظ„ (Longitude)"
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

                    <FormItem label="ط§ظ„ظ…ط¯ظٹظ†ط©" className="mb-6">
                        <Controller
                            name="city_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    size="sm"
                                    placeholder="ط§ط®طھط± ط§ظ„ظ…ط¯ظٹظ†ط©"
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

                    <FormItem label="ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ" className="mb-6">
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                                <PhoneNumberInput
                                    value={phoneValue}
                                    onChange={(nextValue) => {
                                        setPhoneValue(nextValue)
                                        field.onChange(
                                            stringifyPhoneValue(nextValue),
                                        )
                                    }}
                                    invalid={Boolean(errors.phone)}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="ط§ظ„ظ…ظˆظ‚ط¹ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" className="mb-6">
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

                    <FormItem label="ط§ظ„ط¹ظ†ظˆط§ظ†" className="mb-6">
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    placeholder="ط§ظ„ط¹ظ†ظˆط§ظ†"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <FormItem
                        label="ط§ظ„ط¹ظ†ظˆط§ظ† ط§ظ„ط±ط¦ظٹط³ظٹ (H1)"
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
                        label="ط§ظ„ظˆطµظپ ط§ظ„ط±ط¦ظٹط³ظٹ (Meta Description)"
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
                        <div className="flex justify-between">
                            <Button
                                type="button"
                                size="sm"
                                variant="plain"
                                onClick={() => changeState(1)}
                            >
                                ط§ظ„ط³ط§ط¨ظ‚
                            </Button>

                            <Button
                                loading={isSubmitting}
                                type="submit"
                                size="sm"
                                variant="solid"
                            >
                                ط§ظ„طھط§ظ„ظٹ
                            </Button>
                        </div>
                    </FormItem>
                </Form>
            </Card>
        </div>
    )
}



