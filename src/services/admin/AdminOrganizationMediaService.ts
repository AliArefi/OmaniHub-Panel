import ApiService from '@/services/ApiService'

export type AdminOrganizationMediaCollection =
    | 'organization_hero_images'
    | 'organization_about_images'
    | 'organization_gallery_images'

export type AdminOrganizationMedia = {
    id: number
    collection_name: AdminOrganizationMediaCollection
    name: string
    file_name: string
    mime_type: string
    url: string
    order_column: number
    is_featured: boolean
    title: string | null
    caption: string | null
    alt: string | null
}

function url(organizationSlug: string, mediaId?: number) {
    const base = `/admin/organizations/${encodeURIComponent(organizationSlug)}/media`
    return mediaId ? `${base}/${mediaId}` : base
}

export function apiGetAdminOrganizationMedia(organizationSlug: string) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationMedia[] }>({
        url: url(organizationSlug),
    })
}

export function apiUploadAdminOrganizationMedia(organizationSlug: string, formData: FormData) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationMedia }>({
        url: url(organizationSlug),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export function apiUpdateAdminOrganizationMedia(
    organizationSlug: string,
    mediaId: number,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminOrganizationMedia }>({
        url: url(organizationSlug, mediaId),
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminOrganizationMedia(organizationSlug: string, mediaId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: url(organizationSlug, mediaId),
        method: 'delete',
    })
}
