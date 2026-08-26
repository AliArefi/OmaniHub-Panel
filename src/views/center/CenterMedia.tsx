import {
    Button,
    Card,
    Dialog,
    Form,
    FormItem,
    Input,
    Spinner,
    Upload,
    toast,
} from '@/components/ui'
import Notification from '@/components/ui/Notification'
import type { AgencyMediaItem, MyAgencyMediaResponse } from '@/@types/center'
import {
    apiDeleteMyAgencyMedia,
    apiGetMyAgencyMedia,
    apiSetFeaturedMyAgencyMedia,
    apiUpdateMyAgencyMedia,
    apiUploadMyAgencyMedia,
} from '@/services/CenterService'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { prepareValidatedFile } from './utils/fileUpload'

type MediaCollection =
    | 'agency_public_images'
    | 'agency_gallery_images'
    | 'agency_gallery_videos'
    | 'agency_documents'

const acceptByCollection: Record<MediaCollection, string> = {
    agency_public_images: 'image/*',
    agency_gallery_images: 'image/*',
    agency_gallery_videos: 'video/*',
    agency_documents:
        '.pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain',
}

const fileCategoryByCollection: Record<
    MediaCollection,
    'image' | 'video' | 'document'
> = {
    agency_public_images: 'image',
    agency_gallery_images: 'image',
    agency_gallery_videos: 'video',
    agency_documents: 'document',
}

function bytesToHuman(size: number) {
    if (!Number.isFinite(size) || size <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let idx = 0
    let value = size
    while (value >= 1024 && idx < units.length - 1) {
        value /= 1024
        idx += 1
    }
    return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

export default function CenterMedia() {
    const { agencySlug } = useParams()
    const slug = typeof agencySlug === 'string' ? agencySlug : ''

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [payload, setPayload] = useState<MyAgencyMediaResponse | null>(null)

    const [selectedCollection, setSelectedCollection] =
        useState<MediaCollection>('agency_gallery_images')
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    const [editOpen, setEditOpen] = useState(false)
    const [editItem, setEditItem] = useState<AgencyMediaItem | null>(null)
    const [editForm, setEditForm] = useState({
        name: '',
        alt: '',
        title: '',
        caption: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: '',
        sort_order: '',
    })

    const canLoad = useMemo(() => slug.trim() !== '', [slug])

    const refresh = async () => {
        if (!canLoad) return
        setLoading(true)
        setError(null)
        try {
            const resp = await apiGetMyAgencyMedia(slug)
            setPayload(resp)
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object'
                    ? ((err as { response?: { data?: { message?: string } } })
                          .response?.data?.message ?? null)
                    : null
            setError(message || 'Failed to load media.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug])

    const openEdit = (item: AgencyMediaItem) => {
        setEditItem(item)
        setEditForm({
            name: item.name ?? '',
            alt: item.alt ?? '',
            title: item.title ?? '',
            caption: item.caption ?? '',
            seo_title: item.seo?.title ?? '',
            seo_description: item.seo?.description ?? '',
            seo_keywords: item.seo?.keywords ?? '',
            sort_order: item.sort_order === null ? '' : String(item.sort_order),
        })
        setEditOpen(true)
    }

    const upload = async () => {
        if (!canLoad) return
        const file = selectedFiles[0]
        if (!file) {
            toast.push(
                <Notification type="danger">Please select a file.</Notification>,
            )
            return
        }

        const form = new FormData()
        form.append('collection', selectedCollection)
        form.append('file', file)

        try {
            const resp = await apiUploadMyAgencyMedia(slug, form)
            if (!resp?.success) {
                throw new Error(resp?.message || 'Upload failed.')
            }
            toast.push(
                <Notification type="success">
                    {resp?.message || 'Uploaded.'}
                </Notification>,
            )
            setSelectedFiles([])
            await refresh()
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object'
                    ? ((err as { response?: { data?: { message?: string } } })
                          .response?.data?.message ?? null)
                    : null
            toast.push(
                <Notification type="danger">
                    {message || 'Upload failed.'}
                </Notification>,
            )
        }
    }

    const saveEdit = async () => {
        if (!canLoad || !editItem) return
        const mediaId = editItem.id

        const data: Record<string, unknown> = {
            name: editForm.name || null,
            alt: editForm.alt || null,
            title: editForm.title || null,
            caption: editForm.caption || null,
            seo_title: editForm.seo_title || null,
            seo_description: editForm.seo_description || null,
            seo_keywords: editForm.seo_keywords || null,
        }

        if (editForm.sort_order.trim() !== '') {
            const parsed = Number(editForm.sort_order)
            if (Number.isFinite(parsed) && parsed >= 0) {
                data.sort_order = parsed
            }
        }

        try {
            const resp = await apiUpdateMyAgencyMedia(slug, mediaId, data)
            if (!resp?.success) {
                throw new Error(resp?.message || 'Update failed.')
            }
            toast.push(
                <Notification type="success">
                    {resp?.message || 'Updated.'}
                </Notification>,
            )
            setEditOpen(false)
            setEditItem(null)
            await refresh()
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object'
                    ? ((err as { response?: { data?: { message?: string } } })
                          .response?.data?.message ?? null)
                    : null
            toast.push(
                <Notification type="danger">
                    {message || 'Update failed.'}
                </Notification>,
            )
        }
    }

    const setFeatured = async (item: AgencyMediaItem) => {
        if (!canLoad) return
        try {
            const resp = await apiSetFeaturedMyAgencyMedia(slug, item.id)
            if (!resp?.success) {
                throw new Error(resp?.message || 'Failed to set featured media.')
            }
            toast.push(
                <Notification type="success">
                    {resp?.message || 'Featured updated.'}
                </Notification>,
            )
            await refresh()
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object'
                    ? ((err as { response?: { data?: { message?: string } } })
                          .response?.data?.message ?? null)
                    : null
            toast.push(
                <Notification type="danger">
                    {message || 'Failed to set featured media.'}
                </Notification>,
            )
        }
    }

    const remove = async (item: AgencyMediaItem) => {
        if (!canLoad) return
        try {
            const resp = await apiDeleteMyAgencyMedia(slug, item.id)
            if (!resp?.success) {
                throw new Error(resp?.message || 'Delete failed.')
            }
            toast.push(
                <Notification type="success">
                    {resp?.message || 'Deleted.'}
                </Notification>,
            )
            await refresh()
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object'
                    ? ((err as { response?: { data?: { message?: string } } })
                          .response?.data?.message ?? null)
                    : null
            toast.push(
                <Notification type="danger">
                    {message || 'Delete failed.'}
                </Notification>,
            )
        }
    }

    const renderItem = (item: AgencyMediaItem) => {
        const isImage = item.type === 'image'
        return (
            <div
                key={item.id}
                className="flex items-center justify-between gap-4 border rounded p-3"
            >
                <div className="flex items-center gap-3 min-w-0">
                    {isImage ? (
                        <img
                            src={item.thumb_url || item.url}
                            alt={item.alt || item.name}
                            className="w-14 h-14 rounded object-cover bg-gray-100"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                            {item.type.toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="font-semibold truncate">
                            {item.name}
                            {item.is_featured ? (
                                <span className="ml-2 text-xs text-primary-deep">
                                    Featured
                                </span>
                            ) : null}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                            {item.mime_type || 'unknown'} •{' '}
                            {bytesToHuman(item.size_bytes)}
                        </div>
                        <a
                            className="text-xs text-blue-600"
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open
                        </a>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="xs" variant="default" onClick={() => openEdit(item)}>
                        Edit
                    </Button>
                    <Button size="xs" variant="solid" onClick={() => setFeatured(item)}>
                        Set Featured
                    </Button>
                    <Button size="xs" variant="default" onClick={() => remove(item)}>
                        Delete
                    </Button>
                </div>
            </div>
        )
    }

    if (!canLoad) return <div>Missing agency slug.</div>
    if (loading)
        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
            </div>
        )
    if (error) return <div>{error}</div>

    return (
        <>
            <Card
                header={{
                    content: 'Center Media',
                    bordered: false,
                }}
            >
                <div className="grid lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                        <Card
                            header={{
                                content: 'Upload',
                                bordered: false,
                            }}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        size="sm"
                                        variant={
                                            selectedCollection ===
                                            'agency_public_images'
                                                ? 'solid'
                                                : 'default'
                                        }
                                        onClick={() =>
                                            setSelectedCollection(
                                                'agency_public_images',
                                            )
                                        }
                                    >
                                        Public page image
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={
                                            selectedCollection ===
                                            'agency_gallery_images'
                                                ? 'solid'
                                                : 'default'
                                        }
                                        onClick={() =>
                                            setSelectedCollection(
                                                'agency_gallery_images',
                                            )
                                        }
                                    >
                                        Images
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={
                                            selectedCollection ===
                                            'agency_gallery_videos'
                                                ? 'solid'
                                                : 'default'
                                        }
                                        onClick={() =>
                                            setSelectedCollection(
                                                'agency_gallery_videos',
                                            )
                                        }
                                    >
                                        Videos
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={
                                            selectedCollection ===
                                            'agency_documents'
                                                ? 'solid'
                                                : 'default'
                                        }
                                        onClick={() =>
                                            setSelectedCollection(
                                                'agency_documents',
                                            )
                                        }
                                    >
                                        Documents
                                    </Button>
                                </div>

                                <Upload
                                    accept={acceptByCollection[selectedCollection]}
                                    uploadLimit={1}
                                    fileList={selectedFiles}
                                    onChange={(files) => {
                                        const inputFile = files[0]
                                        if (!inputFile) {
                                            setSelectedFiles([])
                                            return
                                        }

                                        const { file, error } =
                                            prepareValidatedFile(inputFile, {
                                                category:
                                                    fileCategoryByCollection[
                                                        selectedCollection
                                                    ],
                                            })

                                        if (error || !file) {
                                            toast.push(
                                                <Notification type="danger">
                                                    {error}
                                                </Notification>,
                                            )
                                            setSelectedFiles([])
                                            return
                                        }

                                        setSelectedFiles([file])
                                    }}
                                    showList
                                />

                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        onClick={upload}
                                    >
                                        Upload
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card
                            header={{
                                content: 'Public Page Image',
                                bordered: false,
                            }}
                        >
                            <div className="space-y-3">
                                {(payload?.public_images || []).map(renderItem)}
                                {(payload?.public_images || []).length === 0 ? (
                                    <div className="text-sm text-gray-500">
                                        No public page image.
                                    </div>
                                ) : null}
                            </div>
                        </Card>

                        <Card
                            header={{
                                content: 'Gallery Images',
                                bordered: false,
                            }}
                        >
                            <div className="space-y-3">
                                {(payload?.gallery_images || []).map(renderItem)}
                                {(payload?.gallery_images || []).length === 0 ? (
                                    <div className="text-sm text-gray-500">
                                        No images.
                                    </div>
                                ) : null}
                            </div>
                        </Card>

                        <Card
                            header={{
                                content: 'Gallery Videos',
                                bordered: false,
                            }}
                        >
                            <div className="space-y-3">
                                {(payload?.gallery_videos || []).map(renderItem)}
                                {(payload?.gallery_videos || []).length === 0 ? (
                                    <div className="text-sm text-gray-500">
                                        No videos.
                                    </div>
                                ) : null}
                            </div>
                        </Card>

                        <Card
                            header={{
                                content: 'Documents',
                                bordered: false,
                            }}
                        >
                            <div className="space-y-3">
                                {(payload?.documents || []).map(renderItem)}
                                {(payload?.documents || []).length === 0 ? (
                                    <div className="text-sm text-gray-500">
                                        No documents.
                                    </div>
                                ) : null}
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card
                            header={{
                                content: 'Featured Media',
                                bordered: false,
                            }}
                        >
                            {payload?.featured_media ? (
                                <div className="space-y-2">
                                    <div className="font-semibold">
                                        {payload.featured_media.name}
                                    </div>
                                    {payload.featured_media.type === 'image' ? (
                                        <img
                                            src={
                                                payload.featured_media
                                                    .thumb_url ||
                                                payload.featured_media.url
                                            }
                                            alt={
                                                payload.featured_media.alt ||
                                                payload.featured_media.name
                                            }
                                            className="w-full rounded object-cover bg-gray-100"
                                        />
                                    ) : (
                                        <a
                                            className="text-sm text-blue-600"
                                            href={payload.featured_media.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open featured file
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    No featured media.
                                </div>
                            )}
                        </Card>

                        <Button size="sm" variant="default" onClick={refresh}>
                            Refresh
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog
                isOpen={editOpen}
                onRequestClose={() => setEditOpen(false)}
                contentClassName="pb-0"
            >
                <div className="p-4">
                    <h4 className="mb-4">Edit Media</h4>
                    <Form>
                        <FormItem label="Name" className="mb-4">
                            <Input
                                value={editForm.name}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        name: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="Alt" className="mb-4">
                            <Input
                                value={editForm.alt}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        alt: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="Title" className="mb-4">
                            <Input
                                value={editForm.title}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        title: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="Caption" className="mb-4">
                            <Input
                                value={editForm.caption}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        caption: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="SEO Title" className="mb-4">
                            <Input
                                value={editForm.seo_title}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        seo_title: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="SEO Description" className="mb-4">
                            <Input
                                value={editForm.seo_description}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        seo_description: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="SEO Keywords" className="mb-4">
                            <Input
                                value={editForm.seo_keywords}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        seo_keywords: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="Sort Order" className="mb-4">
                            <Input
                                value={editForm.sort_order}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        sort_order: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                    </Form>

                    <div className="border-t py-4 flex items-center justify-end gap-2">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => setEditOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button size="sm" variant="solid" onClick={saveEdit}>
                            Save
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}
