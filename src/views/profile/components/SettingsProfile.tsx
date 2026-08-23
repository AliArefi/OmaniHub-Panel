import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { Form, FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import axios from 'axios'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { HiOutlineUser } from 'react-icons/hi'
import { TbPlus } from 'react-icons/tb'
import { useSessionUser } from '@/store/authStore'
import { resolveImageUrl } from '@/utils/imageUrl'
import { apiAuthMe } from '@/services/AuthService'
import {
    apiUpdateProfile,
    toUpdateProfileFormData,
} from '@/services/ProfileService'

type ProfileSchema = {
    name: string
    email?: string
    bio?: string
}

const validationSchema = z.object({
    name: z.string().trim().min(1, { message: 'نام الزامی است' }),
    email: z.string().trim().email({ message: 'ایمیل معتبر نیست' }).optional(),
    bio: z.string().trim().max(1024).optional(),
})

const extractApiErrorMessage = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات'
    }

    const data = error.response?.data as unknown
    if (data && typeof data === 'object') {
        const maybeMessage = (data as { message?: unknown }).message
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
            return maybeMessage.trim()
        }

        const maybeErrors = (data as { errors?: unknown }).errors
        if (maybeErrors && typeof maybeErrors === 'object') {
            const firstKey = Object.keys(maybeErrors as Record<string, unknown>)[0]
            const value = (maybeErrors as Record<string, unknown>)[firstKey]
            if (Array.isArray(value) && typeof value[0] === 'string') {
                return value[0]
            }
        }
    }

    return 'خطا در ذخیره اطلاعات'
}

const SettingsProfile = () => {
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [removeAvatar, setRemoveAvatar] = useState(false)
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>('')

    const beforeUpload = (files: FileList | null) => {
        let valid: string | boolean = true

        const allowedFileType = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ]
        if (files) {
            for (const file of files) {
                if (!allowedFileType.includes(file.type)) {
                    valid =
                        'لطفاً یک تصویر با فرمت jpeg / png / webp / gif انتخاب کنید'
                }
            }
        }

        return valid
    }

    const {
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
    } = useForm<ProfileSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: { name: '', email: '', bio: '' },
    })

    useEffect(() => {
        setAvatarFile(null)
        setRemoveAvatar(false)
        setAvatarPreviewUrl(resolveImageUrl(user?.avatar ?? ''))
        reset({
            name: user?.name ?? '',
            email: user?.email ?? '',
            bio: user?.bio ?? '',
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    useEffect(() => {
        return () => {
            setAvatarPreviewUrl((prev) => {
                if (prev && prev.startsWith('blob:')) {
                    URL.revokeObjectURL(prev)
                }
                return prev
            })
        }
    }, [])

    const onSubmit = async (values: ProfileSchema) => {
        try {
            const resp = await apiUpdateProfile(
                toUpdateProfileFormData({
                    name: values.name,
                    bio: values.bio,
                    avatar: avatarFile,
                    remove_avatar: removeAvatar,
                }),
            )

            if (!resp?.success) {
                throw new Error(resp?.message || 'خطا در ذخیره اطلاعات')
            }

            const me = await apiAuthMe()
            if (me?.authenticated && me?.user) {
                setUser(me.user)
            }

            toast.push(
                <Notification type="success">
                    {resp?.message || 'پروفایل با موفقیت ذخیره شد'}
                </Notification>,
            )
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {extractApiErrorMessage(err)}
                </Notification>,
            )
        }
    }

    return (
        <>
            <h4 className="mb-8">اطلاعات شخصی</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <Avatar
                            size={90}
                            className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
                            icon={<HiOutlineUser />}
                            src={avatarPreviewUrl}
                        />
                        <div className="flex items-center gap-2">
                            <Upload
                                showList={false}
                                uploadLimit={1}
                                beforeUpload={beforeUpload}
                                accept="image/*"
                                onChange={(files) => {
                                    const file = files[0]
                                    if (!file) return

                                    setAvatarFile(file)
                                    setRemoveAvatar(false)
                                    const nextPreview = URL.createObjectURL(
                                        file,
                                    )
                                    setAvatarPreviewUrl((prev) => {
                                        if (
                                            prev &&
                                            prev.startsWith('blob:') &&
                                            prev !== nextPreview
                                        ) {
                                            URL.revokeObjectURL(prev)
                                        }
                                        return nextPreview
                                    })
                                }}
                            >
                                <Button
                                    variant="solid"
                                    size="sm"
                                    type="button"
                                    icon={<TbPlus />}
                                >
                                    انتخاب تصویر
                                </Button>
                            </Upload>
                            <Button
                                size="sm"
                                type="button"
                                onClick={() => {
                                    setAvatarFile(null)
                                    setRemoveAvatar(true)
                                    setAvatarPreviewUrl('')
                                }}
                            >
                                حذف
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <FormItem
                        label="نام"
                        invalid={Boolean(errors.name)}
                        errorMessage={errors.name?.message}
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="نام"
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
                                    disabled
                                    type="email"
                                    autoComplete="off"
                                    placeholder="ایمیل"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="نبذة"
                        className="md:col-span-2"
                        invalid={Boolean(errors.bio)}
                        errorMessage={errors.bio?.message}
                    >
                        <Controller
                            name="bio"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    rows={3}
                                    autoComplete="off"
                                    placeholder="نبذة مختصرة عنك"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>

                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                    >
                        ذخیره
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default SettingsProfile
