import { Button, Card, Form, FormItem, Input, Select, Spinner, toast } from "@/components/ui";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from "react";
import { useTranslation } from "@/store/useTranslation";
import { apiCreateNewAgency, getServices } from "@/services/CenterService";
import { CreateNewAgencyRequest, Services } from "@/@types/center";
import Notification from '@/components/ui/Notification'
import { useNavigate } from "react-router";

interface HojraInformationProps {
    changeState: (value: number) => void;
}

const validationSchema = z.object({
    title: z
        .string()
        .min(1, { message: 'اسم المركز إلزامي' }),

    service_id: z
        .any()
        .refine((val) => Number(val) > 0, {
            message: 'يجب اختيار نوع الخدمة',
        }),
    about_text: z
        .string()
        .min(1, { message: 'الوصف إلزامي' })
        .min(8, { message: 'النص قصير' })
})

export const HojraInformation = ({ changeState }: HojraInformationProps) => {


    const navigate = useNavigate()

    const [services, setServices] = useState<Services[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { t, setLang } = useTranslation()

    useEffect(() => {
        const fetchAgencies = async () => {
            setLoading(true)
            try {
                const resp = await getServices()
                setServices(resp.data)
            } catch (err: any) {
                setError(err?.response?.data?.message || 'خطا در دریافت اطلاعات')
            } finally {
                setLoading(false)
            }
        }

        fetchAgencies()
    }, [])


    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting }
    } = useForm<CreateNewAgencyRequest>({
        defaultValues: {
            title: '',
            service_id: null,
            about_text: ''
        },
        resolver: zodResolver(validationSchema)
    })

    const onSubmit = async (values: CreateNewAgencyRequest) => {
        console.log(values)
        const resp = await apiCreateNewAgency(values)
        console.log('RESP', resp)
        if (resp?.success) {
            toast.push(
                <Notification type="success" >
                    {resp.message}
                </Notification>
            )
        }
        await new Promise((r) => setTimeout(r, 200))
        navigate('/centers');
        //changeState(2)
    }


    if (loading) return <div className="w-full text-center flex items-center justify-center flex-col">
        <Spinner />
        <div>{t('loading')}</div>
    </div>
    if (error) return <div>{error}</div>

    return (
        <div>
            <Card
                header={{
                    content: 'معلومات الحجرة',
                    bordered: false,
                }}
            >
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

                                render={({ field }) =>
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="اسم المركز"
                                        {...field}
                                    />
                                }
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
                                render={({ field }) =>
                                    <Select
                                        size="sm"
                                        placeholder="اختر"
                                        options={services.map((service) => ({
                                            value: service.id,
                                            label: service.name,
                                        }))}
                                        value={
                                            services
                                                .map((service) => ({ value: service.id, label: service.name }))
                                                .find((opt) => opt.value === field.value) || null
                                        }
                                        onChange={(opt) => field.onChange(opt?.value)}
                                    />
                                }
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
                                render={({ field }) =>
                                    <Input
                                        placeholder="الوصف"
                                        textArea
                                        {...field}
                                    />
                                }
                            />
                        </FormItem>
                        <FormItem>
                            <div className="flex items-center justify-end">
                                <Button loading={isSubmitting} size="sm" variant="solid" type="submit">
                                    سجل حجرة جديدة
                                </Button>
                            </div>
                        </FormItem>
                    </Form>
                </div>
            </Card>
        </div>
    )
}