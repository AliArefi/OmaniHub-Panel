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
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import {
    apiCmsEntryAction,
    apiCreateCmsEntry,
    apiGetCmsEntry,
    apiGetCmsCollection,
    apiGetCmsTypes,
    apiUpdateCmsEntry,
    type CmsContentType,
    type CmsCustomField,
    type CmsLocale,
    type CmsCollectionItem,
    type CmsTranslation,
} from '@/services/admin/AdminCmsService'
import type { LocalizedFieldDescriptor } from '@/components/admin/LocalizedFieldsTabs'
import type { Path } from 'react-hook-form'

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
    is_system: boolean
    category_ids: number[]
    primary_category_id: number | null
    tag_ids: number[]
    translations: Record<CmsLocale, FlatTranslation>
}
type TaxonomyOption = { value: number; label: string }
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
    const { data: categoriesResponse } = useSWR('cms-categories', () =>
        apiGetCmsCollection('categories'),
    )
    const { data: tagsResponse } = useSWR('cms-tags', () =>
        apiGetCmsCollection('tags'),
    )
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
    const {
        control,
        handleSubmit,
        reset,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            featured: false,
            is_system: false,
            category_ids: [],
            primary_category_id: null,
            tag_ids: [],
            translations: { ar: emptyTranslation(), en: emptyTranslation() },
        },
    })

    useEffect(() => {
        if (!entryResponse?.data) return
        reset({
            featured: entryResponse.data.featured,
            is_system: entryResponse.data.is_system,
            category_ids:
                entryResponse.data.categories?.map(({ id }) => id) ?? [],
            primary_category_id:
                entryResponse.data.categories?.find(
                    (category) => category.is_primary,
                )?.id ?? null,
            tag_ids: entryResponse.data.tags?.map(({ id }) => id) ?? [],
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
        reset({
            featured: false,
            is_system: false,
            category_ids: [],
            primary_category_id: null,
            tag_ids: [],
            translations,
        })
    }, [contentType, customFields, isEditing, reset])

    const serialize = (values: FormValues) => ({
        featured: values.featured,
        category_ids: values.category_ids,
        primary_category_id: values.category_ids.includes(
            values.primary_category_id ?? -1,
        )
            ? values.primary_category_id
            : null,
        tag_ids: values.tag_ids,
        ...(typeKey === 'page' ? { is_system: values.is_system } : {}),
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

    const onSubmit = async (
        values: FormValues,
        workflow?: 'publish' | 'unpublish',
    ) => {
        clearErrors()
        setSubmitting(true)
        try {
            const payload = serialize(values)
            let entryId = Number(id)
            if (isEditing) {
                await apiUpdateCmsEntry(entryId, payload)
            } else {
                const created = await apiCreateCmsEntry(
                    typeKey,
                    payload.translations as Partial<
                        Record<CmsLocale, CmsTranslation>
                    >,
                    typeKey === 'page'
                        ? {
                              is_system: values.is_system,
                              featured: values.featured,
                              category_ids: payload.category_ids,
                              primary_category_id: payload.primary_category_id,
                              tag_ids: payload.tag_ids,
                          }
                        : {
                              featured: values.featured,
                              category_ids: payload.category_ids,
                              primary_category_id: payload.primary_category_id,
                              tag_ids: payload.tag_ids,
                          },
                )
                entryId = created.data.id
            }
            if (workflow) {
                await apiCmsEntryAction(entryId, workflow)
            }
            toast.push(
                <Notification
                    type="success"
                    title={workflow === 'publish' ? 'Published' : 'Saved'}
                >
                    CMS entry {workflow === 'publish' ? 'published' : 'saved'}{' '}
                    successfully.
                </Notification>,
            )
            navigate(`/admin/cms/${type}`)
        } catch (error) {
            const response = (
                error as {
                    response?: {
                        data?: {
                            message?: string
                            errors?: Record<string, string[]>
                        }
                    }
                }
            ).response?.data
            const validationErrors = response?.errors ?? {}
            Object.entries(validationErrors).forEach(([field, messages]) => {
                if (field.startsWith('translations.')) {
                    setError(field as Path<FormValues>, {
                        type: 'server',
                        message: messages[0],
                    })
                }
            })
            const message =
                Object.values(validationErrors)[0]?.[0] ??
                response?.message ??
                'Check required Arabic fields and try again.'
            toast.push(
                <Notification type="danger" title="Failed to save">
                    {message}
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
            <Form onSubmit={handleSubmit((values) => onSubmit(values))}>
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
                                errors={errors}
                            />
                            {typeKey === 'post' && (
                                <PostTaxonomyFields
                                    control={control}
                                    categories={taxonomyOptions(
                                        categoriesResponse?.data,
                                    )}
                                    tags={taxonomyOptions(tagsResponse?.data)}
                                />
                            )}
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
                            {typeKey === 'page' && (
                                <FormItem
                                    label="System page"
                                    extra="System pages are protected from trash and permanent deletion."
                                >
                                    <Controller
                                        name="is_system"
                                        control={control}
                                        render={({ field }) => (
                                            <Switcher
                                                checked={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                </FormItem>
                            )}
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
                                {entryResponse?.data.status !== 'published' && (
                                    <Button
                                        type="button"
                                        loading={submitting}
                                        onClick={handleSubmit((values) =>
                                            onSubmit(values, 'publish'),
                                        )}
                                    >
                                        Publish
                                    </Button>
                                )}
                                {id &&
                                    entryResponse?.data.status ===
                                        'published' && (
                                        <Button
                                            type="button"
                                            loading={submitting}
                                            onClick={handleSubmit((values) =>
                                                onSubmit(values, 'unpublish'),
                                            )}
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
                                    onChanged={async () => {
                                        await mutateEntry()
                                    }}
                                />
                            )}
                        </AdaptiveCard>
                    </div>
                </div>
            </Form>
        </Container>
    )
}

function taxonomyOptions(
    items: CmsCollectionItem[] | { data: CmsCollectionItem[] } | undefined,
): TaxonomyOption[] {
    const collection = Array.isArray(items) ? items : (items?.data ?? [])

    return collection.map((item) => ({
        value: item.id,
        label:
            item.translations?.ar?.name ??
            item.translations?.en?.name ??
            `#${item.id}`,
    }))
}

function PostTaxonomyFields({
    control,
    categories,
    tags,
}: {
    control: ReturnType<typeof useForm<FormValues>>['control']
    categories: TaxonomyOption[]
    tags: TaxonomyOption[]
}) {
    return (
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <h5 className="mb-4">Categories and tags</h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormItem label="Categories" className="md:col-span-2">
                    <Controller
                        name="category_ids"
                        control={control}
                        render={({ field }) => (
                            <Select<TaxonomyOption, true>
                                isMulti
                                options={categories}
                                placeholder="Select categories"
                                value={categories.filter((option) =>
                                    field.value.includes(option.value),
                                )}
                                onChange={(options) =>
                                    field.onChange(
                                        (options ?? []).map(
                                            (option) => option.value,
                                        ),
                                    )
                                }
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Primary category">
                    <Controller
                        name="primary_category_id"
                        control={control}
                        render={({ field }) => (
                            <Select<TaxonomyOption>
                                isClearable
                                options={categories}
                                placeholder="Select primary category"
                                value={
                                    categories.find(
                                        (option) =>
                                            option.value === field.value,
                                    ) ?? null
                                }
                                onChange={(option) =>
                                    field.onChange(option?.value ?? null)
                                }
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Tags">
                    <Controller
                        name="tag_ids"
                        control={control}
                        render={({ field }) => (
                            <Select<TaxonomyOption, true>
                                isMulti
                                options={tags}
                                placeholder="Select tags"
                                value={tags.filter((option) =>
                                    field.value.includes(option.value),
                                )}
                                onChange={(options) =>
                                    field.onChange(
                                        (options ?? []).map(
                                            (option) => option.value,
                                        ),
                                    )
                                }
                            />
                        )}
                    />
                </FormItem>
            </div>
        </div>
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
