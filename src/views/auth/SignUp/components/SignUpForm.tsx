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
import PasswordInput from '@/components/shared/PasswordInput'
import PhoneNumberInput from '@/components/shared/PhoneNumberInput'

interface SignUpFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
}

type SignUpFormValues = {
    name?: string
    email?: string
    password?: string
    password_confirmation?: string
    mobile_country_code: string
    mobile_local_number: string
}

const normalValidationSchema = z
    .object({
        name: z.string().min(1, { message: 'الاسم مطلوب.' }),
        email: z.string().email({ message: 'يرجى إدخال بريد إلكتروني صحيح.' }),
        mobile_country_code: z.string().min(1, { message: 'مقدمة الدولة مطلوبة.' }),
        mobile_local_number: z.string().min(4, { message: 'رقم الهاتف مطلوب.' }),
        password: z.string().min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }),
        password_confirmation: z
            .string()
            .min(1, { message: 'تأكيد كلمة المرور مطلوب.' }),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'كلمتا المرور غير متطابقتين.',
        path: ['password_confirmation'],
    })

const googleValidationSchema = z.object({
    mobile_country_code: z.string().min(1, { message: 'مقدمة الدولة مطلوبة.' }),
    mobile_local_number: z.string().min(4, { message: 'رقم الهاتف مطلوب.' }),
})

const passwordChecks = (password: string) => {
    const value = password || ''
    return {
        minLength: value.length >= 8,
        hasLower: /[a-z]/.test(value),
        hasUpper: /[A-Z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSymbol: /[^A-Za-z0-9]/.test(value),
    }
}

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
        setError,
        watch,
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(schema),
        defaultValues: isGoogleSignup
            ? {
                  mobile_country_code: '+968',
                  mobile_local_number: '',
              }
            : {
                  name: '',
                  mobile_country_code: '+968',
                  mobile_local_number: '',
                  email: '',
                  password: '',
                  password_confirmation: '',
              },
    })

    const pw = watch('password') || ''
    const checks = passwordChecks(pw)
    const strengthScore =
        Number(checks.minLength) +
        Number(checks.hasLower) +
        Number(checks.hasUpper) +
        Number(checks.hasNumber) +
        Number(checks.hasSymbol)

    const onSubmit = async (values: SignUpFormValues) => {
        if (disableSubmit) return

        setSubmitting(true)
        try {
            if (isGoogleSignup && googleIdToken) {
                const cc = String(values.mobile_country_code || '').replace(/\D+/g, '')
                const local = String(values.mobile_local_number || '').replace(/\D+/g, '')
                const mobile = cc && local ? `+${cc}${local}` : String(values.mobile_local_number || '')

                try {
                    const resp = await apiGoogleOauthRegister({
                        id_token: googleIdToken,
                        mobile,
                        mobile_country_code: cc || undefined,
                        mobile_local_number: local || undefined,
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
                } catch (err: unknown) {
                    const data = (err as { response?: { data?: unknown } } | null)?.response?.data

                    if (!data || typeof data !== 'object') {
                        setMessage?.('Unable to complete Google sign up.')
                        return
                    }

                    const failure = data as Record<string, unknown>

                    if (failure.success === false && failure.next_step === 'login') {
                        clearGoogleSignup()
                        setMessage?.(
                            typeof failure.message === 'string'
                                ? failure.message
                                : 'This account already exists. Please sign in to continue.',
                        )
                        navigate('/sign-in')
                        return
                    }

                    const fieldErrors =
                        (failure.errors as Record<string, string[]> | undefined) ?? undefined
                    if (fieldErrors?.mobile?.[0]) {
                        setError('mobile_local_number', {
                            type: 'server',
                            message: fieldErrors.mobile[0],
                        })
                    }

                    setMessage?.(
                        typeof failure.message === 'string'
                            ? failure.message
                            : 'Unable to complete Google sign up.',
                    )
                    return
                }
            }

            const cc = String(values.mobile_country_code || '').replace(/\D+/g, '')
            const local = String(values.mobile_local_number || '').replace(/\D+/g, '')
            const mobile = cc && local ? `+${cc}${local}` : String(values.mobile_local_number || '')

            const result = await signUp({
                name: values.name ?? '',
                mobile,
                mobile_country_code: cc,
                mobile_local_number: local,
                email: values.email ?? '',
                password: values.password ?? '',
                password_confirmation: values.password_confirmation ?? '',
            })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
                if (result.fieldErrors) {
                    const fe = result.fieldErrors as Record<string, string[]>
                    if (fe.name?.[0]) setError('name', { type: 'server', message: fe.name[0] })
                    if (fe.email?.[0]) setError('email', { type: 'server', message: fe.email[0] })
                    if (fe.mobile?.[0]) setError('mobile_local_number', { type: 'server', message: fe.mobile[0] })
                    if (fe.password?.[0]) setError('password', { type: 'server', message: fe.password[0] })
                }
            }
        } catch (err: unknown) {
            const serverMessage = (err as { response?: { data?: { message?: unknown } } } | null)?.response
                ?.data?.message
            setMessage?.(typeof serverMessage === 'string' ? serverMessage : 'تعذر إتمام التسجيل.')
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
                    <FormItem label="الاسم">
                        <Input
                            type="text"
                            value={prefill?.name ?? ''}
                            disabled
                            autoComplete="off"
                        />
                    </FormItem>

                    <FormItem label="البريد الإلكتروني">
                        <Input
                            type="email"
                            value={prefill?.email ?? ''}
                            disabled
                            autoComplete="off"
                        />
                    </FormItem>

                    <FormItem
                        label="رقم الهاتف"
                        invalid={Boolean(errors.mobile_local_number)}
                        errorMessage={errors.mobile_local_number?.message}
                    >
                        <Controller
                            name="mobile_local_number"
                            control={control}
                            render={({ field: localField }) => (
                                <Controller
                                    name="mobile_country_code"
                                    control={control}
                                    render={({ field: ccField }) => (
                                        <PhoneNumberInput
                                            invalid={Boolean(errors.mobile_local_number)}
                                            value={{
                                                countryCode: String(ccField.value || '+968'),
                                                localNumber: String(localField.value || ''),
                                            }}
                                            onChange={(next) => {
                                                ccField.onChange(next.countryCode)
                                                localField.onChange(next.localNumber)
                                            }}
                                        />
                                    )}
                                />
                            )}
                        />
                    </FormItem>

                    <Button block loading={isSubmitting} variant="solid" type="submit">
                        {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                    </Button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            className="heading-text font-bold underline"
                            onClick={() => {
                                clearGoogleSignup()
                            }}
                        >
                            استخدام التسجيل العادي
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
                    label="الاسم"
                    invalid={Boolean(errors.name)}
                    errorMessage={errors.name?.message}
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                placeholder="الاسم"
                                autoComplete="off"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="رقم الهاتف"
                    invalid={Boolean(errors.mobile_local_number)}
                    errorMessage={errors.mobile_local_number?.message}
                >
                    <Controller
                        name="mobile_local_number"
                        control={control}
                        render={({ field: localField }) => (
                            <Controller
                                name="mobile_country_code"
                                control={control}
                                render={({ field: ccField }) => (
                                    <PhoneNumberInput
                                        invalid={Boolean(errors.mobile_local_number)}
                                        value={{
                                            countryCode: String(ccField.value || '+968'),
                                            localNumber: String(localField.value || ''),
                                        }}
                                        onChange={(next) => {
                                            ccField.onChange(next.countryCode)
                                            localField.onChange(next.localNumber)
                                        }}
                                    />
                                )}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="البريد الإلكتروني"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder="البريد الإلكتروني"
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
                            <PasswordInput
                                autoComplete="new-password"
                                placeholder="كلمة المرور"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800/40 p-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${(strengthScore / 5) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-14 text-right">
                            {strengthScore <= 2 ? 'ضعيفة' : strengthScore === 3 ? 'متوسطة' : 'قوية'}
                        </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700 dark:text-gray-300">
                        <div className={checks.minLength ? 'text-emerald-600' : ''}>
                            8 أحرف على الأقل
                        </div>
                        <div className={checks.hasNumber ? 'text-emerald-600' : ''}>
                            تحتوي رقمًا
                        </div>
                        <div className={checks.hasUpper ? 'text-emerald-600' : ''}>
                            تحتوي حرفًا كبيرًا
                        </div>
                        <div className={checks.hasSymbol ? 'text-emerald-600' : ''}>
                            تحتوي رمزًا خاصًا
                        </div>
                    </div>
                </div>

                <FormItem
                    label="تأكيد كلمة المرور"
                    invalid={Boolean(errors.password_confirmation)}
                    errorMessage={errors.password_confirmation?.message}
                >
                    <Controller
                        name="password_confirmation"
                        control={control}
                        render={({ field }) => (
                            <PasswordInput
                                autoComplete="new-password"
                                placeholder="تأكيد كلمة المرور"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <Button block loading={isSubmitting} variant="solid" type="submit">
                    {isSubmitting ? 'جاري إنشاء الحساب...' : 'تسجيل'}
                </Button>
            </Form>
        </div>
    )
}

export default SignUpForm
