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
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import LocalizedFieldsTabs from '@/components/admin/LocalizedFieldsTabs'
import ImageUploadField from '@/components/admin/ImageUploadField'
import FaqsManager from '@/components/admin/FaqsManager'
import AdminEditLoading from '@/components/admin/AdminEditLoading'
import { Tabs } from '@/components/ui/Tabs'
import {
    apiGetAdminService,
    apiGetAdminServiceTree,
    apiCreateAdminService,
    apiUpdateAdminService,
} from '@/services/admin/AdminServicesService'
import type { LocalizedFieldDescriptor } from '@/components/admin/LocalizedFieldsTabs'
import useTranslation from '@/utils/hooks/useTranslation'

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
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { slug } = useParams<{ slug: string }>()
    const isEditing = Boolean(slug)
    const [submitting, setSubmitting] = useState(false)
    const statusOptions = [
        { label: t('adminServiceForm.status.pending'), value: 'pending' },
        { label: t('adminServiceForm.status.draft'), value: 'draft' },
        { label: t('adminServiceForm.status.published'), value: 'published' },
    ]
    const localizedFields: LocalizedFieldDescriptor[] = [
        { name: 'name', label: t('adminServiceForm.fields.name'), group: 'content' },
        { name: 'title', label: t('adminServiceForm.fields.title'), group: 'content' },
        { name: 'body', label: t('adminServiceForm.fields.body'), group: 'content', type: 'richtext' },
        { name: 'body2', label: t('adminServiceForm.fields.body2'), group: 'content', type: 'richtext' },
        { name: 'h1', label: 'H1', group: 'seo', help: t('adminServiceForm.help.cityToken') },
        { name: 'h2', label: 'H2', group: 'seo' },
        { name: 'meta_title', label: t('adminServiceForm.fields.metaTitle'), group: 'seo' },
        { name: 'meta_description', label: t('adminServiceForm.fields.metaDescription'), group: 'seo', type: 'textarea' },
        { name: 'url_pattern', label: t('adminServiceForm.fields.urlPattern'), group: 'seo', help: t('adminServiceForm.help.urlPattern') },
        { name: 'city_url_pattern', label: t('adminServiceForm.fields.cityUrlPattern'), group: 'seo', help: t('adminServiceForm.help.cityUrlPattern') },
    ]

    const { data: existing, isLoading: isExistingLoading } = useSWR(
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
                formData.append('service_id', String(values.service_id));
            } else {
                formData.append('service_id', '');
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
                <Notification type="success" title={t('adminServiceForm.savedTitle')}>
                    {t('adminServiceForm.saved')}
                </Notification>,
            )
            navigate('/admin/services')
        } catch {
            toast.push(
                <Notification type="danger" title={t('adminServiceForm.saveErrorTitle')}>
                    {t('adminServiceForm.saveError')}
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

    const overviewForm = (
        <AdaptiveCard>
            <h3 className="mb-6">
                {isEditing ? t('adminServiceForm.editTitle') : t('adminServiceForm.createTitle')}
            </h3>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormItem label={t('adminServiceForm.fields.slug')}>
                        <Controller
                            name="slug"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label={t('adminServiceForm.fields.orderNumber')}>
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
                    <FormItem label={t('adminServiceForm.fields.status')}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.find(
                                        (o) => o.value === field.value,
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminServiceForm.fields.parentService')}>
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
                    <FormItem label={t('adminServiceForm.fields.icon')}>
                        <Controller
                            name="icon"
                            control={control}
                            render={({ field: { onChange } }) => (
                                <ImageUploadField
                                    existingUrl={existing?.data.icon}
                                    size={64}
                                    onChange={onChange}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminServiceForm.fields.image')}>
                        <Controller
                            name="image"
                            control={control}
                            render={({ field: { onChange } }) => (
                                <ImageUploadField
                                    existingUrl={existing?.data.image}
                                    size={64}
                                    onChange={onChange}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('adminServiceForm.fields.featured')}>
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
                    fields={localizedFields}
                    requiredFields={['name', 'title', 'body']}
                    control={control}
                />

                <div className="flex justify-end gap-2 mt-6">
                    <Button
                        type="button"
                        variant="plain"
                        onClick={() => navigate('/admin/services')}
                    >
                        {t('adminServiceForm.cancel')}
                    </Button>
                    <Button type="submit" variant="solid" loading={submitting}>
                        {t('adminServiceForm.save')}
                    </Button>
                </div>
            </Form>
        </AdaptiveCard>
    )

    if (isEditing && isExistingLoading) {
        return <AdminEditLoading label={t('adminServiceForm.loading')} />
    }

    if (!isEditing) {
        return <Container>{overviewForm}</Container>
    }

    return (
        <Container>
            <Tabs defaultValue="overview">
                <Tabs.TabList>
                    <Tabs.TabNav value="overview">{t('adminServiceForm.overview')}</Tabs.TabNav>
                    <Tabs.TabNav value="faqs">{t('adminServiceForm.faqs')}</Tabs.TabNav>
                </Tabs.TabList>
                <Tabs.TabContent value="overview">{overviewForm}</Tabs.TabContent>
                <Tabs.TabContent value="faqs">
                    <FaqsManager
                        parent="services"
                        parentSlug={slug as string}
                        permission="services.edit"
                    />
                </Tabs.TabContent>
            </Tabs>
        </Container>
    )
}

export default ServiceForm
