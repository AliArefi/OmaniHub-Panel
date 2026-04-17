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
    slug: string | null
    icon: string | null
    image: string | null
}

export type CreateNewAgencyRequest = {
    title: string
    service_id: number | null
    about_text: string
}

export type CreateNewAgencyResponse = {
    message: string
    success: boolean
    data: {
        id: number
        slug: string
    }
}

export type CreateAgencyServiceRequest = {
    agency_id: number
    service_id?: number
    agency_service_category_id: number
    title?: string
    sub_title: string
    estimate_time: number
    price: number
    body?: string
}

export type CreateAgencyServiceResponse = {
    message: string
    success: boolean
    data: {
        id: number
        slug: string
    }
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
