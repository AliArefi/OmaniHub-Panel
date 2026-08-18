import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import AdminEditLoading from '@/components/admin/AdminEditLoading'
import LocalizedFieldsTabs from '@/components/admin/LocalizedFieldsTabs'
import CmsMediaManager from './CmsMediaManager'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import {
    apiCmsEntryAction,
    apiCreateCmsEntry,
    apiGetCmsEntry,
    apiGetCmsTypes,
    apiUpdateCmsEntry,
    type CmsContentType,
    type CmsCustomField,
    type CmsLocale,
    type CmsTranslation,
} from '@/services/admin/AdminCmsService'
import type { LocalizedFieldDescriptor } from '@/components/admin/LocalizedFieldsTabs'

const TYPE_KEYS: Record<string, string> = {
    pages: 'page',
    posts: 'post',
    blocks: 'block',
}
const LOCALES: CmsLocale[] = ['ar', 'en']
const LOCALIZED_FIELDS: LocalizedFieldDescriptor[] = [
    { name: 'title', label: 'Title', group: 'content' },
    { name: 'slug', label: 'Slug', group: 'content' },
    { name: 'excerpt', label: 'Excerpt', group: 'content', type: 'textarea' },
    {
        name: 'content_html',
        label: 'Content',
        group: 'content',
        type: 'richtext',
    },
    { name: 'seo_title', label: 'SEO title', group: 'seo' },
    {
        name: 'seo_description',
        label: 'Meta description',
        group: 'seo',
        type: 'textarea',
    },
    {
        name: 'seo_canonical',
        label: 'Canonical URL',
        group: 'seo',
        type: 'url',
    },
    { name: 'seo_robots', label: 'Robots', group: 'seo' },
]

type FlatTranslation = Record<string, unknown> & {
    title: string
    slug: string
    excerpt: string
    content_html: string
    seo_title: string
    seo_description: string
    seo_canonical: string
    seo_robots: string
}
type FormValues = {
    featured: boolean
    translations: Record<CmsLocale, FlatTranslation>
}
const emptyTranslation = (): FlatTranslation => ({
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    seo_title: '',
    seo_description: '',
    seo_canonical: '',
    seo_robots: 'index,follow',
})

function flattenTranslation(value?: CmsTranslation): FlatTranslation {
    return {
        ...emptyTranslation(),
        ...value,
        seo_title: value?.seo?.title ?? '',
        seo_description: value?.seo?.description ?? '',
        seo_canonical: value?.seo?.canonical ?? '',
        seo_robots: value?.seo?.robots ?? 'index,follow',
        ...(value?.custom_fields ?? {}),
    }
}

export default function CmsEntryForm() {
    const navigate = useNavigate()
    const { type = 'posts', id } = useParams()
    const typeKey = TYPE_KEYS[type] ?? type
    const isEditing = Boolean(id)
    const [submitting, setSubmitting] = useState(false)
    const { data: typesResponse } = useSWR('cms-types', apiGetCmsTypes)
    const {
        data: entryResponse,
        isLoading,
        mutate: mutateEntry,
    } = useSWR(isEditing ? ['cms-entry', id] : null, () =>
        apiGetCmsEntry(Number(id)),
    )
    const contentType = useMemo(
        () => typesResponse?.data.find((item) => item.key === typeKey),
        [typeKey, typesResponse],
    )
    const customFields = useMemo(
        () => contentType?.settings?.custom_fields ?? [],
        [contentType],
    )
    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            featured: false,
            translations: { ar: emptyTranslation(), en: emptyTranslation() },
        },
    })

    useEffect(() => {
        if (!entryResponse?.data) return
        reset({
            featured: entryResponse.data.featured,
            translations: {
                ar: flattenTranslation(entryResponse.data.translations?.ar),
                en: flattenTranslation(entryResponse.data.translations?.en),
            },
        })
    }, [entryResponse, reset])

    useEffect(() => {
        if (isEditing || !contentType) return
        const translations = Object.fromEntries(
            LOCALES.map((locale) => [
                locale,
                {
                    ...emptyTranslation(),
                    ...Object.fromEntries(
                        customFields.map((field) => [
                            field.id,
                            contentType.translations?.[locale]?.custom_fields?.[
                                field.id
                            ]?.default ?? '',
                        ]),
                    ),
                },
            ]),
        ) as Record<CmsLocale, FlatTranslation>
        reset({ featured: false, translations })
    }, [contentType, customFields, isEditing, reset])

    const serialize = (values: FormValues) => ({
        featured: values.featured,
        translations: Object.fromEntries(
            LOCALES.map((locale) => {
                const value = values.translations[locale]
                const custom = Object.fromEntries(
                    customFields.map((field) => [
                        field.id,
                        value[field.id] ?? null,
                    ]),
                )
                return [
                    locale,
                    {
                        title: value.title,
                        slug: value.slug,
                        excerpt: value.excerpt,
                        content_html: value.content_html,
                        custom_fields: custom,
                        seo: {
                            title: value.seo_title,
                            description: value.seo_description,
                            canonical: value.seo_canonical,
                            robots: value.seo_robots,
                        },
                    },
                ]
            }),
        ),
    })

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true)
        try {
            const payload = serialize(values)
            if (isEditing) {
                await apiUpdateCmsEntry(Number(id), payload)
            } else {
                const created = await apiCreateCmsEntry(
                    typeKey,
                    payload.translations as Partial<
                        Record<CmsLocale, CmsTranslation>
                    >,
                )
                await apiUpdateCmsEntry(created.data.id, {
                    featured: values.featured,
                })
            }
            toast.push(
                <Notification type="success" title="Saved">
                    CMS entry saved successfully.
                </Notification>,
            )
            navigate(`/admin/cms/${type}`)
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to save">
                    Check required Arabic fields and try again.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (isEditing && isLoading)
        return <AdminEditLoading label="Loading CMS entry..." />

    return (
        <Container>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                        <AdaptiveCard>
                            <div className="mb-6 flex items-center justify-between">
                                <h3>
                                    {isEditing ? 'Edit' : 'New'}{' '}
                                    {contentType?.translations?.en?.name ??
                                        typeKey}
                                </h3>
                                {entryResponse?.data.is_system && (
                                    <Tag>Protected system entry</Tag>
                                )}
                            </div>
                            <LocalizedFieldsTabs
                                fields={LOCALIZED_FIELDS}
                                requiredFields={[
                                    'title',
                                    'slug',
                                    ...(contentType?.settings?.supports?.includes(
                                        'editor',
                                    )
                                        ? ['content_html']
                                        : []),
                                ]}
                                control={control}
                            />
                            {customFields.length > 0 && (
                                <CustomFields
                                    fields={customFields}
                                    type={contentType}
                                    control={control}
                                />
                            )}
                        </AdaptiveCard>
                    </div>
                    <div className="space-y-6 lg:col-span-4">
                        <AdaptiveCard>
                            <h5 className="mb-4">Publishing</h5>
                            <FormItem label="Featured">
                                <Controller
                                    name="featured"
                                    control={control}
                                    render={({ field }) => (
                                        <Switcher
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </FormItem>
                            {entryResponse?.data && (
                                <div className="mb-4 flex items-center justify-between">
                                    <span>Status</span>
                                    <Tag>{entryResponse.data.status}</Tag>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    variant="solid"
                                    loading={submitting}
                                >
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    variant="plain"
                                    onClick={() =>
                                        navigate(`/admin/cms/${type}`)
                                    }
                                >
                                    Cancel
                                </Button>
                                {id &&
                                    entryResponse?.data.status !==
                                        'published' && (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                apiCmsEntryAction(
                                                    Number(id),
                                                    'publish',
                                                ).then(() =>
                                                    navigate(
                                                        `/admin/cms/${type}`,
                                                    ),
                                                )
                                            }
                                        >
                                            Publish
                                        </Button>
                                    )}
                                {id &&
                                    entryResponse?.data.status ===
                                        'published' && (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                apiCmsEntryAction(
                                                    Number(id),
                                                    'unpublish',
                                                ).then(() =>
                                                    navigate(
                                                        `/admin/cms/${type}`,
                                                    ),
                                                )
                                            }
                                        >
                                            Unpublish
                                        </Button>
                                    )}
                            </div>
                        </AdaptiveCard>
                        <AdaptiveCard>
                            <h5 className="mb-4">Locale media</h5>
                            {!id && (
                                <p className="text-sm text-gray-500">
                                    Save the entry before uploading media.
                                </p>
                            )}
                            {id && (
                                <CmsMediaManager
                                    entryId={Number(id)}
                                    entry={entryResponse?.data}
                                    onChanged={() => mutateEntry()}
                                />
                            )}
                        </AdaptiveCard>
                    </div>
                </div>
            </Form>
        </Container>
    )
}

function CustomFields({
    fields,
    type,
    control,
}: {
    fields: CmsCustomField[]
    type?: CmsContentType
    control: ReturnType<typeof useForm<FormValues>>['control']
}) {
    return (
        <div className="mt-8">
            <h5 className="mb-4">Custom fields</h5>
            {LOCALES.map((locale) => (
                <div key={locale} className="mb-5">
                    <h6 className="mb-3 uppercase">{locale}</h6>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {fields.map((field) => (
                            <FormItem
                                key={`${locale}-${field.id}`}
                                label={
                                    type?.translations?.[locale]
                                        ?.custom_fields?.[field.id]?.label ??
                                    field.id
                                }
                                asterisk={field.required}
                                className={
                                    field.type === 'textarea'
                                        ? 'md:col-span-2'
                                        : undefined
                                }
                            >
                                <Controller
                                    name={`translations.${locale}.${field.id}`}
                                    control={control}
                                    render={({ field: input }) =>
                                        field.type === 'boolean' ? (
                                            <Switcher
                                                checked={Boolean(input.value)}
                                                onChange={input.onChange}
                                            />
                                        ) : (
                                            <Input
                                                {...input}
                                                value={String(
                                                    input.value ?? '',
                                                )}
                                                type={
                                                    field.type === 'number'
                                                        ? 'number'
                                                        : field.type === 'date'
                                                          ? 'date'
                                                          : 'text'
                                                }
                                                textArea={
                                                    field.type === 'textarea'
                                                }
                                            />
                                        )
                                    }
                                />
                            </FormItem>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
