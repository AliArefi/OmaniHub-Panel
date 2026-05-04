type FileCategory = 'image' | 'video' | 'document'

type ValidationOptions = {
    category: FileCategory
    maxSizeMb?: number
}

const FILE_RULES: Record<
    FileCategory,
    {
        mimePrefixes?: string[]
        mimeTypes?: string[]
        extensions: string[]
        maxSizeMb: number
    }
> = {
    image: {
        mimePrefixes: ['image/'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        maxSizeMb: 20,
    },
    video: {
        mimePrefixes: ['video/'],
        extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
        maxSizeMb: 20,
    },
    document: {
        mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
        ],
        extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
        maxSizeMb: 20,
    },
}

const isArabic = () => {
    if (typeof document !== 'undefined') {
        const lang = document.documentElement.lang || navigator.language || ''
        return lang.toLowerCase().startsWith('ar')
    }
    return true
}

const localizedMessage = (arabic: string, english: string) =>
    isArabic() ? arabic : english

const getExtension = (fileName: string) => {
    const dotIndex = fileName.lastIndexOf('.')
    return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ''
}

const sanitizeFileName = (fileName: string) => {
    const extension = getExtension(fileName)
    const baseName = fileName.slice(0, fileName.length - extension.length)
    const safeBaseName = baseName
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}\-_]+/gu, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

    return `${safeBaseName || 'file'}${extension}`
}

export const sanitizeSelectedFile = (file: File) => {
    const nextName = sanitizeFileName(file.name)
    if (nextName === file.name) return file

    return new File([file], nextName, {
        type: file.type,
        lastModified: file.lastModified,
    })
}

export const validateSelectedFile = (
    file: File,
    options: ValidationOptions,
): string | null => {
    const rule = FILE_RULES[options.category]
    const maxSizeMb = options.maxSizeMb ?? rule.maxSizeMb
    const fileExtension = getExtension(file.name)
    const normalizedMime = (file.type || '').toLowerCase()

    const mimeMatched =
        rule.mimePrefixes?.some((prefix) => normalizedMime.startsWith(prefix)) ||
        rule.mimeTypes?.includes(normalizedMime)

    const extensionMatched = rule.extensions.includes(fileExtension)

    if (!mimeMatched && !extensionMatched) {
        return localizedMessage(
            'نوع الملف غير مدعوم.',
            'Unsupported file type.',
        )
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
        return localizedMessage(
            `حجم الملف يجب ألا يتجاوز ${maxSizeMb} ميجابايت.`,
            `File size must not exceed ${maxSizeMb} MB.`,
        )
    }

    return null
}

export const prepareValidatedFile = (
    file: File,
    options: ValidationOptions,
): { file: File | null; error: string | null } => {
    const sanitizedFile = sanitizeSelectedFile(file)
    const error = validateSelectedFile(sanitizedFile, options)

    return {
        file: error ? null : sanitizedFile,
        error,
    }
}
