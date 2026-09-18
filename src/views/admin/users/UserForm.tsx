import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import AdminEditLoading from '@/components/admin/AdminEditLoading'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiGetAdminUser,
    apiCreateAdminUser,
    apiUpdateAdminUser,
    apiUpdateAdminUserRoles,
} from '@/services/admin/AdminUsersService'
import { apiGetAdminRoles } from '@/services/admin/AdminRolesPermissionsService'
import useTranslation from '@/utils/hooks/useTranslation'

type UserFormValues = {
    name: string
    email: string
    bio: string
    password: string
    password_confirmation: string
    roleIds: number[]
}

const UserForm = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()
    const isEditing = Boolean(id)
    const [submitting, setSubmitting] = useState(false)
    const { can } = usePermission()

    const { data: existing, isLoading: isExistingLoading } = useSWR(
        isEditing ? ['admin-user', id] : null,
        () => apiGetAdminUser(Number(id)),
    )
    const { data: rolesData } = useSWR('admin-roles', apiGetAdminRoles)

    const { control, handleSubmit, reset } = useForm<UserFormValues>({
        defaultValues: {
            name: '',
            email: '',
            bio: '',
            password: '',
            password_confirmation: '',
            roleIds: [],
        },
    })

    useEffect(() => {
        if (existing?.data) {
            reset({
                name: existing.data.name,
                email: existing.data.email,
                bio: existing.data.bio ?? '',
                password: '',
                password_confirmation: '',
                roleIds: existing.data.role_ids ?? [],
            })
        }
    }, [existing, reset])

    const onSubmit = async (values: UserFormValues) => {
        setSubmitting(true)
        try {
            if (isEditing) {
                await apiUpdateAdminUser(Number(id), {
                    name: values.name,
                    email: values.email,
                    bio: values.bio,
                    ...(values.password
                        ? {
                              password: values.password,
                              password_confirmation: values.password_confirmation,
                          }
                        : {}),
                })
                if (can('roles.edit')) {
                    await apiUpdateAdminUserRoles(Number(id), values.roleIds)
                }
            } else {
                await apiCreateAdminUser({
                    name: values.name,
                    email: values.email,
                    bio: values.bio,
                    password: values.password,
                    password_confirmation: values.password_confirmation,
                    ...(can('roles.edit') ? { role_ids: values.roleIds } : {}),
                })
            }

            toast.push(
                <Notification type="success" title={t('adminUsers.savedTitle')}>
                    {t('adminUsers.saved')}
                </Notification>,
            )
            navigate('/admin/users')
        } catch {
            toast.push(
                <Notification type="danger" title={t('adminUsers.saveErrorTitle')}>
                    {t('adminUsers.saveError')}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const roleOptions = (rolesData?.data ?? []).map((role) => ({
        label: role.name,
        value: role.id,
    }))

    if (isEditing && isExistingLoading) {
        return <AdminEditLoading label={t('adminUsers.loading')} />
    }

    return (
        <Container>
            <AdaptiveCard>
                <h3 className="mb-6">{isEditing ? t('adminUsers.editTitle') : t('adminUsers.newTitle')}</h3>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem label={t('adminUsers.fields.name')}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => <Input {...field} />}
                            />
                        </FormItem>
                        <FormItem label={t('adminUsers.fields.email')}>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input type="email" {...field} />
                                )}
                            />
                        </FormItem>
                        <FormItem label={t('adminUsers.fields.bio')} className="md:col-span-2">
                            <Controller
                                name="bio"
                                control={control}
                                render={({ field }) => (
                                    <Input textArea rows={3} {...field} />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label={
                                isEditing
                                    ? t('adminUsers.newPasswordHint')
                                    : t('adminUsers.fields.password')
                            }
                        >
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <Input type="password" {...field} />
                                )}
                            />
                        </FormItem>
                        <FormItem label={t('adminUsers.fields.confirmPassword')}>
                            <Controller
                                name="password_confirmation"
                                control={control}
                                render={({ field }) => (
                                    <Input type="password" {...field} />
                                )}
                            />
                        </FormItem>
                        {can('roles.edit') && (
                            <FormItem label={t('adminUsers.fields.roles')} className="md:col-span-2">
                                <Controller
                                    name="roleIds"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            isMulti
                                            options={roleOptions}
                                            value={roleOptions.filter((o) =>
                                                field.value.includes(o.value),
                                            )}
                                            onChange={(options) =>
                                                field.onChange(
                                                    (options ?? []).map(
                                                        (o) => o.value,
                                                    ),
                                                )
                                            }
                                        />
                                    )}
                                />
                            </FormItem>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => navigate('/admin/users')}
                        >
                            {t('adminUsers.cancel')}
                        </Button>
                        <Button type="submit" variant="solid" loading={submitting}>
                            {t('adminUsers.save')}
                        </Button>
                    </div>
                </Form>
            </AdaptiveCard>
        </Container>
    )
}

export default UserForm
