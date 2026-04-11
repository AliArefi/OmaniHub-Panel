import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import OTPInput from '@/components/shared/OtpInput'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import { apiAuthConfig, apiVerifyOtp } from '@/services/AuthService'
import { useAuth } from '@/auth'

interface OtpVerificationFormProps {
    setOtpVerified?: (message: string) => void
    setMessage?: (message: string) => void
}

type OtpFormSchema = {
    otp: string
}

const OtpVerificationForm = (props: OtpVerificationFormProps) => {
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
    } = useForm<OtpFormSchema>({
        defaultValues: { otp: '' },
    })

    const onSubmit = async (values: OtpFormSchema) => {
        if (!pending?.challenge_id) {
            setMessage?.('No active challenge found. Please sign in again.')
            return
        }

        const otp = String(values.otp || '').trim()
        if (otp.length !== otpLength) {
            setMessage?.('Please enter a valid OTP.')
            return
        }

        setSubmitting(true)
        try {
            const resp = await apiVerifyOtp({
                challenge_id: pending.challenge_id,
                otp,
            })

            if (resp?.success && resp.next_step === 'authenticated' && resp.token) {
                clearPending()
                reset()
                setOtpVerified?.(resp.message || 'OTP verified successfully.')
                completeAuth(resp)
                return
            }

            setMessage?.(resp?.message || 'Unable to verify OTP.')
        } catch (err: any) {
            const status = err?.response?.status
            const serverMessage = err?.response?.data?.message

            if (status === 410) {
                clearPending()
                setMessage?.(serverMessage || 'This OTP challenge has expired. Please sign in again.')
                return
            }

            if (status === 429) {
                setMessage?.(serverMessage || 'Too many attempts. Please wait and try again.')
                return
            }

            if (status === 409) {
                clearPending()
                setMessage?.(serverMessage || 'This challenge is already completed. Please sign in again.')
                return
            }

            setMessage?.(serverMessage || 'An error occurred while verifying OTP.')
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
                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </Button>
            </Form>
        </div>
    )
}

export default OtpVerificationForm
