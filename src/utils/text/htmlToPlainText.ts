export function htmlToPlainText(input: string): string {
    if (!input) return ''

    const html = String(input)
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/<\s*\/\s*p\s*>/gi, '\n')
        .replace(/<\s*\/\s*div\s*>/gi, '\n')

    const text = (() => {
        if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
            return html.replace(/<[^>]*>/g, ' ')
        }

        try {
            const doc = new DOMParser().parseFromString(html, 'text/html')
            return doc.body?.textContent ?? ''
        } catch {
            return html.replace(/<[^>]*>/g, ' ')
        }
    })()

    return text
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}

