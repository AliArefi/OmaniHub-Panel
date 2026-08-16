import { useEffect, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Upload from '@/components/ui/Upload'
import Button from '@/components/ui/Button'
import { HiOutlinePhotograph } from 'react-icons/hi'
import { TbTrash } from 'react-icons/tb'

type ImageUploadFieldProps = {
    /** Currently-saved image URL from the server (already absolute — the
     * admin API resources resolve these via Model::resolvePublicAssetUrl()
     * before sending them). */
    existingUrl?: string | null
    /** Called with the newly-picked File, or null when `allowRemove` is used
     * to explicitly clear the image. Most admin forms only ever replace an
     * image when a new file is chosen (the underlying controllers have no
     * "remove" affordance — they keep the existing file if none is
     * uploaded), so `allowRemove` defaults to off; only turn it on for
     * fields whose endpoint actually supports clearing (e.g. General
     * settings' remove_header_logo). */
    onChange: (file: File | null) => void
    shape?: 'circle' | 'round' | 'square'
    size?: number
    accept?: string
    disabled?: boolean
    allowRemove?: boolean
}

/**
 * Pairs Avatar (existing-image preview) with Upload (pick a replacement) —
 * the theme ships no upload component that is aware of an existing
 * server-hosted image (Upload only ever handles raw File objects), so every
 * "show current logo/icon/banner, let the admin replace it" field needs
 * this pairing. Mirrors the hand-rolled pattern in
 * src/views/profile/components/SettingsProfile.tsx, extracted here so admin
 * forms (and future ones) don't each reimplement the blob-URL bookkeeping.
 */
function ImageUploadField(props: ImageUploadFieldProps) {
    const {
        existingUrl,
        onChange,
        shape = 'square',
        size = 90,
        accept = 'image/*',
        disabled,
        allowRemove = false,
    } = props

    const [previewUrl, setPreviewUrl] = useState<string | undefined>(
        existingUrl ?? undefined,
    )

    useEffect(() => {
        setPreviewUrl((prev) => {
            if (prev && prev.startsWith('blob:')) {
                URL.revokeObjectURL(prev)
            }
            return existingUrl ?? undefined
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingUrl])

    useEffect(() => {
        return () => {
            setPreviewUrl((prev) => {
                if (prev && prev.startsWith('blob:')) {
                    URL.revokeObjectURL(prev)
                }
                return prev
            })
        }
    }, [])

    return (
        <div className="flex items-center gap-4">
            <Avatar
                size={size}
                shape={shape}
                className="border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                icon={<HiOutlinePhotograph />}
                src={previewUrl}
            />
            <div className="flex items-center gap-2">
                <Upload
                    showList={false}
                    uploadLimit={1}
                    accept={accept}
                    disabled={disabled}
                    onChange={(files) => {
                        const file = files[0]
                        if (!file) return

                        const nextPreview = URL.createObjectURL(file)
                        setPreviewUrl((prev) => {
                            if (prev && prev.startsWith('blob:')) {
                                URL.revokeObjectURL(prev)
                            }
                            return nextPreview
                        })
                        onChange(file)
                    }}
                >
                    <Button type="button" size="sm" disabled={disabled}>
                        Upload
                    </Button>
                </Upload>
                {allowRemove && previewUrl && (
                    <Button
                        type="button"
                        size="sm"
                        icon={<TbTrash />}
                        disabled={disabled}
                        onClick={() => {
                            setPreviewUrl((prev) => {
                                if (prev && prev.startsWith('blob:')) {
                                    URL.revokeObjectURL(prev)
                                }
                                return undefined
                            })
                            onChange(null)
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default ImageUploadField
