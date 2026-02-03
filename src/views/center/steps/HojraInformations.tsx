import { Button, Card, Form, FormItem, Input, Select } from "@/components/ui";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface HojraInformationProps {
    changeState: (value: number) => void;
}

type FormSchema = {
    title: string,
    service_id: number | null,
    about_text: string
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

const Options = [
    { value: 1, label: 'مركز التجميل' },
    { value: 2, label: 'مركز الليزر والعناية بالبشرة' },
    { value: 3, label: 'صالون الجمال المتكامل' },
    { value: 4, label: 'مركز العناية النسائية' },
]

export const HojraInformation = ({ changeState }: HojraInformationProps) => {

    const {
        handleSubmit,
        control,
        formState: { errors }
    } = useForm<FormSchema>({
        defaultValues: {
            title: '',
            service_id: null,
            about_text: ''
        },
        resolver: zodResolver(validationSchema)
    })

    const onSubmit = async (values: FormSchema) => {

        await new Promise((r) => setTimeout(r, 500))
        changeState(2)

        //alert(JSON.stringify(values, null, 2))
    }

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
                                        options={Options}
                                        value={Options.find(opt => opt.value === field.value) || null}
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
                                <Button size="sm" variant="solid" type="submit">
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