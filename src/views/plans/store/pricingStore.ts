import { create } from 'zustand'
import type { BillingInterval } from '@/services/BillingService'

export type PaymentCycle = Extract<BillingInterval, 'monthly' | 'annually'>

export type SelectedPlan = {
    id: number
    name: string
    interval: BillingInterval
    amountMinor: number
    currency: string
}

type PricingState = {
    paymentCycle: PaymentCycle
    paymentDialog: boolean
    selectedPlan: Partial<SelectedPlan>
}

type PricingAction = {
    setPaymentCycle: (payload: PaymentCycle) => void
    setPaymentDialog: (payload: boolean) => void
    setSelectedPlan: (payload: Partial<SelectedPlan>) => void
}

const initialState: PricingState = {
    paymentCycle: 'monthly',
    paymentDialog: false,
    selectedPlan: {},
}

export const usePricingStore = create<PricingState & PricingAction>((set) => ({
    ...initialState,
    setPaymentCycle: (payload) => set(() => ({ paymentCycle: payload })),
    setPaymentDialog: (payload) => set(() => ({ paymentDialog: payload })),
    setSelectedPlan: (payload) => set(() => ({ selectedPlan: payload })),
}))
