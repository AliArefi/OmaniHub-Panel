import { useState, useRef } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import classNames from '@/utils/classNames'
import sleep from '@/utils/sleep'
import isLastChild from '@/utils/isLastChild'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

type PasswordSchema = {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
}
const authenticatorList = [
    {
        label: 'Google Authenticator',
        value: 'googleAuthenticator',
        img: '/img/others/google.png',
        desc: 'يتم إنشاء رموز حساسة للوقت باستخدام تطبيق Google Authenticator لتسجيل دخول آمن.',
    },
    {
        label: 'Okta Verify',
        value: 'oktaVerify',
        img: '/img/others/okta.png',
        desc: 'استلام إشعارات فورية من تطبيق Okta Verify على هاتفك للتحقق السريع من تسجيل الدخول.',
    },
    {
        label: 'التحقق عبر البريد الإلكتروني',
        value: 'emailVerification',
        img: '/img/others/email.png',
        desc: 'رموز فريدة يتم إرسالها إلى بريدك الإلكتروني للتحقق من تسجيل الدخول.',
    },
];

const validationSchema = z.object({
        currentPassword: z
            .string()
            .min(1, { message: 'يرجى إدخال كلمة المرور الحالية!' }),
        newPassword: z
            .string()
            .min(1, { message: 'يرجى إدخال كلمة المرور الجديدة!' }),
        confirmNewPassword: z
            .string()
            .min(1, { message: 'يرجى تأكيد كلمة المرور الجديدة!' }),
    })
    .refine((data) => data.confirmNewPassword === data.newPassword, {
        message: 'كلمة المرور غير متطابقة',
        path: ['confirmNewPassword'],
    })

const SettingsSecurity = () => {
    const [selected2FaType, setSelected2FaType] = useState(
        'googleAuthenticator',
    )
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)

    const {
        getValues,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<PasswordSchema>({
        resolver: zodResolver(validationSchema),
    })

    const handlePostSubmit = async () => {
        setIsSubmitting(true)
        await sleep(1000)
        console.log('getValues', getValues())
        setConfirmationOpen(false)
        setIsSubmitting(false)
    }

    const onSubmit = async () => {
        setConfirmationOpen(true)
    }

    return (
        <div>
            <div className="mb-8">
                <h4>كلمة المرور</h4>
                <p>
                    تذكّر أن كلمة المرور هي المفتاح الرقمي لحسابك.
                    حافظ عليها آمنة ومحمية!
                </p>
            </div>
            <Form
                ref={formRef}
                className="mb-8"
                onSubmit={handleSubmit(onSubmit)}
            >
                <FormItem
                    label="كلمة المرور الحالية"
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
                    label="كلمة المرور الجديدة"
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
                    label="تأكيد كلمة المرور الجديدة"
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
                        تحديث
                    </Button>
                </div>
            </Form>
            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title="تحديث كلمة المرور"
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>هل أنت متأكد أنك تريد تغيير كلمة المرور الخاصة بك؟</p>
            </ConfirmDialog>
            <div className="mb-8">
                <h4>التحقق بخطوتين</h4>
                <p>
                    حسابك ذو قيمة للمخترقين. قم بتفعيل التحقق بخطوتين
                    لتأمين حسابك!
                </p>
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
                                            مُفعّل
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
                                            تفعيل
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
