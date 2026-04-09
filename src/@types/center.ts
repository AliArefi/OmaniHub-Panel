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

export type CreateMemberAgencyRequest = {
    name: string
    position: string
    image: string | null
}

export type CreateNewMemberAgencyResponse = {
    message: string
    success: boolean
    data: {
        id: number
    }
}

export type MemberWorkingHoursRequest = {
    days: []
}

export type MemberWorkingHoursResponse = {
    message: string
    success: boolean
    member_id: number
    days: []
}
