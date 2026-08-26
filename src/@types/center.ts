export type Agency = {
    id: number
    title: string
    slug: string
    category: string
    logo: string
    status: string
    url: string
    created_at: string
}

export type Services = {
    id: number
    name: string
    slug: string | null
    icon: string | null
    image: string | null
    children?: Services[]
}

export type CreateNewAgencyRequest = {
    title: string
    service_id: number | null
    about_text: string
    about_us: string
}

export type CreateNewAgencyResponse = {
    message: string
    success: boolean
    data: {
        id: number
        slug: string
    }
}

export type MyAgencyDetails = {
    id: number
    title: string
    logo: string | null
    banner: string | null
    about_text: string | null
    about_us: string | null
    service: {
        id: number
        name: string
    }
    city: {
        id: number
    }
    latitude: string
    longitude: string
    address: string
    facebook: string
    instagram: string
    linkedin: string
    phone: string
    website: string
    youtube: string
    h1: string
    meta_description: string
}

export type MyAgencyService = {
    id: number 
    title: string
    slug: string
    pricing_type: 'fixed' | 'coordination' | 'member_based'
    needs_coordination: boolean
    price: number | null
    price_min?: number | null
    price_max?: number | null
    estimate_time: number
    duration_unit: 'minute' | 'hour' | 'day' | 'week' | 'month'
    duration_label: string
    estimate_time_minutes: number
    body: string | null
    service: { id: number; name: string } | null
}

export type CreateAgencyServiceRequest = {
    agency_id: number
    service_id?: number
    agency_service_category_id?: number | null
    title?: string
    sub_title: string
    estimate_time: number
    duration_unit?: 'minute' | 'hour' | 'day' | 'week' | 'month'
    pricing_type: 'fixed' | 'coordination' | 'member_based'
    price?: number | null
    body?: string
}

export type SyncDemoAgencyServicesRequest = {
    agency_id: number
    services: Array<{
        service_id: number
        enabled: boolean
        title?: string
        sub_title?: string
        estimate_time?: number
        duration_unit?: 'minute' | 'hour' | 'day' | 'week' | 'month'
        pricing_type?: 'fixed' | 'coordination' | 'member_based'
        price?: number | null
        body?: string
        agency_service_category_id?: number | null
    }>
}

export type CreateAgencyServiceResponse = {
    message: string
    success: boolean
    data: {
        id: number
        slug: string
    }
}

export type SyncDemoAgencyServicesResponse = {
    message: string
    success: boolean
    data: MyAgencyService[]
}

export type CreateMemberAgencyRequest = {
    name: string
    position: string
    image: File
}

export type CreateNewMemberAgencyResponse = {
    message: string
    success: boolean
    data: {
        id: number
    }
}

export type TeamMemberApiResponse = {
    id: number
    name: string
    position: string
    image: string | null
}

export type MemberWorkingHoursRequest = {
    days: Array<{
        day_of_week: number
        is_closed?: boolean
        slots?: Array<{
            start: string
            end: string
            is_active?: boolean
        }>
    }>
}

export type MemberWorkingHoursResponse = {
    message: string
    success: boolean
    member_id: number
    days: Array<{
        day_of_week: number
        is_closed: boolean
        slots: Array<{
            start: string
            end: string
        }>
    }>
}

export type Cities = {
    id: number
    name: string
}

export type UpdateAgencyRequest = {
    logo?: File | null
    banner?: File | null
    latitude?: string | undefined
    longitude?: string | undefined
    city_id?: number | undefined
    phone?: string | undefined
    website?: string | undefined
    address?: string | undefined
    instagram?: string | undefined
    youtube?: string | undefined
    linkedin?: string | undefined
    facebook?: string | undefined
    h1?: string | undefined
    meta_description?: string | undefined
}

export type RequestMyAgencyGallery = {
    alt: string
    agency_id: number
    image: File
}

export type AgencyMediaItem = {
    id: number
    uuid: string
    collection: string
    type: 'image' | 'video' | 'document' | 'file'
    name: string | null
    file_name: string
    mime_type: string
    size_bytes: number
    url: string
    thumb_url: string | null
    sort_order: number | null
    is_featured: boolean
    alt: string | null
    title: string | null
    caption: string | null
    seo: {
        title: string | null
        description: string | null
        keywords: string | null
    }
    created_at: string | null
}

export type MyAgencyMediaResponse = {
    featured_media: AgencyMediaItem | null
    public_images: AgencyMediaItem[]
    gallery_images: AgencyMediaItem[]
    gallery_videos: AgencyMediaItem[]
    documents: AgencyMediaItem[]
}

// export type CreateNewAgencyResponse = {
//     message: string
//     success: boolean
//     data: {
//         id: number
//         slug: string
//     }
// }
