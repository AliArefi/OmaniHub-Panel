import ApiService from './ApiService'

export type CrmCustomer = {
    id: number
    name: string | null
    mobile: string
    user_id: number | null
    last_visit_at: string | null
    points_balance: number
    paid_total: string
    paid_count: number
}

export type CrmSettings = {
    appointment_enabled: boolean
    appointment_hours: number
    winback_enabled: boolean
    winback_days: number
    points_per_omr: number | null
    points_per_omr_discount: number | null
    reminder_channels: string | string[]
    appointment_whatsapp_template?: string | null
    winback_whatsapp_template?: string | null
}

export type CrmCampaign = {
    id: number
    title: string
    segment: string
    code: string | null
    scheduled_at: string
    status: string
    use_count: number
}

const base = (slug: string) => `/my-agencies/${encodeURIComponent(slug)}/crm`

export const getCrmCustomers = (slug: string, params: { q?: string; segment?: string; page?: number }) =>
    ApiService.fetchDataWithAxios<{ data: CrmCustomer[]; meta: { total: number; last_page: number } }>({ url: `${base(slug)}/customers`, params })

export const getCrmCustomer = (slug: string, id: number) =>
    ApiService.fetchDataWithAxios<{ data: { customer: CrmCustomer; reservations: Array<{ id: number; date: string; status: string; service: string; invoice: { total: string; payment_status: string } | null }>; messages: Array<{ id: number; kind: string; channel: string; status: string }>; points: Array<{ id: number; points: number; reason: string }> } }>({ url: `${base(slug)}/customers/${id}` })

export const getCrmSettings = (slug: string) =>
    ApiService.fetchDataWithAxios<{ data: CrmSettings }>({ url: `${base(slug)}/settings` })

export const saveCrmSettings = (slug: string, data: Record<string, unknown>) =>
    ApiService.fetchDataWithAxios<{ data: CrmSettings }>({ url: `${base(slug)}/settings`, method: 'post', data })

export const getCrmCampaigns = (slug: string) =>
    ApiService.fetchDataWithAxios<{ data: { data: CrmCampaign[] } }>({ url: `${base(slug)}/campaigns` })

export const getCrmAudience = (slug: string, segment: string) =>
    ApiService.fetchDataWithAxios<{ data: { count: number; sample: Array<{ id: number; name: string; mobile: string }> } }>({ url: `${base(slug)}/audience`, params: { segment } })

export const createCrmCampaign = (slug: string, data: Record<string, unknown>) =>
    ApiService.fetchDataWithAxios({ url: `${base(slug)}/campaigns`, method: 'post', data })
