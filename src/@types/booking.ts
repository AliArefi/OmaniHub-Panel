export interface Booking {
    id: number
    agency: {
        id: number
        slug: string
        title: string
        logo?: {
            thumb?: string | null
            original?: string | null
        } | null
    } | null
    service: {
        id: number
        title: string
    } | null
    member: {
        id: number
        name: string
    } | null
    customer: {
        name: string | null
        mobile: string | null
        user: {
            id: number
            name: string | null
            email: string | null
            avatar?: string | null
        } | null
    }
    date: string
    start_time: string
    end_time: string
    status: 'pending' | 'confirmed' | 'cancelled'
    created_at: string | null
}
