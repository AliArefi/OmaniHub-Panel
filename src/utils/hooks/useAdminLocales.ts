import useSWR from 'swr'
import { apiGetAdminLocales } from '@/services/admin/AdminMetaService'

/**
 * Data-driven locale list for the admin content editors — mirrors what
 * config('app.locales') / config('app.locale_meta') drive on the Blade side
 * (resources/views/admin/includes/localized-fields.blade.php) so the React
 * tabs never hard-code 'ar'/'en'.
 */
function useAdminLocales() {
    const { data, isLoading } = useSWR('admin-locales', apiGetAdminLocales, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
    })

    return {
        locales: data?.locales ?? {},
        localeMeta: data?.locale_meta ?? {},
        fallbackLocale: data?.fallback_locale ?? 'ar',
        isLoading,
    }
}

export default useAdminLocales
