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
import FaqsManager from '@/components/admin/FaqsManager'
import { Tabs } from '@/components/ui/Tabs'
import OrganizationAgenciesTab from './tabs/OrganizationAgenciesTab'
import OrganizationMembersTab from './tabs/OrganizationMembersTab'
import OrganizationMediaTab from './tabs/OrganizationMediaTab'
import OrganizationHighlightsTab from './tabs/OrganizationHighlightsTab'
import OrganizationRibbonsTab from './tabs/OrganizationRibbonsTab'
import OrganizationReviewsTab from './tabs/OrganizationReviewsTab'
import {
    apiGetAdminOrganization,
    apiCreateAdminOrganization,
    apiUpdateAdminOrganization,
} from '@/services/admin/AdminOrganizationsService'
import type { LocalizedFieldDescriptor } from '@/components/admin/LocalizedFieldsTabs'

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
]

const LOCALIZED_FIELDS: LocalizedFieldDescriptor[] = [
    { name: 'title', label: 'Title', group: 'content' },
    { name: 'address', label: 'Address', group: 'content' },
    { name: 'description', label: 'Description', group: 'content', type: 'richtext' },
    { name: 'h1', label: 'H1', group: 'seo' },
    { name: 'meta_title', label: 'Meta title', group: 'seo' },
    { name: 'meta_description', label: 'Meta description', group: 'seo', type: 'textarea', maxLength: 5000 },
    { name: 'canonical', label: 'Canonical URL', group: 'seo', type: 'url' },
    { name: 'og_title', label: 'OG title', group: 'seo' },
    { name: 'og_description', label: 'OG description', group: 'seo', type: 'textarea' },
]

type OrganizationFormValues = {
    title: string
    slug: string
    description: string
    phone: string
    website: string
    status: string
    meta_robots: boolean
    include_in_sitemap: boolean
    translations: Record<string, Record<string, string>>
}

const OrganizationForm = () => {
    const navigate = useNavigate()
    const { slug } = useParams<{ slug: string }>()
    const isEditing = Boolean(slug)
    const [submitting, setSubmitting] = useState(false)

    const { data: existing } = useSWR(
        isEditing ? ['admin-organization', slug] : null,
        () => apiGetAdminOrganization(slug as string),
    )

    const { control, handleSubmit, reset } = useForm<OrganizationFormValues>({
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            phone: '',
            website: '',
            status: 'pending',
            meta_robots: true,
            include_in_sitemap: false,
            translations: {},
        },
    })

    useEffect(() => {
        if (existing?.data) {
            const org = existing.data
            reset({
                title: org.title,
                slug: org.slug,
                description: org.description ?? '',
                phone: org.phone ?? '',
                website: org.website ?? '',
                status: org.status,
                meta_robots: org.meta_robots,
                include_in_sitemap: org.include_in_sitemap,
                translations: org.translations as Record<string, Record<string, string>>,
            })
        }
    }, [existing, reset])

    const onSubmit = async (values: OrganizationFormValues) => {
        setSubmitting(true)
        try {
            const payload = {
                title: values.title,
                slug: values.slug,
                description: values.description,
                phone: values.phone,
                website: values.website,
                status: values.status,
                meta_robots: values.meta_robots ? 'on' : '',
                include_in_sitemap: values.include_in_sitemap ? 'on' : '',
                translations: values.translations,
            }

            if (isEditing) {
                await apiUpdateAdminOrganization(slug as string, payload)
            } else {
                await apiCreateAdminOrganization(payload)
            }

            toast.push(
                <Notification type="success" title="Saved">
                    Organization saved successfully.
                </Notification>,
            )
            navigate('/admin/organizations')
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

    const overviewForm = (
            <AdaptiveCard>
                <h3 className="mb-6">
                    {isEditing ? 'Edit Organization' : 'New Organization'}
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
                        <FormItem label="Website">
                            <Controller
                                name="website"
                                control={control}
                                render={({ field }) => (
                                    <Input type="url" {...field} />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Robots indexable">
                            <Controller
                                name="meta_robots"
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
                        requiredFields={['title', 'description']}
                        control={control}
                    />

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => navigate('/admin/organizations')}
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

    const organizationSlug = slug as string

    return (
        <Container>
            <Tabs defaultValue="overview">
                <Tabs.TabList>
                    <Tabs.TabNav value="overview">Overview</Tabs.TabNav>
                    <Tabs.TabNav value="agencies">Agencies</Tabs.TabNav>
                    <Tabs.TabNav value="members">Members</Tabs.TabNav>
                    <Tabs.TabNav value="faqs">FAQs</Tabs.TabNav>
                    <Tabs.TabNav value="media">Media</Tabs.TabNav>
                    <Tabs.TabNav value="highlights">Highlights</Tabs.TabNav>
                    <Tabs.TabNav value="ribbons">Ribbons</Tabs.TabNav>
                    <Tabs.TabNav value="reviews">Reviews</Tabs.TabNav>
                </Tabs.TabList>
                <Tabs.TabContent value="overview">{overviewForm}</Tabs.TabContent>
                <Tabs.TabContent value="agencies">
                    <OrganizationAgenciesTab organizationSlug={organizationSlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="members">
                    <OrganizationMembersTab organizationSlug={organizationSlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="faqs">
                    <FaqsManager
                        parent="organizations"
                        parentSlug={organizationSlug}
                        permission="organizations.edit"
                    />
                </Tabs.TabContent>
                <Tabs.TabContent value="media">
                    <OrganizationMediaTab organizationSlug={organizationSlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="highlights">
                    <OrganizationHighlightsTab organizationSlug={organizationSlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="ribbons">
                    <OrganizationRibbonsTab organizationSlug={organizationSlug} />
                </Tabs.TabContent>
                <Tabs.TabContent value="reviews">
                    <OrganizationReviewsTab organizationSlug={organizationSlug} />
                </Tabs.TabContent>
            </Tabs>
        </Container>
    )
}

export default OrganizationForm
