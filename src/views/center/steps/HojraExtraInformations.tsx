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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@/store/useTranslation'
import { useCreateStore } from '@/context/createStoreContext'
import { MapPicker } from './components/MapPicker'
import {
    apiGetCities,
    apiGetMyAgency,
    apiUpdateInfoMyAgency,
} from '@/services/CenterService'
import { Cities } from '@/@types/center'

interface HojraExtraInformationsProps {
    changeState: (value: number) => void
}

const validationSchema = z.object({
    logo: z.instanceof(File).optional(),
    banner: z.instanceof(File).optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    city_id: z.number().optional(),
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

export const HojraExtraInformations = ({
    changeState,
}: HojraExtraInformationsProps) => {
    const { t } = useTranslation()
    const { newHojraData } = useCreateStore()

    const [loadingCities, setLoadingCities] = useState(true)
    const [cities, setCities] = useState<Cities[]>([])

    const [error, setError] = useState<string | null>(null)

    const getApiErrorMessage = (err: unknown): string | undefined => {
        if (typeof err !== 'object' || err === null) return undefined
        const response = (err as { response?: unknown }).response
        if (typeof response !== 'object' || response === null) return undefined
        const data = (response as { data?: unknown }).data
        if (typeof data !== 'object' || data === null) return undefined

        const errors = (data as { errors?: unknown }).errors
        if (typeof errors === 'object' && errors !== null) {
            const first = Object.values(errors as Record<string, unknown>).find(
                (val) =>
                    Array.isArray(val) &&
                    typeof val[0] === 'string' &&
                    val[0].trim(),
            ) as string[] | undefined

            if (first?.[0]?.trim()) return first[0].trim()
        }

        const message = (data as { message?: unknown }).message
        if (typeof message === 'string' && message.trim()) return message.trim()

        return undefined
    }

    const form = useForm<FormValues>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            logo: undefined,
            banner: undefined,
            latitude: '',
            longitude: '',
            city_id: 0,
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
        formState: { errors, isSubmitting },
        watch,
    } = form

    useEffect(() => {
        const fetchServices = async () => {
            setLoadingCities(true)

            try {
                const agencyResponse = await apiGetMyAgency(
                    newHojraData.slug as string,
                )
                const agency = agencyResponse.data

                if (!agency || typeof agency !== 'object') {
                    throw new Error('Invalid center response.')
                }
                form.setValue('city_id', agency.city.id)
                form.setValue('latitude', agency.latitude)
                form.setValue('longitude', agency.latitude)
                form.setValue('address', agency.address)

                form.setValue('facebook', agency.facebook)
                form.setValue('instagram', agency.instagram)
                form.setValue('phone', agency.phone)
                form.setValue('website', agency.website)
                form.setValue('youtube', agency.youtube)
                form.setValue('h1', agency.h1)
                form.setValue('meta_description', agency.meta_description)
            } catch (err: unknown) {
                setError(getApiErrorMessage(err) || 'خطا در دریافت اطلاعات')
            }

            try {
                const resp = await apiGetCities()
                setCities(resp.data)
            } catch (err: unknown) {
                setError(getApiErrorMessage(err) || 'خطا در دریافت اطلاعات')
            } finally {
                setLoadingCities(false)
            }
        }
        fetchServices()
    }, [])

    const lat = watch('latitude')
    const lng = watch('longitude')

    const onSubmit = async (values: FormValues) => {
        try {
            if (!newHojraData?.slug) {
                throw new Error('شناسه حجره  نیست')
            }
            const formData = new FormData()

            Object.entries(values).forEach(([key, value]) => {
                if (value instanceof File) {
                    formData.append(key, value)
                } else if (value !== undefined && value !== null) {
                    formData.append(key, String(value))
                }
            })

            const resp = await apiUpdateInfoMyAgency(
                newHojraData.slug,
                formData as any,
            )

            if (!resp?.success) {
                throw new Error(resp?.message || 'تعذر تحديث بيانات المركز')
            }
            changeState(3)
            return
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'خطا در ذخیره'
            toast.push(<Notification type="danger">{message}</Notification>)
        }
    }

    const cityOptions = useMemo(
        () => cities.map((city) => ({ value: city.id, label: city.name })),
        [cities],
    )

    if (loadingCities)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>{t('loading')}</div>
            </div>
        )

    if (error) return <div>{error}</div>

    return (
        <div>
            <Card
                header={{
                    content: 'المعلومات الإضافية',
                    bordered: false,
                }}
            >
                <Form size="md" onSubmit={handleSubmit(onSubmit)}>
                    {/* Logo */}
                    <FormItem label="الشعار (Logo)" className="mb-6">
                        <Controller
                            name="logo"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const target =
                                            e.target as HTMLInputElement
                                        field.onChange(
                                            target.files?.[0] || undefined,
                                        )
                                    }}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="البانر (Banner)" className="mb-6">
                        <Controller
                            name="banner"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const target =
                                            e.target as HTMLInputElement
                                        field.onChange(
                                            target.files?.[0] || undefined,
                                        )
                                    }}
                                />
                            )}
                        />
                    </FormItem>

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
                                        <Input
                                            type="text"
                                            placeholder="مثال: 23.5880"
                                            {...field}
                                        />
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
                                        <Input
                                            type="text"
                                            placeholder="مثال: 58.3829"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        </div>
                    </div>

                    <FormItem label="المدينة" className="mb-6">
                        {loadingCities ? (
                            <div className="h-10 w-full rounded bg-gray-100 animate-pulse" />
                        ) : (
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
                        )}
                    </FormItem>

                    <FormItem label="رقم الهاتف" className="mb-6">
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    placeholder="مثال: 96890000000"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="الموقع الإلكتروني" className="mb-6">
                        <Controller
                            name="website"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    placeholder="https://example.com"
                                    {...field}
                                />
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
                                    <Input
                                        placeholder="https://instagram.com/..."
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="YouTube">
                            <Controller
                                name="youtube"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="https://youtube.com/..."
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="LinkedIn">
                            <Controller
                                name="linkedin"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="https://linkedin.com/..."
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Facebook">
                            <Controller
                                name="facebook"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="https://facebook.com/..."
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>

                    <FormItem
                        label="H1"
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
                        label="Meta Description"
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
                        <div className="flex items-center justify-between">
                            <Button
                                size="sm"
                                variant="plain"
                                onClick={() => changeState(1)}
                                type="button"
                            >
                                السابق
                            </Button>
                            <Button
                                loading={isSubmitting}
                                size="sm"
                                variant="solid"
                                type="submit"
                            >
                                التالي
                            </Button>
                        </div>
                    </FormItem>
                </Form>
            </Card>
        </div>
    )
}
