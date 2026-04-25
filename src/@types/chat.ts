export type ChatThreadScope = 'upcoming' | 'past' | 'all'

export type ChatThread = {
    id: number
    reservation_id: number
    agency_id: number
    last_message_id: number | null
    last_message_at: string | null
    has_unread: boolean
    reservation: {
        id: number
        date: string
        start_time: string
        end_time: string
        status: string
        note: string | null
    } | null
    customer: {
        user_id: number | null
        name: string | null
        mobile: string | null
        email?: string | null
    }
    agency: {
        id: number
        slug: string
        title: string
    } | null
    service: {
        id: number
        title: string
    } | null
    member: {
        id: number
        name: string
    } | null
    last_message: {
        id: number
        sender_user_id: number | null
        body: string
        created_at: string | null
    } | null
}

export type ChatMessage = {
    id: number
    thread_id: number
    sender_user_id: number | null
    body: string
    created_at: string | null
}

