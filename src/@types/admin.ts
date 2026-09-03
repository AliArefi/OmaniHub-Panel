export type LocalizedTranslations = Record<string, Record<string, string | null>>

export type AdminService = {
    id: number
    service_id: number | null
    name: string | null
    title: string | null
    slug: string
    status: 'pending' | 'draft' | 'published'
    order_number: number
    featured: boolean
    use_as_filter: boolean
    icon: string | null
    image: string | null
    h1: string | null
    h2: string | null
    body: string | null
    body2: string | null
    meta_description: string | null
    url_pattern: string | null
    city_url_pattern: string | null
    translations: LocalizedTranslations
    created_at: string | null
    updated_at: string | null
    deleted_at: string | null
}

export type AdminServiceTreeOption = { id: number; label: string }

export type AdminOrganization = {
    id: number
    title: string
    slug: string
    status: 'pending' | 'draft' | 'published'
    description: string | null
    phone: string | null
    website: string | null
    address: string | null
    user_id: number | null
    city_id: number | null
    latitude: number | null
    longitude: number | null
    h1: string | null
    meta_title: string | null
    meta_description: string | null
    canonical: string | null
    og_title: string | null
    og_description: string | null
    agencies_count?: number
    owner?: { id: number; name: string; email: string }
    city?: { id: number; name: string }
    translations: LocalizedTranslations
    created_at: string | null
    updated_at: string | null
    deleted_at: string | null
}

export type AdminAgency = {
    id: number
    title: string
    slug: string
    status: 'pending' | 'draft' | 'published'
    logo: string | null
    banner: string | null
    user_id: number | null
    organization_id: number | null
    service_id: number | null
    city_id: number | null
    phone: string | null
    whatsapp: string | null
    website: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
    instagram: string | null
    youtube: string | null
    linkedin: string | null
    facebook: string | null
    canonical: string | null
    h1: string | null
    about_text: string | null
    about_us: string | null
    meta_description: string | null
    top_seller: boolean
    show_in_marketplace: boolean
    fully_verfied: boolean
    services_count?: number | null
    comments_count?: number | null
    organization?: { id: number; title: string }
    service?: { id: number; name: string }
    translations: LocalizedTranslations
    created_at: string | null
    updated_at: string | null
    deleted_at: string | null
}

export type AdminAuthSummary = {
    is_verified: boolean
    verification_label: string
    last_challenge_at: string | null
    failed_attempts: number
    otp_mode: string | null
    rate_limited: boolean
    recent_challenges: Array<Record<string, unknown>>
}

export type AdminUser = {
    id: number
    name: string
    email: string
    mobile: string | null
    avatar: string | null
    bio: string | null
    email_verified_at: string | null
    roles: string[]
    role_ids: number[]
    auth_summary?: AdminAuthSummary
    created_at: string | null
    updated_at: string | null
    deleted_at: string | null
}
