import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Upload from '@/components/ui/Upload'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import LocalizedFieldsTabs from '@/components/admin/LocalizedFieldsTabs'
import {
    apiGetAdminService,
    apiGetAdminServiceTree,
    apiCreateAdminService,
    apiUpdateAdminService,
} from '@/services/admin/AdminServicesService'
import type { LocalizedFieldDescriptor } from '@/components/admin/LocalizedFieldsTabs'

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
]

const LOCALIZED_FIELDS: LocalizedFieldDescriptor[] = [
    { name: 'name', label: 'Name', group: 'content' },
    { name: 'title', label: 'Title', group: 'content' },
    { name: 'body', label: 'Body', group: 'content', type: 'richtext' },
    { name: 'body2', label: 'Body 2', group: 'content', type: 'richtext' },
    { name: 'h1', label: 'H1', group: 'seo', help: 'Use {city} for city pages.' },
    { name: 'h2', label: 'H2', group: 'seo' },
    { name: 'meta_title', label: 'Meta title', group: 'seo' },
    { name: 'meta_description', label: 'Meta description', group: 'seo', type: 'textarea' },
    { name: 'url_pattern', label: 'URL pattern', group: 'seo', help: 'Example: /occasion-makeup/' },
    { name: 'city_url_pattern', label: 'City URL pattern', group: 'seo', help: 'Required format: /service-slug/{city}/' },
]

type ServiceFormValues = {
    title: string
    name: string
    slug: string
    body: string
    status: string
    service_id: number | null
    order_number: number
    featured: boolean
    icon: File | null
    image: File | null
    translations: Record<string, Record<string, string>>
}

const ServiceForm = () => {
    const navigate = useNavigate()
    const { slug } = useParams<{ slug: string }>()
    const isEditing = Boolean(slug)
    const [submitting, setSubmitting] = useState(false)

    const { data: existing } = useSWR(
        isEditing ? ['admin-service', slug] : null,
        () => apiGetAdminService(slug as string),
    )

    const { data: treeData } = useSWR('admin-service-tree', () =>
        apiGetAdminServiceTree(existing?.data.id),
    )

    const { control, handleSubmit, reset } = useForm<ServiceFormValues>({
        defaultValues: {
            title: '',
            name: '',
            slug: '',
            body: '',
            status: 'pending',
            service_id: null,
            order_number: 1,
            featured: false,
            icon: null,
            image: null,
            translations: {},
        },
    })

    useEffect(() => {
        if (existing?.data) {
            const service = existing.data
            reset({
                title: service.title ?? '',
                name: service.name ?? '',
                slug: service.slug,
                body: service.body ?? '',
                status: service.status,
                service_id: service.service_id,
                order_number: service.order_number,
                featured: service.featured,
                icon: null,
                image: null,
                translations: service.translations as Record<
                    string,
                    Record<string, string>
                >,
            })
        }
    }, [existing, reset])

    const onSubmit = async (values: ServiceFormValues) => {
        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('title', values.title)
            formData.append('name', values.name)
            formData.append('slug', values.slug)
            formData.append('body', values.body)
            formData.append('status', values.status)
            formData.append('order_number', String(values.order_number))
            formData.append('featured', values.featured ? 'on' : '')
            if (values.service_id) {
                formData.append('service_id', String(values.service_id))
            }
            if (values.icon) formData.append('icon', values.icon)
            if (values.image) formData.append('image', values.image)

            for (const [locale, fields] of Object.entries(values.translations ?? {})) {
                for (const [field, value] of Object.entries(fields ?? {})) {
                    formData.append(`translations[${locale}][${field}]`, value ?? '')
                }
            }

            if (isEditing) {
                await apiUpdateAdminService(slug as string, formData)
            } else {
                await apiCreateAdminService(formData)
            }

            toast.push(
                <Notification type="success" title="Saved">
                    Service saved successfully.
                </Notification>,
            )
            navigate('/admin/services')
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

    const treeOptions = (treeData?.data ?? []).map((option) => ({
        label: option.label,
        value: option.id,
    }))

    return (
        <Container>
            <AdaptiveCard>
                <h3 className="mb-6">
                    {isEditing ? 'Edit Service' : 'New Service'}
                </h3>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <FormItem label="Slug">
                            <Controller
                                name="slug"
                                control={control}
                                render={({ field }) => <Input {...field} />}
                            />
                        </FormItem>
                        <FormItem label="Order number">
                            <Controller
                                name="order_number"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) =>
                                            field.onChange(Number(e.target.value))
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Status">
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        options={STATUS_OPTIONS}
                                        value={STATUS_OPTIONS.find(
                                            (o) => o.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value)
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Parent service">
                            <Controller
                                name="service_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        isClearable
                                        options={treeOptions}
                                        value={treeOptions.find(
                                            (o) => o.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value ?? null)
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Icon">
                            <Controller
                                name="icon"
                                control={control}
                                render={({ field: { onChange } }) => (
                                    <Upload
                                        uploadLimit={1}
                                        onChange={(files) => onChange(files[0] ?? null)}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Image">
                            <Controller
                                name="image"
                                control={control}
                                render={({ field: { onChange } }) => (
                                    <Upload
                                        uploadLimit={1}
                                        onChange={(files) => onChange(files[0] ?? null)}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Featured">
                            <Controller
                                name="featured"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher checked={value} onChange={onChange} />
                                )}
                            />
                        </FormItem>
                    </div>

                    <LocalizedFieldsTabs
                        fields={LOCALIZED_FIELDS}
                        requiredFields={['name', 'title', 'body']}
                        control={control}
                    />

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => navigate('/admin/services')}
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

export default ServiceForm
