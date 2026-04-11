import { useMemo, useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'
import { useGoogleSignupStore } from '@/store/googleSignupStore'
import { apiGoogleOauthRegister } from '@/services/OAuthServices'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import { useNavigate } from 'react-router'

interface SignUpFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
}

type NormalSignUpFormSchema = {
    name: string
    mobile: string
    password: string
    email: string
    password_confirmation: string
}

type GoogleSignUpFormSchema = {
    mobile: string
}

const normalValidationSchema = z
    .object({
        name: z.string().min(1, { message: 'Name is required.' }),
        email: z.string().email({ message: 'Please enter a valid email.' }),
        mobile: z.string().min(1, { message: 'Mobile is required.' }),
        password: z.string().min(1, { message: 'Password is required.' }),
        password_confirmation: z
            .string()
            .min(1, { message: 'Password confirmation is required.' }),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Passwords do not match.',
        path: ['password_confirmation'],
    })

const googleValidationSchema = z.object({
    mobile: z.string().min(1, { message: 'Mobile is required.' }),
})

const SignUpForm = (props: SignUpFormProps) => {
    const { disableSubmit = false, className, setMessage } = props
    const [isSubmitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    const { signUp, completeAuth } = useAuth()
    const googleIdToken = useGoogleSignupStore((s) => s.id_token)
    const prefill = useGoogleSignupStore((s) => s.prefill)
    const clearGoogleSignup = useGoogleSignupStore((s) => s.clear)
    const setPendingChallenge = useAuthChallengeStore((s) => s.setPending)

    const isGoogleSignup = Boolean(googleIdToken)

    const schema = useMemo(
        () => (isGoogleSignup ? googleValidationSchema : normalValidationSchema),
        [isGoogleSignup],
    )

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<NormalSignUpFormSchema & GoogleSignUpFormSchema>({
        resolver: zodResolver(schema),
        defaultValues: isGoogleSignup
            ? {
                  mobile: '',
              }
            : {
                  name: '',
                  mobile: '',
                  email: '',
                  password: '',
                  password_confirmation: '',
              },
    })

    const onSubmit = async (values: any) => {
        if (disableSubmit) return

        setSubmitting(true)
        try {
            if (isGoogleSignup && googleIdToken) {
                const resp = await apiGoogleOauthRegister({
                    id_token: googleIdToken,
                    mobile: String(values.mobile || ''),
                })

                if (resp?.success && resp.next_step === 'otp_verify' && resp.challenge_id) {
                    setPendingChallenge({
                        challenge_id: resp.challenge_id,
                        expires_at: resp.expires_at,
                        meta: resp.meta ?? {},
                        user: resp.user ?? null,
                    })
                    clearGoogleSignup()
                    navigate('/otp-verification')
                    return
                }

                if (resp?.success && resp.next_step === 'authenticated' && resp.token) {
                    clearGoogleSignup()
                    completeAuth(resp)
                    return
                }

                setMessage?.(resp?.message || 'Unable to complete Google sign up.')
                return
            }

            const result = await signUp({
                name: values.name,
                mobile: values.mobile,
                email: values.email,
                password: values.password,
                password_confirmation: values.password_confirmation,
            })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
            }
        } catch (err: any) {
            const serverMessage = err?.response?.data?.message
            setMessage?.(serverMessage || 'Unable to sign up.')
        } finally {
            setSubmitting(false)
        }
    }

    if (isGoogleSignup) {
        return (
            <div className={className}>
                {prefill?.avatar_url ? (
                    <div className="mb-6 flex justify-center">
                        <img
                            src={prefill.avatar_url}
                            alt="Google avatar"
                            className="h-16 w-16 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                ) : null}

                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Name">
                        <Input
                            type="text"
                            value={prefill?.name ?? ''}
                            disabled
                            autoComplete="off"
                        />
                    </FormItem>

                    <FormItem label="Email">
                        <Input
                            type="email"
                            value={prefill?.email ?? ''}
                            disabled
                            autoComplete="off"
                        />
                    </FormItem>

                    <FormItem
                        label="Mobile"
                        invalid={Boolean(errors.mobile)}
                        errorMessage={(errors as any).mobile?.message}
                    >
                        <Controller
                            name="mobile"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    placeholder="Mobile"
                                    autoComplete="off"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <Button block loading={isSubmitting} variant="solid" type="submit">
                        {isSubmitting ? 'Creating account...' : 'Create account'}
                    </Button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            className="heading-text font-bold underline"
                            onClick={() => {
                                clearGoogleSignup()
                            }}
                        >
                            Use normal sign up instead
                        </button>
                    </div>
                </Form>
            </div>
        )
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem
                    label="Name"
                    invalid={Boolean((errors as any).name)}
                    errorMessage={(errors as any).name?.message}
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder="Name"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Mobile"
                    invalid={Boolean((errors as any).mobile)}
                    errorMessage={(errors as any).mobile?.message}
                >
                    <Controller
                        name="mobile"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder="Mobile"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Email"
                    invalid={Boolean((errors as any).email)}
                    errorMessage={(errors as any).email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder="Email"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Password"
                    invalid={Boolean((errors as any).password)}
                    errorMessage={(errors as any).password?.message}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="Password"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Confirm Password"
                    invalid={Boolean((errors as any).password_confirmation)}
                    errorMessage={(errors as any).password_confirmation?.message}
                >
                    <Controller
                        name="password_confirmation"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="Confirm Password"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <Button block loading={isSubmitting} variant="solid" type="submit">
                    {isSubmitting ? 'Creating account...' : 'Sign up'}
                </Button>
            </Form>
        </div>
    )
}

export default SignUpForm

