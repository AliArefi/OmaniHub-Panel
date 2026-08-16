import ApiService from '@/services/ApiService'

export type LocaleMeta = {
    direction: 'ltr' | 'rtl'
    native: string
    regional: string
}

export type AdminLocalesResponse = {
    locales: Record<string, string>
    locale_meta: Record<string, LocaleMeta>
    fallback_locale: string
}

export function apiGetAdminLocales() {
    return ApiService.fetchDataWithAxios<AdminLocalesResponse>({
        url: '/admin/meta/locales',
    })
}
