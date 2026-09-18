import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import { apiResetPassword } from '@/services/AuthService'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'
import useTranslation from '@/utils/hooks/useTranslation'

interface ResetPasswordFormProps extends CommonProps {
    resetComplete: boolean
    setResetComplete?: (compplete: boolean) => void
    setMessage?: (message: string) => void
}

type ResetPasswordFormSchema = {
    newPassword: string
    confirmPassword: string
}

const ResetPasswordForm = (props: ResetPasswordFormProps) => {
    const { t } = useTranslation()
    const [isSubmitting, setSubmitting] = useState<boolean>(false)

    const validationSchema = useMemo(() => z.object({
        newPassword: z.string().min(1, t('auth.resetPassword.passwordRequired')),
        confirmPassword: z.string().min(1, t('auth.resetPassword.confirmRequired')),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: t('auth.resetPassword.mismatch'), path: ['confirmPassword'],
    }), [t])

    const { className, setMessage, setResetComplete, resetComplete, children } =
        props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ResetPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const onResetPassword = async (values: ResetPasswordFormSchema) => {
        const { newPassword } = values

        try {
            const resp = await apiResetPassword<boolean>({
                password: newPassword,
            })
            if (resp) {
                setSubmitting(false)
                setResetComplete?.(true)
            }
        } catch (errors) {
            setMessage?.(
                typeof errors === 'string'
                    ? errors
                    : t('auth.resetPassword.error'),
            )
            setSubmitting(false)
        }

        setSubmitting(false)
    }

    return (
        <div className={className}>
            {!resetComplete ? (
                <Form onSubmit={handleSubmit(onResetPassword)}>
                    <FormItem
                        label={t('auth.resetPassword.password')}
                        invalid={Boolean(errors.newPassword)}
                        errorMessage={errors.newPassword?.message}
                    >
                        <Controller
                            name="newPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="off"
                                    placeholder="••••••••••••"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label={t('auth.resetPassword.confirmPassword')}
                        invalid={Boolean(errors.confirmPassword)}
                        errorMessage={errors.confirmPassword?.message}
                    >
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="off"
                                    placeholder={t('auth.resetPassword.confirmPassword')}
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
                        {isSubmitting ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
                    </Button>
                </Form>
            ) : (
                <>{children}</>
            )}
        </div>
    )
}

export default ResetPasswordForm
