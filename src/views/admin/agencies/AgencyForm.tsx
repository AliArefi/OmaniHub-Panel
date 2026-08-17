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
import AdminEditLoading from '@/components/admin/AdminEditLoading'
import ImageUploadField from '@/components/admin/ImageUploadField'
import FaqsManager from '@/components/admin/FaqsManager'
import { Tabs } from '@/components/ui/Tabs'
import AgencyServiceCategoriesTab from './tabs/AgencyServiceCategoriesTab'
import AgencyMediaTab from './tabs/AgencyMediaTab'
import AgencyServicesTab from './tabs/AgencyServicesTab'
import AgencyMembersTab from './tabs/AgencyMembersTab'
import AgencyCapabilitiesTab from './tabs/AgencyCapabilitiesTab'
import AgencySchedulesTab from './tabs/AgencySchedulesTab'
import AgencyBookingsTab from './tabs/AgencyBookingsTab'
import AgencyReviewsTab from './tabs/AgencyReviewsTab'
import AgencyAnalyticsTab from './tabs/AgencyAnalyticsTab'
import {
    apiGetAdminAgency,
    apiGetAdminAgencyServiceOptions,
    apiCreateAdminAgency,
    apiUpdateAdminAgency,
} from '@/services/admin/AdminAgenciesService'
import type { LocalizedFieldDescriptor } from '@/components/admin/LocalizedFieldsTabs'

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
]

const LOCALIZED_FIELDS: LocalizedFieldDescriptor[] = [
    { name: 'title', label: 'Title', group: 'content' },
    { name: 'address', label: 'Address', group: 'content' },
    { name: 'about_text', label: 'About', group: 'content', type: 'richtext' },
    { name: 'about_us', label: 'About us', group: 'content', type: 'richtext' },
    { name: 'h1', label: 'H1', group: 'seo' },
    { name: 'meta_title', label: 'Meta title', group: 'seo' },
    { name: 'meta_description', label: 'Meta description', group: 'seo', type: 'textarea' },
    { name: 'canonical', label: 'Canonical URL', group: 'seo', type: 'url' },
    { name: 'og_title', label: 'OG title', group: 'seo' },
    { name: 'og_description', label: 'OG description', group: 'seo', type: 'textarea' },
]

type AgencyFormValues = {
    title: string
    slug: string
    phone: string
    whatsapp: string
    website: string
    status: string
    service_id: number | null
    top_seller: boolean
    show_in_marketplace: boolean
    fully_verfied: boolean
    meta_robots: boolean
    include_in_sitemap: boolean
    logo: File | null
    banner: File | null
    translations: Record<string, Record<string, string>>
}

const AgencyForm = () => {
    const navigate = useNavigate()
    const { slug } = useParams<{ slug: string }>()
    const isEditing = Boolean(slug)
    const [submitting, setSubmitting] = useState(false)

    const { data: existing, isLoading: isExistingLoading } = useSWR(
        isEditing ? ['admin-agency', slug] : null,
        () => apiGetAdminAgency(slug as string),
    )
    const { data: serviceOptions } = useSWR(
        'admin-agency-service-options',
        apiGetAdminAgencyServiceOptions,
    )

    const { control, handleSubmit, reset } = useForm<AgencyFormValues>({
        defaultValues: {
            title: '',
            slug: '',
            phone: '',
            whatsapp: '',
            website: '',
            status: 'pending',
            service_id: null,
            top_seller: false,
            show_in_marketplace: true,
            fully_verfied: false,
            meta_robots: true,
            include_in_sitemap: true,
            logo: null,
            banner: null,
            translations: {},
        },
    })

    useEffect(() => {
        if (existing?.data) {
            const agency = existing.data
            reset({
                title: agency.title,
                slug: agency.slug,
                phone: agency.phone ?? '',
                whatsapp: agency.whatsapp ?? '',
                website: agency.website ?? '',
                status: agency.status,
                service_id: agency.service_id,
                top_seller: agency.top_seller,
                show_in_marketplace: agency.show_in_marketplace,
                fully_verfied: agency.fully_verfied,
                meta_robots: agency.meta_robots,
                include_in_sitemap: agency.include_in_sitemap,
                logo: null,
                banner: null,
                translations: agency.translations as Record<string, Record<string, string>>,
            })
        }
    }, [existing, reset])

    const onSubmit = async (values: AgencyFormValues) => {
        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('title', values.title)
            formData.append('slug', values.slug)
            formData.append('phone', values.phone)
            formData.append('whatsapp', values.whatsapp)
            formData.append('website', values.website)
            formData.append('status', values.status)
            if (values.service_id) {
                formData.append('service_id', String(values.service_id))
            }
            formData.append('top_seller', values.top_seller ? 'on' : '')
            formData.append(
                'show_in_marketplace',
                values.show_in_marketplace ? 'on' : '',
            )
            formData.append('fully_verfied', values.fully_verfied ? 'on' : '')
            formData.append('meta_robots', values.meta_robots ? 'on' : '')
            formData.append(
                'include_in_sitemap',
                values.include_in_sitemap ? 'on' : '',
            )
            if (values.logo) formData.append('logo', values.logo)
            if (values.banner) formData.append('banner', values.banner)

            for (const [locale, fields] of Object.entries(values.translations ?? {})) {
                for (const [field, value] of Object.entries(fields ?? {})) {
                    formData.append(`translations[${locale}][${field}]`, value ?? '')
                }
            }

            if (isEditing) {
                await apiUpdateAdminAgency(slug as string, formData)
            } else {
                await apiCreateAdminAgency(formData)
            }

            toast.push(
                <Notification type="success" title="Saved">
                    Agency saved successfully.
                </Notification>,
            )
            navigate('/admin/agencies')
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to save">
                    Please check the form for errors — logo/banner are
                    required when creating a new agency.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const options = (serviceOptions?.data ?? []).map((o) => ({
        label: o.label,
        value: o.id,
    }))

    const overviewForm = (
            <AdaptiveCard>
                <h3 className="mb-6">{isEditing ? 'Edit Agency' : 'New Agency'}</h3>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <FormItem label="Slug">
                            <Controller
                                name="slug"
                                control={control}
                                render={({ field }) => <Input {...field} />}
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
                        <FormItem label="Phone">
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => <Input {...field} />}
                            />
                        </FormItem>
                        <FormItem label="WhatsApp">
                            <Controller
                                name="whatsapp"
                                control={control}
                                render={({ field }) => <Input {...field} />}
                            />
                        </FormItem>
                        <FormItem label="Website">
                            <Controller
                                name="website"
                                control={control}
                                render={({ field }) => (
                                    <Input type="url" {...field} />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Service category">
                            <Controller
                                name="service_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        isClearable
                                        options={options}
                                        value={options.find(
                                            (o) => o.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value ?? null)
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Logo">
                            <Controller
                                name="logo"
                                control={control}
                                render={({ field: { onChange } }) => (
                                    <ImageUploadField
                                        existingUrl={existing?.data.logo}
                                        onChange={onChange}
                                        shape="circle"
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Banner">
                            <Controller
                                name="banner"
                                control={control}
                                render={({ field: { onChange } }) => (
                                    <ImageUploadField
                                        existingUrl={existing?.data.banner}
                                        onChange={onChange}
                                        size={120}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Top seller">
                            <Controller
                                name="top_seller"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher checked={value} onChange={onChange} />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Show in marketplace">
                            <Controller
                                name="show_in_marketplace"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher checked={value} onChange={onChange} />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Fully verified">
                            <Controller
                                name="fully_verfied"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher checked={value} onChange={onChange} />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Include in sitemap">
                            <Controller
                                name="include_in_sitemap"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher checked={value} onChange={onChange} />
                                )}
                            />
                        </FormItem>
                    </div>

                    <LocalizedFieldsTabs
                        fields={LOCALIZED_FIELDS}
                        requiredFields={['title', 'about_text', 'address']}
                        control={control}
                    />

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => navigate('/admin/agencies')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="solid" loading={submitting}>
                            Save
                        </Button>
                    </div>
                </Form>
            </AdaptiveCard>
    )

    if (!isEditing) {
        return <Container>{overviewForm}</Container>
    }

    if (isExistingLoading) {
        return <AdminEditLoading label="Loading agency..." />
    }

    const agencySlug = slug as string

    return (
        <Container>
            <Tabs defaultValue="overview">
                <Tabs.TabList>
                    <Tabs.TabNav value="overview">Overview</Tabs.TabNav>
                    <Tabs.TabNav value="service-categories">Service Categories</Tabs.TabNav>
                    <Tabs.TabNav value="media">Media</Tabs.TabNav>
                    <Tabs.TabNav value="services">Services</Tabs.TabNav>
                    <Tabs.TabNav value="members">Members</Tabs.TabNav>
                    <Tabs.TabNav value="capabilities">
                        Member-Service Pricing &amp; Duration
                    </Tabs.TabNav>
                    <Tabs.TabNav value="schedules">Member Schedules</Tabs.TabNav>
                    <Tabs.TabNav value="reservations">Bookings</Tabs.TabNav>
                    <Tabs.TabNav value="reviews">Reviews</Tabs.TabNav>
                    <Tabs.TabNav value="faqs">FAQs</Tabs.TabNav>
                    <Tabs.TabNav value="analytics">Analytics</Tabs.TabNav>
                </Tabs.TabList>
                <Tabs.TabContent value="overview">{overviewForm}</Tabs.TabContent>
                <Tabs.TabContent value="service-categories">
                    <AgencyServiceCategoriesTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="media">
                    <AgencyMediaTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="services">
                    <AgencyServicesTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="members">
                    <AgencyMembersTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="capabilities">
                    <AgencyCapabilitiesTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="schedules">
                    <AgencySchedulesTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="reservations">
                    <AgencyBookingsTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="reviews">
                    <AgencyReviewsTab agencySlug={agencySlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="faqs">
                    <FaqsManager
                        parent="agencies"
                        parentSlug={agencySlug}
                        permission="agencies.edit"
                    />
                </Tabs.TabContent>
                <Tabs.TabContent value="analytics">
                    <AgencyAnalyticsTab agencySlug={agencySlug} />
                </Tabs.TabContent>
            </Tabs>
        </Container>
    )
}

export default AgencyForm
