import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'

interface SignUpFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
}

type SignUpFormSchema = {
    name: string
    mobile: string
    password: string
    email: string
    password_confirmation: string
}

const validationSchema = z
    .object({
        name: z.string().min(1, { message: 'الرجاء إدخال اسم الخاص بك' }),
        email: z.email({ message: 'الرجاء إدخال موبایل صحيح' }),
        mobile: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
        password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
        password_confirmation: z.string().min(1, { message: 'يلزم تأكيد كلمة المرور' }),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "كلمات المرور غير متطابقة",
        path: ['password_confirmation'],
    })

const SignUpForm = (props: SignUpFormProps) => {
    const { disableSubmit = false, className, setMessage } = props

    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const { signUp } = useAuth()

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<SignUpFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const onSignUp = async (values: SignUpFormSchema) => {
        const { password, email, name, mobile, password_confirmation } = values

        if (!disableSubmit) {
            setSubmitting(true)
            const result = await signUp({ name, mobile, email, password, password_confirmation })

            // if (result?.status === 'failed') {
            //     setMessage?.(result.message)
            // }

            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onSignUp)}>
                <FormItem
                    label="اسم"
                    invalid={Boolean(errors.name)}
                    errorMessage={errors.name?.message}
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder="اسم"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="موبایل"
                    invalid={Boolean(errors.mobile)}
                    errorMessage={errors.mobile?.message}
                >
                    <Controller
                        name="mobile"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder="موبایل"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="ایمیل"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder="ایمیل"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="كلمة المرور"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="كلمة المرور"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="تأكيد كلمة المرور"
                    invalid={Boolean(errors.password_confirmation)}
                    errorMessage={errors.password_confirmation?.message}
                >
                    <Controller
                        name="password_confirmation"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="تأكيد كلمة المرور"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                >
                    {isSubmitting ? 'جارٍ إنشاء حساب...' : 'يسجل'}
                </Button>
            </Form>
        </div>
    )
}

export default SignUpForm
