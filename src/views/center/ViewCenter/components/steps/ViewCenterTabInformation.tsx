// steps/HojraInformations.tsx
import {
    Button,
    Card,
    Form,
    FormItem,
    Input,
    Select,
    Spinner,
    Switcher,
    toast,
} from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/store/useTranslation'
import {
    apiCreateNewAgency,
    apiUpdateMyAgency,
    getServices,
} from '@/services/CenterService'
import { Services } from '@/@types/center'
import { HojraInfo, useCreateStore } from '@/context/createStoreContext'
import { RichTextEditor } from '@/components/shared'

const stripHtml = (value: string): string =>
    value
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()

const validationSchema = z
    .object({
        title: z.string().min(1, { message: 'Center name is required' }),
        service_id: z.number().nullable().optional(),
        show_in_marketplace: z.boolean(),
        about_text: z
            .string()
            .refine((val) => stripHtml(val).length > 0, {
                message: 'Description is required',
            })
            .refine((val) => stripHtml(val).length >= 8, {
                message: 'Text is too short',
            }),
        about_us: z
            .string()
            .refine((val) => stripHtml(val).length > 0, {
                message: 'About us is required',
            })
            .refine((val) => stripHtml(val).length >= 8, {
                message: 'Text is too short',
            }),
    })
    .superRefine((values, ctx) => {
        if (values.show_in_marketplace && Number(values.service_id) <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['service_id'],
                message: 'Service type is required when shown in marketplace',
            })
        }
    })

export const ViewCenterTabInformation = () => {
    const { hojraInfo, setHojraInfo, setNewHojraData, newHojraData } =
        useCreateStore()
    const [servicesList, setServicesList] = useState<Services[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { t } = useTranslation()

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

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true)
            try {
                const resp = await getServices()
                setServicesList(resp.data)
            } catch (err: unknown) {
                setError(getApiErrorMessage(err) || 'خطا در دریافت اطلاعات')
            } finally {
                setLoading(false)
            }
        }
        fetchServices()
    }, [])

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<HojraInfo>({
        defaultValues: {
            title: hojraInfo.title || '',
            service_id: hojraInfo.service_id || null,
            about_text: hojraInfo.about_text || '',
            about_us: hojraInfo.about_us || '',
            show_in_marketplace: hojraInfo.show_in_marketplace ?? true,
        },
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = async (values: HojraInfo) => {
        try {
            const canUpdate = Boolean(newHojraData?.id && newHojraData?.slug)

            if (canUpdate) {
                const resp = await apiUpdateMyAgency(newHojraData.slug, values)
                if (!resp?.success) {
                    throw new Error(resp?.message || 'تعذر تحديث بيانات المركز')
                }

                setHojraInfo(values)
                toast.push(
                    <Notification type="success">
                        {'تم حفظ التغييرات'}
                    </Notification>,
                )
                return
            }
        } catch (err: unknown) {
            const apiMessage = getApiErrorMessage(err)
            const message = err instanceof Error ? err.message : undefined
            toast.push(
                <Notification type="danger">
                    {apiMessage || message || 'حدث خطأ أثناء حفظ البيانات'}
                </Notification>,
            )
        }
    }

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>{t('loading')}</div>
            </div>
        )

    if (error) return <div>{error}</div>

    return (
        <div>
            <Card>
                <div>
                    <Form size="md" onSubmit={handleSubmit(onSubmit)}>
                        <FormItem
                            label="اسم المركز"
                            invalid={Boolean(errors.title)}
                            errorMessage={errors.title?.message}
                            className="mb-8"
                        >
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="اسم المركز"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem className="mb-8">
                            <Controller
                                name="show_in_marketplace"
                                control={control}
                                render={({ field }) => (
                                    <div className="flex items-center justify-between gap-4 rounded border border-gray-200 px-4 py-3">
                                        <div>
                                            <div className="font-semibold text-gray-800">
                                                Show in marketplace
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Hide this center from marketplace listings and search.
                                            </div>
                                        </div>
                                        <Switcher
                                            checked={field.value !== false}
                                            onChange={(checked) =>
                                                field.onChange(checked)
                                            }
                                        />
                                    </div>
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label="نوع الخدمة"
                            invalid={Boolean(errors.service_id)}
                            errorMessage={errors.service_id?.message}
                            className="mb-8"
                        >
                            <Controller
                                name="service_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        size="sm"
                                        placeholder="اختر"
                                        options={servicesList.map(
                                            (service) => ({
                                                value: service.id,
                                                label: service.name,
                                            }),
                                        )}
                                        value={
                                            servicesList
                                                .map((service) => ({
                                                    value: service.id,
                                                    label: service.name,
                                                }))
                                                .find(
                                                    (opt) =>
                                                        opt.value ===
                                                        field.value,
                                                ) || null
                                        }
                                        onChange={(opt) =>
                                            field.onChange(opt?.value)
                                        }
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label="الوصف"
                            invalid={Boolean(errors.about_text)}
                            errorMessage={errors.about_text?.message}
                            className="mb-8"
                        >
                            <Controller
                                name="about_text"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        content={field.value || ''}
                                        invalid={Boolean(errors.about_text)}
                                        onChange={(content) =>
                                            field.onChange(content.html)
                                        }
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label="معلومات عنّا"
                            invalid={Boolean(errors.about_us)}
                            errorMessage={errors.about_us?.message}
                            className="mb-8"
                        >
                            <Controller
                                name="about_us"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        content={field.value || ''}
                                        invalid={Boolean(errors.about_us)}
                                        onChange={(content) =>
                                            field.onChange(content.html)
                                        }
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem>
                            <div className="flex items-center justify-end">
                                <Button
                                    loading={isSubmitting}
                                    variant="solid"
                                    type="submit"
                                >
                                    تعدیل
                                </Button>
                            </div>
                        </FormItem>
                    </Form>
                </div>
            </Card>
        </div>
    )
}
