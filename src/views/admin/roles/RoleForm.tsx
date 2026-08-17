import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import PermissionMatrix from '@/components/admin/PermissionMatrix'
import AdminEditLoading from '@/components/admin/AdminEditLoading'
import {
    apiGetAdminRole,
    apiCreateAdminRole,
    apiUpdateAdminRole,
} from '@/services/admin/AdminRolesPermissionsService'

type RoleFormValues = {
    name: string
    permissions: string[]
}

const RoleForm = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEditing = Boolean(id)
    const [submitting, setSubmitting] = useState(false)

    const { data: existing, isLoading: isExistingLoading } = useSWR(
        isEditing ? ['admin-role', id] : null,
        () => apiGetAdminRole(Number(id)),
    )

    const { control, handleSubmit, reset } = useForm<RoleFormValues>({
        defaultValues: { name: '', permissions: [] },
    })

    useEffect(() => {
        if (existing?.data) {
            reset({
                name: existing.data.name,
                permissions: existing.data.permissions,
            })
        }
    }, [existing, reset])

    const onSubmit = async (values: RoleFormValues) => {
        setSubmitting(true)
        try {
            if (isEditing) {
                await apiUpdateAdminRole(Number(id), values)
            } else {
                await apiCreateAdminRole(values)
            }
            toast.push(
                <Notification type="success" title="Saved">
                    Role saved successfully.
                </Notification>,
            )
            navigate('/admin/roles')
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

    if (isEditing && isExistingLoading) {
        return <AdminEditLoading label="Loading role..." />
    }

    return (
        <Container>
            <AdaptiveCard>
                <h3 className="mb-6">{isEditing ? 'Edit Role' : 'New Role'}</h3>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Name" className="max-w-md mb-6">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>

                    <Controller
                        name="permissions"
                        control={control}
                        render={({ field }) => (
                            <PermissionMatrix
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => navigate('/admin/roles')}
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

export default RoleForm
