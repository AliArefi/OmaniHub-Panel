import { useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Dialog from '@/components/ui/Dialog'
import { Form, FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import ImageUploadField from '@/components/admin/ImageUploadField'
import { TbPlus, TbEdit, TbTrash } from 'react-icons/tb'
import {
    apiGetAdminAgencyMembers,
    apiCreateAdminAgencyMember,
    apiUpdateAdminAgencyMember,
    apiDeleteAdminAgencyMember,
    apiSearchMemberUsers,
} from '@/services/admin/AdminAgencyMembersService'
import { apiGetAdminAgencyServices } from '@/services/admin/AdminAgencyServicesService'
import type { AdminAgencyMember } from '@/services/admin/AdminAgencyMembersService'

type FormValues = {
    name: string
    position: string
    agency_service_ids: number[]
    image: File | null
    is_active: boolean
    allow_inactive_bookable_capabilities: boolean
    user_id: number | null
}

const emptyValues: FormValues = {
    name: '',
    position: '',
    agency_service_ids: [],
    image: null,
    is_active: true,
    allow_inactive_bookable_capabilities: false,
    user_id: null,
}

/**
 * React port of the agency "Members" module tab — staff assigned to one of
 * the agency's offered services (AgencyModulesController::members).
 */
function AgencyMembersTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<AdminAgencyMember | null>(null)
    const [pendingDelete, setPendingDelete] =
        useState<AdminAgencyMember | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [userSearch, setUserSearch] = useState('')

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-members', agencySlug],
        () => apiGetAdminAgencyMembers(agencySlug),
    )
    const { data: servicesData } = useSWR(
        ['admin-agency-services', agencySlug],
        () => apiGetAdminAgencyServices(agencySlug),
    )
    const { data: userOptionsData } = useSWR(
        userSearch.trim().length >= 2
            ? ['member-user-options', agencySlug, userSearch]
            : null,
        () => apiSearchMemberUsers(agencySlug, userSearch),
    )

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: emptyValues,
    })

    const members = data?.data ?? []
    const serviceOptions = (servicesData?.data ?? []).map((s) => ({
        value: s.id,
        label: s.title,
    }))

    const openCreate = () => {
        setEditing(null)
        reset(emptyValues)
        setDialogOpen(true)
    }

    const openEdit = (member: AdminAgencyMember) => {
        setEditing(member)
        reset({
            name: member.name,
            position: member.position,
            agency_service_ids: member.agency_service_ids,
            image: null,
            is_active: member.is_active,
            allow_inactive_bookable_capabilities:
                member.allow_inactive_bookable_capabilities,
            user_id: member.user_id,
        })
        setDialogOpen(true)
    }

    const onSubmit = async (values: FormValues) => {
        if (values.agency_service_ids.length === 0) return
        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('name', values.name)
            formData.append('position', values.position)
            values.agency_service_ids.forEach((serviceId) =>
                formData.append('agency_service_ids[]', String(serviceId)),
            )
            formData.append('is_active', values.is_active ? '1' : '0')
            formData.append(
                'allow_inactive_bookable_capabilities',
                values.allow_inactive_bookable_capabilities ? '1' : '0',
            )
            formData.append('user_id', values.user_id ? String(values.user_id) : '')
            if (values.image) formData.append('image', values.image)

            if (editing) {
                await apiUpdateAdminAgencyMember(
                    agencySlug,
                    editing.id,
                    formData,
                )
            } else {
                await apiCreateAdminAgencyMember(agencySlug, formData)
            }
            toast.push(<Notification type="success" title="Saved" />)
            setDialogOpen(false)
            mutate()
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

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminAgencyMember(agencySlug, pendingDelete.id)
            toast.push(<Notification type="success" title="Deleted" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setPendingDelete(null)
        }
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h5>Members</h5>
                {canEdit && (
                    <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                        Add member
                    </Button>
                )}
            </div>

            {!isLoading && members.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    No members yet.
                </div>
            )}

            <div className="flex flex-col gap-2">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar src={member.image} />
                            <div>
                                <div className="font-semibold">
                                    {member.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {member.position} ·{' '}
                                    {member.agency_services
                                        .map((service) => service.title)
                                        .join(', ') || '—'}{' '}
                                    · {member.is_active ? 'Active' : 'Inactive'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {member.linked_user
                                        ? `Linked: ${member.linked_user.email || member.linked_user.mobile || member.linked_user.name}`
                                        : 'No linked account'}
                                    {member.roles.length > 0 && ` · ${member.roles.map((role) => role.name).join(', ')}`}
                                </div>
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    size="xs"
                                    icon={<TbEdit />}
                                    onClick={() => openEdit(member)}
                                />
                                <Button
                                    size="xs"
                                    icon={<TbTrash />}
                                    onClick={() => setPendingDelete(member)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">
                    {editing ? 'Edit member' : 'New member'}
                </h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Photo">
                        <Controller
                            name="image"
                            control={control}
                            render={({ field: { onChange } }) => (
                                <ImageUploadField
                                    existingUrl={editing?.image}
                                    shape="circle"
                                    onChange={onChange}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Name">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Position">
                        <Controller
                            name="position"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Assigned services">
                        <Controller
                            name="agency_service_ids"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    options={serviceOptions}
                                    value={serviceOptions.filter((option) =>
                                        field.value.includes(option.value),
                                    )}
                                    onChange={(options) =>
                                        field.onChange(
                                            options.map(
                                                (option) => option.value,
                                            ),
                                        )
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Linked user">
                        <Controller
                            name="user_id"
                            control={control}
                            render={({ field }) => {
                                const candidates = [...(userOptionsData?.data ?? [])]
                                if (editing?.linked_user && !candidates.some((user) => user.id === editing.linked_user?.id)) {
                                    candidates.unshift(editing.linked_user)
                                }
                                const options = candidates.map((user) => ({
                                    value: user.id,
                                    label: `${user.name} - ${user.email || user.mobile || ''}`,
                                }))
                                return <Select
                                    isClearable
                                    options={options}
                                    value={options.find((option) => option.value === field.value) ?? null}
                                    placeholder="Search name, email, or mobile"
                                    onInputChange={setUserSearch}
                                    onChange={(option) => field.onChange(option?.value ?? null)}
                                />
                            }}
                        />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Active">
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher
                                        checked={value}
                                        onChange={onChange}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Allow inactive bookable capabilities">
                            <Controller
                                name="allow_inactive_bookable_capabilities"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher
                                        checked={value}
                                        onChange={onChange}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={submitting}
                        >
                            Save
                        </Button>
                    </div>
                </Form>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete member"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this member?
            </ConfirmDialog>
        </Card>
    )
}

export default AgencyMembersTab
