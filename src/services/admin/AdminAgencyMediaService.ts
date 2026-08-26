import ApiService from '@/services/ApiService'

export type AdminAgencyMediaCollection =
    | 'agency_public_images'
    | 'agency_gallery_images'
    | 'agency_gallery_videos'
    | 'agency_documents'

export type AdminAgencyMedia = {
    id: number
    collection_name: AdminAgencyMediaCollection
    name: string
    file_name: string
    mime_type: string
    size: number
    url: string
    order_column: number
    is_featured: boolean
    title: string | null
    caption: string | null
    alt: string | null
    seo_title: string | null
    seo_description: string | null
    seo_keywords: string | null
}

function url(agencySlug: string, mediaId?: number) {
    const base = `/admin/agencies/${encodeURIComponent(agencySlug)}/media`
    return mediaId ? `${base}/${mediaId}` : base
}

export function apiGetAdminAgencyMedia(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyMedia[] }>({
        url: url(agencySlug),
    })
}

export function apiUploadAdminAgencyMedia(agencySlug: string, formData: FormData) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyMedia }>({
        url: url(agencySlug),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiUpdateAdminAgencyMedia(
    agencySlug: string,
    mediaId: number,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminAgencyMedia }>({
        url: url(agencySlug, mediaId),
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminAgencyMedia(agencySlug: string, mediaId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(agencySlug, mediaId),
        method: 'delete',
    })
}
