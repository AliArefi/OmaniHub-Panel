export type Agency = {
    id: number
    title: string
    category: string
    logo: string
    status: string
    url: string
    created_at: string
}

export type Services = {
    id: number
    name: string
    slug: string
    icon: string | null
    image: string | null
}

export type CreateNewAgencyRequest = {
    title: string,
    service_id: number | null,
    about_text: string
}

export type CreateNewAgencyResponse = {
    message: string,
    success: boolean
}