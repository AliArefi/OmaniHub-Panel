import { useState, useRef } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import classNames from '@/utils/classNames'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiUpdateProfile, toUpdateProfileFormData } from '@/services/ProfileService'
import isLastChild from '@/utils/isLastChild'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import useTranslation from '@/utils/hooks/useTranslation'

type PasswordSchema = {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
}
const SettingsSecurity = () => {
    const { i18n } = useTranslation()
    const isArabic = i18n.language.toLowerCase().startsWith('ar')
    const labels = isArabic
        ? { password: 'كلمة المرور', passwordDesc: 'كلمة المرور هي المفتاح الرقمي لحسابك. حافظ عليها آمنة ومحمية.', current: 'كلمة المرور الحالية', next: 'كلمة المرور الجديدة', confirm: 'تأكيد كلمة المرور الجديدة', update: 'تحديث', updateTitle: 'تحديث كلمة المرور', updateConfirm: 'هل أنت متأكد أنك تريد تغيير كلمة المرور الخاصة بك؟', twoFactor: 'التحقق بخطوتين', twoFactorDesc: 'فعّل التحقق بخطوتين لتأمين حسابك.', enabled: 'مُفعّل', enable: 'تفعيل', error: 'تعذر تغيير كلمة المرور', changed: 'تم تغيير كلمة المرور. سجّل الدخول مجدداً.' }
        : { password: 'Password', passwordDesc: 'Your password is the digital key to your account. Keep it safe and protected.', current: 'Current password', next: 'New password', confirm: 'Confirm new password', update: 'Update', updateTitle: 'Update password', updateConfirm: 'Are you sure you want to change your password?', twoFactor: 'Two-factor authentication', twoFactorDesc: 'Enable two-factor authentication to secure your account.', enabled: 'Enabled', enable: 'Enable', error: 'Unable to change password', changed: 'Password changed. Please sign in again.' }
    const authenticatorList = [
        { label: 'Google Authenticator', value: 'googleAuthenticator', img: '/img/others/google.png', desc: isArabic ? 'يتم إنشاء رموز حساسة للوقت لتسجيل دخول آمن.' : 'Time-based codes for secure sign-in.' },
        { label: 'Okta Verify', value: 'oktaVerify', img: '/img/others/okta.png', desc: isArabic ? 'إشعارات فورية للتحقق السريع من تسجيل الدخول.' : 'Push notifications for quick sign-in verification.' },
        { label: isArabic ? 'التحقق عبر البريد الإلكتروني' : 'Email verification', value: 'emailVerification', img: '/img/others/email.png', desc: isArabic ? 'رموز فريدة تُرسل إلى بريدك الإلكتروني للتحقق.' : 'Unique codes sent to your email for verification.' },
    ]
    const validationSchema = z.object({
        currentPassword: z.string().min(1, { message: isArabic ? 'يرجى إدخال كلمة المرور الحالية.' : 'Enter your current password.' }),
        newPassword: z.string().min(1, { message: isArabic ? 'يرجى إدخال كلمة المرور الجديدة.' : 'Enter a new password.' }),
        confirmNewPassword: z.string().min(1, { message: isArabic ? 'يرجى تأكيد كلمة المرور الجديدة.' : 'Confirm your new password.' }),
    }).refine((data) => data.confirmNewPassword === data.newPassword, { message: isArabic ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.', path: ['confirmNewPassword'] })
    const [selected2FaType, setSelected2FaType] = useState(
        'googleAuthenticator',
    )
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)

    const {
        getValues,
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<PasswordSchema>({
        resolver: zodResolver(validationSchema),
    })

    const handlePostSubmit = async () => {
        setIsSubmitting(true)
        try {
            const values = getValues()
            const response = await apiUpdateProfile(
                toUpdateProfileFormData({
                    name: '',
                    current_password: values.currentPassword,
                    new_password: values.newPassword,
                }),
            )

            if (!response.success) {
                throw new Error(response.message || labels.error)
            }

            reset()
            setConfirmationOpen(false)
            toast.push(<Notification type="success">{labels.changed}</Notification>)
            window.setTimeout(() => window.location.assign('/sign-in'), 600)
        } catch (error) {
            toast.push(<Notification type="danger">{error instanceof Error ? error.message : labels.error}</Notification>)
        } finally {
            setIsSubmitting(false)
        }
    }

    const onSubmit = async () => {
        setConfirmationOpen(true)
    }

    return (
        <div>
            <div className="mb-8">
                <h4>{labels.password}</h4>
                <p>{labels.passwordDesc}</p>
            </div>
            <Form
                ref={formRef}
                className="mb-8"
                onSubmit={handleSubmit(onSubmit)}
            >
                <FormItem
                    label={labels.current}
                    invalid={Boolean(errors.currentPassword)}
                    errorMessage={errors.currentPassword?.message}
                >
                    <Controller
                        name="currentPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label={labels.next}
                    invalid={Boolean(errors.newPassword)}
                    errorMessage={errors.newPassword?.message}
                >
                    <Controller
                        name="newPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label={labels.confirm}
                    invalid={Boolean(errors.confirmNewPassword)}
                    errorMessage={errors.confirmNewPassword?.message}
                >
                    <Controller
                        name="confirmNewPassword"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="off"
                                placeholder="•••••••••"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <div className="flex justify-end">
                    <Button variant="solid" type="submit">
                        {labels.update}
                    </Button>
                </div>
            </Form>
            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title={labels.updateTitle}
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>{labels.updateConfirm}</p>
            </ConfirmDialog>
            <div className="mb-8">
                <h4>{labels.twoFactor}</h4>
                <p>{labels.twoFactorDesc}</p>
                <div className="mt-8">
                    {authenticatorList.map((authOption, index) => (
                        <div
                            key={authOption.value}
                            className={classNames(
                                'py-6 border-gray-200 dark:border-gray-600',
                                !isLastChild(authenticatorList, index) &&
                                'border-b',
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        size={35}
                                        className="bg-transparent"
                                        src={authOption.img}
                                    />
                                    <div>
                                        <h6>{authOption.label}</h6>
                                        <span>{authOption.desc}</span>
                                    </div>
                                </div>
                                <div>
                                    {selected2FaType === authOption.value ? (
                                        <Button
                                            size="sm"
                                            customColorClass={() =>
                                                'border-success ring-1 ring-success text-success hover:border-success hover:ring-success hover:text-success bg-transparent'
                                            }
                                            onClick={() =>
                                                setSelected2FaType('')
                                            }
                                        >
                                            {labels.enabled}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setSelected2FaType(
                                                    authOption.value,
                                                )
                                            }
                                        >
                                            {labels.enable}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SettingsSecurity
