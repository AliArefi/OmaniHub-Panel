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
    apiUploadMyAgencyMedia,
} from '@/services/CenterService'
import { Cities } from '@/@types/center'
import { htmlToPlainText } from '@/utils/text/htmlToPlainText'
import { prepareValidatedFile } from '../utils/fileUpload'

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

export const ViewCenterTabExtraInformations = () => {
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
    const [publicImagePreview, setPublicImagePreview] = useState<string | null>(null)
    const [publicImageFile, setPublicImageFile] = useState<File | null>(null)
    const [phoneValue, setPhoneValue] = useState<PhoneNumberValue>({
        countryCode: DEFAULT_COUNTRY_CODE,
        localNumber: '',
    })

    const logoInputRef = useRef<HTMLInputElement | null>(null)
    const bannerInputRef = useRef<HTMLInputElement | null>(null)
    const publicImageInputRef = useRef<HTMLInputElement | null>(null)

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
                setError('المركز غير متاح حالياً.')
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
                setError(getApiErrorMessage(err) || 'خطأ في استلام المعلومات')
            }

            try {
                const citiesResp = await apiGetCities()
                setCities(citiesResp.data)
            } catch (err) {
                setError(getApiErrorMessage(err) || 'خطأ في استلام المدن')
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
                throw new Error('المركز غير متاح حالياً.')
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
                throw new Error(resp?.message || 'خطأ في حفظ المعلومات')
            }

            if (publicImageFile) {
                const media = new FormData()
                media.append('collection', 'agency_public_images')
                media.append('file', publicImageFile)

                const upload = await apiUploadMyAgencyMedia(slug, media)
                if (!upload?.success) {
                    throw new Error(upload?.message || 'خطأ في رفع صورة الصفحة العامة')
                }
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
                    ...(values as any),
                    logo: null,
                    banner: null,
                },
                logoPreview: nextLogoPreview,
                bannerPreview: nextBannerPreview,
            })

            toast.push(
                <Notification type="success">
                    {'تم حفظ التغييرات'}
                </Notification>,
            )
        } catch (err: any) {
            toast.push(
                <Notification type="danger">
                    {getApiErrorMessage(err) || err.message || 'خطأ في الحفظ'}
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
                    {/* Logo */}
                    <FormItem label="الشعار (Logo)" className="mb-6">
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
                                            لم يتم اختيار صورة الشعار
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
                                                ? 'تغيير الشعار'
                                                : 'انتخاب الشعار'}
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
                                                حذف
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </FormItem>

                    {/* Banner */}
                    <FormItem label="البانر (Banner)" className="mb-6">
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
                                            لم يتم اختيار صورة البانر
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
                                                ? 'تغيير البانر'
                                                : 'اختيار البانر'}
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
                                                حذف
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </FormItem>

                    <FormItem label="صورة الصفحة العامة" className="mb-6">
                        <div className="space-y-3">
                            {publicImagePreview ? (
                                <img
                                    src={publicImagePreview}
                                    alt="Public page image"
                                    className="w-full max-w-2xl h-48 object-cover rounded-lg border-2 border-gray-200"
                                />
                            ) : (
                                <div className="w-full max-w-2xl h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
                                    لم يتم اختيار صورة الصفحة العامة
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
                                    setPublicImagePreview(URL.createObjectURL(file))
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
                                    ? 'تغيير صورة الصفحة العامة'
                                    : 'اختيار صورة الصفحة العامة'}
                            </Button>
                        </div>
                    </FormItem>

                    {/* Map */}
                    <div className="mb-8">
                        <FormItem label="الموقع على الخريطة">
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
                                label="خط العرض (Latitude)"
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
                                label="خط الطول (Longitude)"
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

                    <FormItem label="المدينة" className="mb-6">
                        <Controller
                            name="city_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    size="sm"
                                    placeholder="اختر المدينة"
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

                    <FormItem label="رقم الهاتف" className="mb-6">
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

                    <FormItem label="الموقع الإلكتروني" className="mb-6">
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

                    <FormItem label="العنوان" className="mb-6">
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    placeholder="العنوان"
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
                        label="العنوان الرئيسي (H1)"
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
                        label="الوصف الرئيسي (Meta Description)"
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
                                تعدیل
                            </Button>
                        </div>
                    </FormItem>
                </Form>
            </Card>
        </div>
    )
}
