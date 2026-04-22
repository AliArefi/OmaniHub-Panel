export interface Booking {
    id: string
    customer: {
        name: string
        phone: string
        email: string
        avatar?: string
    }
    service: {
        id: string
        title: string
        price: number
    }
    crew?: {
        id: string
        name: string
        avatar?: string
    }
    date: string
    time: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    totalAmount: number
    paymentMethod: string
    notes?: string
    createdAt: string
}
