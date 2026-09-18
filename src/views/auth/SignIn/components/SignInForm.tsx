import { useMemo, useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'
import useTranslation from '@/utils/hooks/useTranslation'

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string) => void
}

type SignInFormSchema = {
    email: string
    password: string
}

const SignInForm = (props: SignInFormProps) => {
    const { t } = useTranslation()
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const validationSchema = useMemo(
        () =>
            z.object({
                email: z.string().min(1, { message: t('auth.signIn.emailRequired') }),
                password: z.string().min(1, { message: t('auth.signIn.passwordRequired') }),
            }),
        [t],
    )

    const { disableSubmit = false, className, setMessage, passwordHint } = props

    // admin-01@ecme.com
    // 123Qwe
    const {
        handleSubmit,
        formState: { errors },
        control,
        setError,
    } = useForm<SignInFormSchema>({
        defaultValues: {
            email: '',
            password: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const { signIn } = useAuth()

    const onSignIn = async (values: SignInFormSchema) => {
        const { email, password } = values

        if (!disableSubmit) {
            setSubmitting(true)

            const result = await signIn({ email, password })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
                if (result.fieldErrors) {
                    const fe = result.fieldErrors as Record<string, string[]>
                    if (fe.email?.[0])
                        setError('email', {
                            type: 'server',
                            message: fe.email[0],
                        })
                    if (fe.password?.[0])
                        setError('password', {
                            type: 'server',
                            message: fe.password[0],
                        })
                }
            }
        }

        setSubmitting(false)
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onSignIn)}>
                <FormItem
                    label={t('auth.signIn.email')}
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder={t('auth.signIn.email')}
                                autoComplete="off"
                                dir='ltr'
                                className="text-left"
                                style={{ fontFamily: 'sans-serif' }}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label={t('auth.signIn.password')}
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                    className={classNames(
                        passwordHint ? 'mb-0' : '',
                        errors.password?.message ? 'mb-8' : '',
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <PasswordInput
                                type="text"
                                placeholder={t('auth.signIn.password')}
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                {passwordHint}
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                >
                    {isSubmitting ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
                </Button>
            </Form>
        </div>
    )
}

export default SignInForm
