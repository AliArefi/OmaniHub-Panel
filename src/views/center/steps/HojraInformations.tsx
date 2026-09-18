// steps/HojraInformations.tsx
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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import useTranslation from '@/utils/hooks/useTranslation'
import { apiCreateNewAgency, apiUpdateMyAgency, getServices } from '@/services/CenterService'
import { Services } from '@/@types/center'
import { HojraInfo, useCreateStore } from '@/context/createStoreContext'
import { RichTextEditor } from '@/components/shared'

interface HojraInformationProps {
    changeState: (value: number) => void
}

const stripHtml = (value: string): string =>
    value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const buildValidationSchema = (
    t: (key: string) => string,
    requireService: boolean,
) =>
    z
        .object({
            title: z
                .string()
                .min(1, { message: t('centerCreation.form.nameRequired') }),
            service_id: z.any().nullable().optional(),
            about_text: z
                .string()
                .refine((val) => stripHtml(val).length > 0, {
                    message: t('centerCreation.form.descriptionRequired'),
                })
                .refine((val) => stripHtml(val).length >= 8, {
                    message: t('centerCreation.form.textTooShort'),
                }),
            about_us: z
                .string()
                .refine((val) => stripHtml(val).length > 0, {
                    message: t('centerCreation.form.aboutUsRequired'),
                })
                .refine((val) => stripHtml(val).length >= 8, {
                    message: t('centerCreation.form.textTooShort'),
                }),
        })
        .superRefine((values, ctx) => {
            if (requireService && Number(values.service_id) <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['service_id'],
                    message: t('centerCreation.form.serviceRequired'),
                })
            }
        })

export const HojraInformation = ({ changeState }: HojraInformationProps) => {
    const { hojraInfo, setHojraInfo, setNewHojraData, newHojraData } =
        useCreateStore()
    const [servicesList, setServicesList] = useState<Services[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const canUpdate = Boolean(newHojraData?.id && newHojraData?.slug)
    const validationSchema = buildValidationSchema(t, !canUpdate)

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
                const resp = await getServices();
                setServicesList(resp.data)
            } catch (err: unknown) {
                setError(getApiErrorMessage(err) || t('centerCreation.form.loadServicesError'))
            } finally {
                setLoading(false)
            }
        }
        fetchServices()
    }, [t])

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
        },
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = async (values: HojraInfo) => {
        try {
            if (canUpdate) {
                const resp = await apiUpdateMyAgency(newHojraData.slug, values)
                if (!resp?.success) {
                    throw new Error(resp?.message || t('centerCreation.form.createError'))
                }

                setHojraInfo(values)
                changeState(2)
                return
            }

            const resp = await apiCreateNewAgency(values)
            if (!resp?.success) {
                throw new Error(resp?.message || t('centerCreation.form.createError'))
            }

            setNewHojraData(resp.data)
            setHojraInfo(values)
            changeState(2)
        } catch (err: unknown) {
            const apiMessage = getApiErrorMessage(err)
            const message = err instanceof Error ? err.message : undefined
            toast.push(
                <Notification type="danger">
                    {apiMessage || message || t('centerCreation.form.saveError')}
                </Notification>,
            )
        }
    }

    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
                <div>{t('centerCreation.form.loading')}</div>
            </div>
        )

    if (error) return <div>{error}</div>

    return (
        <div>
            <Card
                header={{
                    content: t('centerCreation.stepInformation'),
                    bordered: false,
                }}
            >
                <div>
                    <Form size="md" onSubmit={handleSubmit(onSubmit)}>
                        <FormItem
                            label={t('centerCreation.form.title')}
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
                                        placeholder={t('centerCreation.form.title')}
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label={t('centerCreation.form.serviceType')}
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
                                        placeholder={t('centerCreation.form.select')}
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
                            label={t('centerCreation.form.description')}
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
                            label={t('centerCreation.form.aboutUs')}
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
                                    size="sm"
                                    variant="solid"
                                    type="submit"
                                >
                                    {t('centerCreation.form.next')}
                                </Button>
                            </div>
                        </FormItem>
                    </Form>
                </div>
            </Card>
        </div>
    )
}


