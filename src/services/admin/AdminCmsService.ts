import ApiService from '@/services/ApiService'

export type CmsLocale = 'ar' | 'en'
export type CmsTranslation = {
    title: string
    slug: string
    excerpt: string
    content_html: string
    custom_fields?: Record<string, unknown>
    seo: {
        title?: string
        description?: string
        canonical?: string
        robots?: string
    }
}
export type CmsEntry = {
    id: number
    type: string
    title?: string
    slug?: string
    status: string
    featured: boolean
    is_system: boolean
    comments_count?: number
    published_at?: string | null
    scheduled_for?: string | null
    translations?: Partial<Record<CmsLocale, CmsTranslation>>
    media?: Partial<Record<CmsLocale, CmsMediaItem[]>>
}

export type CmsMediaItem = {
    id: number
    url: string
    name?: string
    file_name?: string
    mime_type?: string
    size?: number
    collection: 'featured_image' | 'gallery' | 'attachments'
    meta?: {
        alt?: string
        title?: string
        caption?: string
        visibility?: 'public' | 'private' | 'admin_only'
    }
}

export type CmsCustomField = {
    id: string
    type: 'text' | 'textarea' | 'number' | 'boolean' | 'date'
    required?: boolean
}

export type CmsContentType = {
    id: number
    key: string
    is_system: boolean
    settings?: { supports?: string[]; custom_fields?: CmsCustomField[] }
    translations?: Record<
        string,
        {
            name?: string
            description?: string
            custom_fields?: Record<
                string,
                { label?: string; default?: unknown }
            >
        }
    >
}

export const apiGetCmsEntries = (type: string) =>
    ApiService.fetchDataWithAxios<{ data: CmsEntry[] }>({
        url: '/admin/cms/entries',
        params: { type, per_page: 100 },
    })

export const apiGetCmsEntry = (id: number) =>
    ApiService.fetchDataWithAxios<{ data: CmsEntry }>({
        url: `/admin/cms/entries/${id}`,
    })

export const apiGetCmsTypes = () =>
    ApiService.fetchDataWithAxios<{ data: CmsContentType[] }>({
        url: '/admin/cms/types',
    })

export const apiSaveCmsType = (
    id: number | null,
    data: Record<string, unknown>,
) =>
    ApiService.fetchDataWithAxios({
        url: id ? `/admin/cms/types/${id}/update` : '/admin/cms/types',
        method: 'post',
        data,
    })

export const apiCreateCmsEntry = (
    type: string,
    translations: Partial<Record<CmsLocale, CmsTranslation>>,
    shared: { is_system?: boolean; featured?: boolean } = {},
) =>
    ApiService.fetchDataWithAxios<{ data: { id: number } }>({
        url: '/admin/cms/entries',
        method: 'post',
        data: { type, translations, ...shared },
    })

export const apiUpdateCmsEntry = (id: number, data: Record<string, unknown>) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/cms/entries/${id}/update`,
        method: 'post',
        data,
    })

export const apiCmsEntryAction = (
    id: number,
    action: 'publish' | 'unpublish' | 'trash' | 'restore' | 'delete',
) => {
    const allowedActions = new Set([
        'publish',
        'unpublish',
        'trash',
        'restore',
        'delete',
    ])
    if (!allowedActions.has(action)) {
        throw new Error('Invalid CMS workflow action.')
    }

    return ApiService.fetchDataWithAxios({
        url: `/admin/cms/entries/${id}/${action}`,
        method: 'post',
    })
}

export const apiUploadCmsMedia = (
    id: number,
    locale: CmsLocale,
    collection: 'featured_image' | 'gallery' | 'attachments',
    files: File[] | FileList,
) => {
    const data = new FormData()
    data.append('locale', locale)
    data.append('collection', collection)
    Array.from(files).forEach((file) => data.append('files[]', file))
    return ApiService.fetchDataWithAxios({
        url: `/admin/cms/entries/${id}/media`,
        method: 'post',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const apiUpdateCmsMedia = (
    entryId: number,
    mediaId: number,
    data: Record<string, unknown>,
) =>
    ApiService.fetchDataWithAxios<{ data: CmsMediaItem }>({
        url: `/admin/cms/entries/${entryId}/media/${mediaId}/update`,
        method: 'post',
        data,
    })

export const apiDeleteCmsMedia = (entryId: number, mediaId: number) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/cms/entries/${entryId}/media/${mediaId}/delete`,
        method: 'post',
    })

export const apiReorderCmsMedia = (
    entryId: number,
    locale: CmsLocale,
    ids: number[],
) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/cms/entries/${entryId}/media/reorder`,
        method: 'post',
        data: { locale, ids },
    })

export type CmsCollectionItem = {
    id: number
    key?: string
    is_system?: boolean
    status?: boolean
    comment?: string
    settings?: { supports?: string[]; custom_fields?: CmsCustomField[] }
    translations?: Record<
        string,
        {
            name?: string
            slug?: string
            custom_fields?: Record<
                string,
                { label?: string; default?: unknown }
            >
        }
    >
}

export const apiGetCmsCollection = (resource: string) =>
    ApiService.fetchDataWithAxios<{
        data: CmsCollectionItem[] | { data: CmsCollectionItem[] }
    }>({ url: `/admin/cms/${resource}` })

export const apiCreateCmsCollectionItem = (
    resource: string,
    data: Record<string, unknown>,
) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/cms/${resource}`,
        method: 'post',
        data,
    })

export const apiUpdateCmsCollectionItem = (
    resource: string,
    id: number,
    data: Record<string, unknown>,
) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/cms/${resource}/${id}/update`,
        method: 'post',
        data,
    })

export const apiDeleteCmsCollectionItem = (resource: string, id: number) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/cms/${resource}/${id}/delete`,
        method: 'post',
    })

export const apiModerateCmsComment = (id: number, approved: boolean) =>
    ApiService.fetchDataWithAxios({
        url: `/admin/cms/comments/${id}/update`,
        method: 'post',
        data: { approved },
    })
