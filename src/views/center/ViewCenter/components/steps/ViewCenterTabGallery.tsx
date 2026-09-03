import { Button, Card, Form, FormItem, Input, toast, Spinner } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { useEffect, useMemo, useState } from 'react'
import { useCreateStore } from '@/context/createStoreContext'
import { useTranslation } from 'react-i18next'
import { apiDeleteMyAgencyMedia, apiGetMyAgencyMedia, apiUploadMyAgencyMedia } from '@/services/CenterService'
import type { AgencyMediaItem } from '@/@types/center'
import { prepareValidatedFile } from '../utils/fileUpload'

export const ViewCenterTabGallery = () => {
    const { t } = useTranslation()
    const { newHojraData } = useCreateStore()
    const [items, setItems] = useState<AgencyMediaItem[]>([])
    const [alt, setAlt] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [fetchingGallery, setFetchingGallery] = useState(true)

    const slug = useMemo(() => (typeof newHojraData?.slug === 'string' ? newHojraData.slug : ''), [newHojraData?.slug])
    const canUpload = useMemo(() => Boolean(file), [file])

    const fetchGallery = async () => {
        try {
            setFetchingGallery(true)
            if (!slug.trim()) return
            const resp = await apiGetMyAgencyMedia(slug)
            setItems(resp?.gallery_images || [])
        } catch (err) {
            console.error('Failed to load gallery:', err)
        } finally {
            setFetchingGallery(false)
        }
    }

    useEffect(() => {
        fetchGallery()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug])

    const onAdd = async () => {
        try {
            if (!slug.trim()) throw new Error(t('center.errors.centerSlugMissing'))
            if (!newHojraData?.id) throw new Error(t('center.errors.centerIdMissing'))
            if (!file) throw new Error(t('center.validation.selectImage'))

            setLoading(true)

            const formData = new FormData()
            formData.append('collection', 'agency_gallery_images')
            formData.append('file', file)
            if (alt.trim()) formData.append('alt', alt.trim())

            const resp = await apiUploadMyAgencyMedia(slug, formData)
            if (!resp?.success) throw new Error(resp?.message || t('center.errors.uploadFailed'))

            toast.push(<Notification type="success">{t('center.gallery.imageUploaded')}</Notification>)
            await fetchGallery()

            setAlt('')
            setFile(null)

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            if (fileInput) fileInput.value = ''
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('center.errors.uploadFailed')
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setLoading(false)
        }
    }

    const onRemove = async (id: number) => {
        try {
            if (!slug.trim()) throw new Error(t('center.errors.centerSlugMissing'))

            setLoading(true)
            const resp = await apiDeleteMyAgencyMedia(slug, id)
            if (!resp?.success) throw new Error(resp?.message || t('center.errors.deleteFailed'))

            toast.push(
                <Notification type="success">
                    {resp?.message || t('center.gallery.imageDeleted')}
                </Notification>,
            )
            await fetchGallery()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('center.errors.deleteFailed')
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Card header={{ content: t('center.gallery.title'), bordered: false }}>
                <Form
                    size="md"
                    onSubmit={(e) => {
                        e.preventDefault()
                        onAdd()
                    }}
                >
                    <FormItem label={t('center.gallery.alt')} className="mb-4">
                        <Input
                            value={alt}
                            placeholder={t('center.gallery.altPlaceholder')}
                            disabled={loading}
                            onChange={(e) => setAlt(e.target.value)}
                        />
                    </FormItem>

                    <FormItem label={t('center.gallery.image')} className="mb-4">
                        <Input
                            type="file"
                            accept="image/*"
                            disabled={loading}
                            onChange={(e) => {
                                const target = e.target as HTMLInputElement
                                const inputFile = target.files?.[0]
                                if (!inputFile) {
                                    setFile(null)
                                    return
                                }

                                const { file: nextFile, error } =
                                    prepareValidatedFile(inputFile, {
                                        category: 'image',
                                    })

                                if (error || !nextFile) {
                                    toast.push(
                                        <Notification type="danger">
                                            {error}
                                        </Notification>,
                                    )
                                    target.value = ''
                                    setFile(null)
                                    return
                                }

                                setFile(nextFile)
                            }}
                        />
                    </FormItem>

                    <FormItem>
                        <div className="flex items-center justify-end">
                            <Button size="sm" variant="solid" type="submit" disabled={!canUpload || loading} loading={loading}>
                                {loading ? t('center.gallery.uploading') : t('center.gallery.addToGallery')}
                            </Button>
                        </div>
                    </FormItem>
                </Form>

                <div className="mt-6">
                    {fetchingGallery ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner size={30} />
                            <span className="ml-3 text-gray-500">{t('center.gallery.loading')}</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">{t('center.gallery.noImages')}</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div className="aspect-video bg-gray-100">
                                        <img src={item.thumb_url || item.url} alt={item.alt || ''} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-3">
                                        <div className="text-xs text-gray-500 mb-2">ALT: {item.alt || '-'}</div>
                                        <Button size="sm" variant="plain" disabled={loading} onClick={() => onRemove(item.id)}>
                                            {t('center.gallery.delete')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>                
            </Card>
        </div>
    )
}
