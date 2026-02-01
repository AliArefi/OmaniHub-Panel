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
    userName: string
    password: string
    email: string
    confirmPassword: string
}

const validationSchema = z
    .object({
        email: z.email({ message: 'الرجاء إدخال بريد إلكتروني صحيح' }),
        userName: z.string().min(1, { message: 'الرجاء إدخال اسم المستخدم الخاص بك' }),
        password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
        confirmPassword: z.string().min(1, { message: 'يلزم تأكيد كلمة المرور'}),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "كلمات المرور غير متطابقة",
        path: ['confirmPassword'],
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
        const { userName, password, email } = values

        if (!disableSubmit) {
            setSubmitting(true)
            // const result = await signUp({ userName, password, email })

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
                    label="اسم المستخدم"
                    invalid={Boolean(errors.userName)}
                    errorMessage={errors.userName?.message}
                >
                    <Controller
                        name="userName"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder="اسم المستخدم"
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
                    invalid={Boolean(errors.confirmPassword)}
                    errorMessage={errors.confirmPassword?.message}
                >
                    <Controller
                        name="confirmPassword"
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
