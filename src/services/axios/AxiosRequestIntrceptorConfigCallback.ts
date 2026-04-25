import Cookies from 'js-cookie'
import type { InternalAxiosRequestConfig } from 'axios'
import { useSessionUser } from '@/store/authStore'

const AxiosRequestIntrceptorConfigCallback = (
    config: InternalAxiosRequestConfig,
) => {
    config.withCredentials = true

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

    return config
}

export default AxiosRequestIntrceptorConfigCallback
