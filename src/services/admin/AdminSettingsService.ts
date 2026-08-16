import ApiService from '@/services/ApiService'

export type PerLocaleSettingsGroup =
    | 'general'
    | 'contact-us'
    | 'about-us'
    | 'about'
    | 'faq'
    | 'store'

export type SingletonSettingsGroup =
    | 'agency-workflow'
    | 'otp'
    | 'notifications'
    | 'messaging-providers'

export function apiGetPerLocaleSettings<T = Record<string, unknown>>(
    group: PerLocaleSettingsGroup,
    locale?: string,
) {
    return ApiService.fetchDataWithAxios<{ data: T; locale: string }>({
        url: `/admin/settings/${group}`,
        params: locale ? { locale } : undefined,
    })
}

export function apiUpdatePerLocaleSettings(
    group: PerLocaleSettingsGroup,
    payload: FormData | Record<string, unknown>,
    locale?: string,
) {
    const isFormData = payload instanceof FormData
    return ApiService.fetchDataWithAxios<{ data: unknown; locale: string }>({
        url: `/admin/settings/${group}`,
        method: 'post',
        params: locale ? { locale } : undefined,
        data: payload,
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
}

export function apiGetSingletonSettings<T = Record<string, unknown>>(
    group: SingletonSettingsGroup,
) {
    return ApiService.fetchDataWithAxios<Record<string, unknown> & { data: T }>({
        url: `/admin/settings/singleton/${group}`,
    })
}

export function apiUpdateSingletonSettings(
    group: SingletonSettingsGroup,
    payload: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<Record<string, unknown>>({
        url: `/admin/settings/singleton/${group}`,
        method: 'put',
        data: payload,
    })
}
