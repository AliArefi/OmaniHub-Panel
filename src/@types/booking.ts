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
    note: string | null
    status: 'pending' | 'confirmed' | 'cancelled'
    pricing_type: 'fixed' | 'coordination' | 'member_based'
    pricing_status: 'needs_quote' | 'priced'
    quoted_price: number | null
    final_price: number | null
    currency: string | null
    created_at: string | null
}
