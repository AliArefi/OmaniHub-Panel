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
                roleIds: [],
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
                if (can('roles.edit') && values.roleIds.length > 0) {
                    await apiUpdateAdminUserRoles(Number(id), values.roleIds)
                }
            } else {
                await apiCreateAdminUser({
                    name: values.name,
                    email: values.email,
                    bio: values.bio,
                    password: values.password,
                    password_confirmation: values.password_confirmation,
                })
            }

            toast.push(
                <Notification type="success" title="Saved">
                    User saved successfully.
                </Notification>,
            )
            navigate('/admin/users')
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to save">
                    Please check the form for errors.
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
        return <AdminEditLoading label="Loading user..." />
    }

    return (
        <Container>
            <AdaptiveCard>
                <h3 className="mb-6">{isEditing ? 'Edit User' : 'New User'}</h3>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormItem label="Name">
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => <Input {...field} />}
                            />
                        </FormItem>
                        <FormItem label="Email">
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input type="email" {...field} />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Bio" className="md:col-span-2">
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
                                    ? 'New password (leave blank to keep current)'
                                    : 'Password'
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
                        <FormItem label="Confirm password">
                            <Controller
                                name="password_confirmation"
                                control={control}
                                render={({ field }) => (
                                    <Input type="password" {...field} />
                                )}
                            />
                        </FormItem>
                        {isEditing && can('roles.edit') && (
                            <FormItem label="Roles" className="md:col-span-2">
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
                            Cancel
                        </Button>
                        <Button type="submit" variant="solid" loading={submitting}>
                            Save
                        </Button>
                    </div>
                </Form>
            </AdaptiveCard>
        </Container>
    )
}

export default UserForm
