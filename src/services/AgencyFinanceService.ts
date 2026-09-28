import ApiService from './ApiService'
import AxiosBase from './axios/AxiosBase'

export type FinanceInvoice = {
    id: number
    reservation_id: number
    number: string
    customer_name: string
    issued_at: string
    currency: string
    subtotal: string
    discount: string
    tax: string
    total: string
    payment_status: 'paid' | 'unpaid'
    member_amount: string
    agency_amount: string
    member_share_percent: string
    member: { id: number; name: string } | null
}

export type FinanceExpense = {
    id: number
    expense_date: string
    category: string
    description: string
    amount: string
    currency: string
}

export type FinanceShare = {
    service_id: number
    service_name: string
    member_id: number
    member_name: string
    member_percent: string | null
}

export type FinanceOverview = {
    month: string
    totals: Array<{ currency: string; invoices: number; subtotal: string; discounts: string; taxes: string; revenue: string; member_payouts: string; agency_share: string; collected: string }>
    expense_totals: Array<{ currency: string; total: string }>
    members: Array<{ member_id: number | null; member_name: string | null; currency: string; jobs: number; net_services: string; discounts: string; member_payout: string; agency_share: string }>
    invoices: FinanceInvoice[]
    expenses: FinanceExpense[]
    awaiting_invoice: Array<{ id: number; customer_name: string; date: string; status: string; service: { title: string }; member: { name: string } | null }>
}

const base = (agencySlug: string) => `/my-agencies/${encodeURIComponent(agencySlug)}/finance`

export async function getFinanceOverview(agencySlug: string, month: string) {
    return ApiService.fetchDataWithAxios<{ data: FinanceOverview }>({ url: `${base(agencySlug)}/overview`, params: { month } })
}

export async function getFinanceShares(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: FinanceShare[] }>({ url: `${base(agencySlug)}/shares` })
}

export async function saveFinanceShare(agencySlug: string, data: { service_id: number; member_id: number; member_percent: number }) {
    return ApiService.fetchDataWithAxios({ url: `${base(agencySlug)}/shares`, method: 'post', data })
}

export async function addFinanceExpense(agencySlug: string, data: { expense_date: string; category: string; description: string; amount: number; currency: string }) {
    return ApiService.fetchDataWithAxios({ url: `${base(agencySlug)}/expenses`, method: 'post', data })
}

export async function openFinanceInvoicePdf(agencySlug: string, reservationId: number) {
    const response = await AxiosBase.get(`/my-agencies/${encodeURIComponent(agencySlug)}/reservations/${reservationId}/invoice/pdf`, { responseType: 'blob' })
    const objectUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    window.open(objectUrl, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}
