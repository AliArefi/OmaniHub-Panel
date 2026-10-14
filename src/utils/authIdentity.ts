import type { AuthIdentity } from '@/components/shared/AuthIdentityInput'
import { extractDigits } from '@/utils/normalizeDigits'

export function identityPayload(value: AuthIdentity) {
    return value.mode === 'email'
        ? { email: value.email.trim() }
        : { mobile: `+${extractDigits(value.countryCode)}${extractDigits(value.localNumber)}` }
}

export function safeAuthReturnPath(candidate?: string | null): string | undefined {
    if (!candidate?.startsWith('/') || candidate.includes('\\') || [...candidate].some((character) => character.charCodeAt(0) < 32)) return undefined
    try {
        const path = decodeURIComponent(candidate.split(/[?#]/)[0])
        if (path.startsWith('//') || path.includes('\\')) return undefined
        return candidate
    } catch { return undefined }
}
