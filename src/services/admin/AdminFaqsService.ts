import ApiService from '@/services/ApiService'

export type AdminFaq = {
    id: number
    locale: string
    question: string
    answer: string
    is_active: boolean
    sort_order: number
}

export type AdminFaqParent = 'agencies' | 'organizations' | 'services'

export type AdminFaqPayload = {
    question: string
    answer: string
    locale?: string
    is_active?: boolean
    sort_order?: number
}

function faqsUrl(parent: AdminFaqParent, parentSlug: string, faqId?: number) {
    const base = `/admin/${parent}/${encodeURIComponent(parentSlug)}/faqs`
    return faqId ? `${base}/${faqId}` : base
}

export function apiGetAdminFaqs(
    parent: AdminFaqParent,
    parentSlug: string,
    locale?: string,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminFaq[]; locale: string }>({
        url: faqsUrl(parent, parentSlug),
        params: locale ? { locale } : undefined,
    })
}

export function apiCreateAdminFaq(
    parent: AdminFaqParent,
    parentSlug: string,
    payload: AdminFaqPayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminFaq }>({
        url: faqsUrl(parent, parentSlug),
        method: 'post',
        data: payload,
    })
}

export function apiUpdateAdminFaq(
    parent: AdminFaqParent,
    parentSlug: string,
    faqId: number,
    payload: AdminFaqPayload,
) {
    return ApiService.fetchDataWithAxios<{ data: AdminFaq }>({
        url: faqsUrl(parent, parentSlug, faqId),
        method: 'patch',
        data: payload,
    })
}

export function apiDeleteAdminFaq(
    parent: AdminFaqParent,
    parentSlug: string,
    faqId: number,
) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: faqsUrl(parent, parentSlug, faqId),
        method: 'delete',
    })
}
