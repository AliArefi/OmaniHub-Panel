let loadPromise: Promise<void> | null = null

export const loadGisClient = (): Promise<void> => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('GIS can only be loaded in the browser.'))
    }

    if (window.google?.accounts?.id) {
        return Promise.resolve()
    }

    if (loadPromise) {
        return loadPromise
    }

    loadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            'script[data-google-gis="true"]',
        )

        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true })
            existing.addEventListener('error', () => reject(new Error('Failed to load Google GIS.')), { once: true })
            return
        }

        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.dataset.googleGis = 'true'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Google GIS.'))
        document.head.appendChild(script)
    })

    return loadPromise
}

