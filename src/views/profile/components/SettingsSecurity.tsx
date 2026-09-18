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
    const { t } = useTranslation()
    const authenticatorList = [
        { label: t('profile.security.googleAuthenticator'), value: 'googleAuthenticator', img: '/img/others/google.png', desc: t('profile.security.googleAuthenticatorDesc') },
        { label: t('profile.security.oktaVerify'), value: 'oktaVerify', img: '/img/others/okta.png', desc: t('profile.security.oktaVerifyDesc') },
        { label: t('profile.security.emailVerification'), value: 'emailVerification', img: '/img/others/email.png', desc: t('profile.security.emailVerificationDesc') },
    ]
    const validationSchema = z.object({
        currentPassword: z.string().min(1, { message: t('profile.security.currentPasswordRequired') }),
        newPassword: z.string().min(1, { message: t('profile.security.newPasswordRequired') }),
        confirmNewPassword: z.string().min(1, { message: t('profile.security.confirmPasswordRequired') }),
    }).refine((data) => data.confirmNewPassword === data.newPassword, { message: t('profile.security.passwordMismatch'), path: ['confirmNewPassword'] })
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
                throw new Error(response.message || t('profile.security.updateError'))
            }

            reset()
            setConfirmationOpen(false)
            toast.push(<Notification type="success">{t('profile.security.changed')}</Notification>)
            window.setTimeout(() => window.location.assign('/sign-in'), 600)
        } catch (error) {
            toast.push(<Notification type="danger">{error instanceof Error ? error.message : t('profile.security.updateError')}</Notification>)
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
                <h4>{t('profile.security.password')}</h4>
                <p>{t('profile.security.passwordDesc')}</p>
            </div>
            <Form
                ref={formRef}
                className="mb-8"
                onSubmit={handleSubmit(onSubmit)}
            >
                <FormItem
                    label={t('profile.security.currentPassword')}
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
                    label={t('profile.security.newPassword')}
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
                    label={t('profile.security.confirmNewPassword')}
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
                        {t('profile.security.update')}
                    </Button>
                </div>
            </Form>
            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title={t('profile.security.updateTitle')}
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>{t('profile.security.updateConfirm')}</p>
            </ConfirmDialog>
            <div className="mb-8">
                <h4>{t('profile.security.twoFactor')}</h4>
                <p>{t('profile.security.twoFactorDesc')}</p>
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
                                            {t('profile.security.enabled')}
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
                                            {t('profile.security.enable')}
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
