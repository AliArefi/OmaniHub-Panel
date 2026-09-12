import ApiService from './ApiService'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'

type PushConfig = {
    enabled: boolean
    web_config: Record<string, string>
    vapid_key: string
}
let currentToken: string | null = null

export async function syncPushDevice(): Promise<void> {
    if (!(await isSupported()) || !('serviceWorker' in navigator)) return
    const response = await ApiService.fetchDataWithAxios<{ data: PushConfig }>({
        url: '/push/config',
    })
    if (
        !response.data.enabled ||
        (await Notification.requestPermission()) !== 'granted'
    )
        return
    const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
    )
    const app = getApps()[0] ?? initializeApp(response.data.web_config)
    const token = await getToken(getMessaging(app), {
        vapidKey: response.data.vapid_key,
        serviceWorkerRegistration: registration,
    })
    if (!token) return
    currentToken = token
    const storageKey = 'omanihub_push_device_id'
    const deviceId = localStorage.getItem(storageKey) ?? crypto.randomUUID()
    localStorage.setItem(storageKey, deviceId)
    await ApiService.fetchDataWithAxios({
        url: '/push/devices',
        method: 'post',
        data: { token, device_id: deviceId, platform: 'web' },
    })
}

export async function revokeCurrentPushDevice(): Promise<void> {
    if (!currentToken) return
    await ApiService.fetchDataWithAxios({
        url: '/push/devices/revoke',
        method: 'post',
        data: { token: currentToken },
    })
    currentToken = null
}
