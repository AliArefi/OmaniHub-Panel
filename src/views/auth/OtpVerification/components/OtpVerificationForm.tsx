import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import OTPInput from '@/components/shared/OtpInput'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import { apiAuthConfig, apiVerifyOtp } from '@/services/AuthService'
import { useAuth } from '@/auth'
import { extractDigits } from '@/utils/normalizeDigits'
import useTranslation from '@/utils/hooks/useTranslation'

interface OtpVerificationFormProps {
    setOtpVerified?: (message: string) => void
    setMessage?: (message: string) => void
}

type OtpFormSchema = {
    otp: string
}

const OtpVerificationForm = (props: OtpVerificationFormProps) => {
    const { t } = useTranslation()
    const { setMessage, setOtpVerified } = props
    const [isSubmitting, setSubmitting] = useState(false)
    const [otpLength, setOtpLength] = useState(6)

    const pending = useAuthChallengeStore((s) => s.pending)
    const clearPending = useAuthChallengeStore((s) => s.clear)
    const { completeAuth } = useAuth()

    useEffect(() => {
        let mounted = true
        apiAuthConfig()
            .then((resp) => {
                if (!mounted) return
                const len = resp?.otp?.code_length
                if (typeof len === 'number' && len >= 4 && len <= 10) {
                    setOtpLength(len)
                }
            })
            .catch(() => {})

        return () => {
            mounted = false
        }
    }, [])

    const {
        handleSubmit,
        formState: { errors },
        control,
        reset,
        setError,
        clearErrors,
    } = useForm<OtpFormSchema>({
        defaultValues: { otp: '' },
    })

    const onSubmit = async (values: OtpFormSchema) => {
        if (!pending?.challenge_id) {
            setMessage?.(t('auth.otp.noChallenge'))
            return
        }

        const otp = extractDigits(String(values.otp || '').trim())
        if (otp.length !== otpLength) {
            setError('otp', { type: 'manual', message: t('auth.otp.validCode') })
            return
        }
        clearErrors('otp')

        setSubmitting(true)
        try {
            const resp = await apiVerifyOtp({
                challenge_id: pending.challenge_id,
                otp,
            })

            if (resp?.success && resp.next_step === 'authenticated' && resp.token) {
                clearPending()
                reset()
                setOtpVerified?.(resp.message || t('auth.otp.verified'))
                completeAuth(resp)
                return
            }

            setMessage?.(resp?.message || t('auth.otp.verifyError'))
        } catch (err: unknown) {
            const response = (err as {
                response?: {
                    status?: number
                    data?: { message?: string }
                }
            } | null)?.response
            const status = response?.status
            const serverMessage = response?.data?.message

            if (status === 410) {
                clearPending()
                setMessage?.(serverMessage || t('auth.otp.expired'))
                return
            }

            if (status === 429) {
                setMessage?.(serverMessage || t('auth.otp.tooManyAttempts'))
                return
            }

            if (status === 409) {
                clearPending()
                setMessage?.(serverMessage || t('auth.otp.alreadyCompleted'))
                return
            }

            setMessage?.(serverMessage || t('auth.otp.verifyError'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div dir="ltr">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem invalid={Boolean(errors.otp)} errorMessage={errors.otp?.message}>
                    <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                            <OTPInput
                                placeholder=""
                                inputClass="h-[58px]"
                                length={otpLength}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <Button block loading={isSubmitting} variant="solid" type="submit">
                    {isSubmitting ? t('auth.otp.verifying') : t('auth.otp.verify')}
                </Button>
            </Form>
        </div>
    )
}

export default OtpVerificationForm
