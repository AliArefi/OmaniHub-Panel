import Cookies from 'js-cookie'
import type { InternalAxiosRequestConfig } from 'axios'
import { useSessionUser } from '@/store/authStore'
import { getActiveLocale } from '@/utils/localization'

const AxiosRequestIntrceptorConfigCallback = (
    config: InternalAxiosRequestConfig,
) => {
    config.withCredentials = true
    const locale = getActiveLocale()
    config.headers['X-Locale'] = locale
    config.headers['Accept-Language'] = locale

    const accessToken = useSessionUser.getState().session.accessToken
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    const method = (config.method || 'get').toLowerCase()
    if (!['get', 'head', 'options'].includes(method)) {
        const csrf = Cookies.get('oh_csrf')
        if (csrf) {
            config.headers['X-CSRF-Token'] = csrf
        }
    }

    if (!config.params || typeof config.params !== 'object') {
        config.params = { locale }
    } else if (!('locale' in config.params)) {
        config.params = { ...config.params, locale }
    }

    return config
}

export default AxiosRequestIntrceptorConfigCallback
