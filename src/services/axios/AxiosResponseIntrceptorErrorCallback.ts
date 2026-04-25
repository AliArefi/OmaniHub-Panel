import { useSessionUser } from '@/store/authStore'
import appConfig from '@/configs/app.config'
import axios from 'axios'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

type AuthMeResponse = {
    authenticated: boolean
    user?: unknown
}

let pendingAuthCheck: Promise<boolean> | null = null

const isAuthenticatedSessionStillValid = async () => {
    if (pendingAuthCheck) {
        return pendingAuthCheck
    }

    pendingAuthCheck = (async () => {
        try {
            const client = axios.create({
                baseURL: appConfig.apiPrefix,
                withCredentials: true,
                timeout: 15000,
            })

            const response = await client.get<AuthMeResponse>('/auth/me')
            return Boolean(response.data?.authenticated)
        } catch {
            return false
        } finally {
            pendingAuthCheck = null
        }
    })()

    return pendingAuthCheck
}

const AxiosResponseIntrceptorErrorCallback = (error: AxiosError) => {
    const { response } = error

    if (!response || !unauthorizedCode.includes(response.status)) {
        return
    }

    const failingUrl = error.config?.url ?? ''
    if (failingUrl.includes('/auth/me')) {
        useSessionUser.getState().setUser({})
        useSessionUser.getState().setAccessToken(null)
        useSessionUser.getState().setSessionSignedIn(false)
        return
    }

    void (async () => {
        const isStillAuthenticated = await isAuthenticatedSessionStillValid()
        if (!isStillAuthenticated) {
            useSessionUser.getState().setUser({})
            useSessionUser.getState().setAccessToken(null)
            useSessionUser.getState().setSessionSignedIn(false)
        }
    })()
}

export default AxiosResponseIntrceptorErrorCallback
