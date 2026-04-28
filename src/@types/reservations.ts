import type { Booking } from '@/@types/booking'

export type ReservationDailyCount = {
    date: string
    count: number
}

export type PaginatedCollection<T> = {
    data: T[]
    meta?: {
        current_page?: number
        last_page?: number
        per_page?: number
        total?: number
    }
    links?: unknown
}

export type AgencyReservationsV2Response = {
    view: 'month' | 'day'
    from: string
    to: string
    daily_counts: ReservationDailyCount[]
    reservations: PaginatedCollection<Booking> | null
}

