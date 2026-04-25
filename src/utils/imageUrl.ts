import appConfig from '@/configs/app.config'

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value)
}

function joinUrl(base: string, path: string): string {
    const normalizedBase = base.replace(/\/+$/, '')
    const normalizedPath = path.replace(/^\/+/, '')
    return `${normalizedBase}/${normalizedPath}`
}

export function resolveImageUrl(
    value: string | null | undefined,
): string | undefined {
    const raw = typeof value === 'string' ? value.trim() : ''
    if (!raw) return undefined

    if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw
    if (isAbsoluteUrl(raw)) return raw

    const base = (appConfig.urlImage || '').trim()
    if (!base) return raw

    return joinUrl(base, raw)
}

