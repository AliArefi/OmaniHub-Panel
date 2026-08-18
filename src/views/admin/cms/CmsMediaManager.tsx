import { useMemo, useState } from 'react'
import ImageUploadField from '@/components/admin/ImageUploadField'
import Upload from '@/components/ui/Upload'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Tag from '@/components/ui/Tag'
import { FormItem } from '@/components/ui/Form'
import { Tabs } from '@/components/ui/Tabs'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import {
    TbArrowDown,
    TbArrowUp,
    TbEdit,
    TbFile,
    TbPhotoPlus,
    TbTrash,
    TbUpload,
} from 'react-icons/tb'
import {
    apiDeleteCmsMedia,
    apiReorderCmsMedia,
    apiUpdateCmsMedia,
    apiUploadCmsMedia,
    type CmsEntry,
    type CmsLocale,
    type CmsMediaItem,
} from '@/services/admin/AdminCmsService'

const LOCALES: Array<{
    key: CmsLocale
    label: string
    direction: 'rtl' | 'ltr'
}> = [
    { key: 'ar', label: 'العربية', direction: 'rtl' },
    { key: 'en', label: 'English', direction: 'ltr' },
]
const VISIBILITY = [
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' },
    { label: 'Admin only', value: 'admin_only' },
]

type Props = {
    entryId: number
    entry?: CmsEntry
    onChanged: () => void | Promise<void>
}
type MetadataForm = {
    alt: string
    title: string
    caption: string
    visibility: string
}

export default function CmsMediaManager({ entryId, entry, onChanged }: Props) {
    const [busy, setBusy] = useState(false)
    const [editing, setEditing] = useState<CmsMediaItem | null>(null)
    const [metadata, setMetadata] = useState<MetadataForm>({
        alt: '',
        title: '',
        caption: '',
        visibility: 'public',
    })

    const upload = async (
        locale: CmsLocale,
        collection: CmsMediaItem['collection'],
        files: File[],
    ) => {
        if (files.length === 0) return
        setBusy(true)
        try {
            await apiUploadCmsMedia(entryId, locale, collection, files)
            toast.push(<Notification type="success" title="Media uploaded" />)
            await onChanged()
        } catch {
            toast.push(
                <Notification type="danger" title="Upload failed">
                    Check the file type and size.
                </Notification>,
            )
        } finally {
            setBusy(false)
        }
    }

    const remove = async (item: CmsMediaItem) => {
        setBusy(true)
        try {
            await apiDeleteCmsMedia(entryId, item.id)
            await onChanged()
            toast.push(<Notification type="success" title="Media deleted" />)
        } finally {
            setBusy(false)
        }
    }

    const openMetadata = (item: CmsMediaItem) => {
        setEditing(item)
        setMetadata({
            alt: item.meta?.alt ?? '',
            title: item.meta?.title ?? '',
            caption: item.meta?.caption ?? '',
            visibility: item.meta?.visibility ?? 'public',
        })
    }

    const saveMetadata = async () => {
        if (!editing) return
        setBusy(true)
        try {
            await apiUpdateCmsMedia(entryId, editing.id, metadata)
            setEditing(null)
            await onChanged()
            toast.push(
                <Notification type="success" title="Media details saved" />,
            )
        } finally {
            setBusy(false)
        }
    }

    const move = async (
        locale: CmsLocale,
        items: CmsMediaItem[],
        index: number,
        offset: number,
    ) => {
        const target = index + offset
        if (target < 0 || target >= items.length) return
        const reordered = [...items]
        ;[reordered[index], reordered[target]] = [
            reordered[target],
            reordered[index],
        ]
        await apiReorderCmsMedia(
            entryId,
            locale,
            reordered.map((item) => item.id),
        )
        await onChanged()
    }

    return (
        <>
            <Tabs defaultValue="ar">
                <Tabs.TabList>
                    {LOCALES.map((locale) => (
                        <Tabs.TabNav key={locale.key} value={locale.key}>
                            {locale.label}
                        </Tabs.TabNav>
                    ))}
                </Tabs.TabList>
                {LOCALES.map((locale) => (
                    <LocaleMedia
                        key={locale.key}
                        locale={locale.key}
                        direction={locale.direction}
                        items={entry?.media?.[locale.key] ?? []}
                        busy={busy}
                        upload={upload}
                        remove={remove}
                        edit={openMetadata}
                        move={move}
                    />
                ))}
            </Tabs>
            <Dialog
                isOpen={Boolean(editing)}
                width={560}
                onClose={() => setEditing(null)}
                onRequestClose={() => setEditing(null)}
            >
                <h4 className="mb-5">Media details</h4>
                <FormItem label="Alternative text">
                    <Input
                        value={metadata.alt}
                        onChange={(event) =>
                            setMetadata((current) => ({
                                ...current,
                                alt: event.target.value,
                            }))
                        }
                    />
                </FormItem>
                <FormItem label="Title">
                    <Input
                        value={metadata.title}
                        onChange={(event) =>
                            setMetadata((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                    />
                </FormItem>
                <FormItem label="Caption">
                    <Input
                        textArea
                        rows={3}
                        value={metadata.caption}
                        onChange={(event) =>
                            setMetadata((current) => ({
                                ...current,
                                caption: event.target.value,
                            }))
                        }
                    />
                </FormItem>
                <FormItem label="Visibility">
                    <Select
                        options={VISIBILITY}
                        value={VISIBILITY.find(
                            (option) => option.value === metadata.visibility,
                        )}
                        onChange={(option) =>
                            setMetadata((current) => ({
                                ...current,
                                visibility: option?.value ?? 'public',
                            }))
                        }
                    />
                </FormItem>
                <div className="flex justify-end gap-2">
                    <Button variant="plain" onClick={() => setEditing(null)}>
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        loading={busy}
                        onClick={() => void saveMetadata()}
                    >
                        Save details
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

function LocaleMedia({
    locale,
    direction,
    items,
    busy,
    upload,
    remove,
    edit,
    move,
}: {
    locale: CmsLocale
    direction: 'rtl' | 'ltr'
    items: CmsMediaItem[]
    busy: boolean
    upload: (
        locale: CmsLocale,
        collection: CmsMediaItem['collection'],
        files: File[],
    ) => Promise<void>
    remove: (item: CmsMediaItem) => Promise<void>
    edit: (item: CmsMediaItem) => void
    move: (
        locale: CmsLocale,
        items: CmsMediaItem[],
        index: number,
        offset: number,
    ) => Promise<void>
}) {
    const [galleryUploadKey, setGalleryUploadKey] = useState(0)
    const [attachmentUploadKey, setAttachmentUploadKey] = useState(0)
    const featured = items.find((item) => item.collection === 'featured_image')
    const gallery = useMemo(
        () => items.filter((item) => item.collection === 'gallery'),
        [items],
    )
    const attachments = useMemo(
        () => items.filter((item) => item.collection === 'attachments'),
        [items],
    )
    const validateImage = (files: FileList | null) =>
        files &&
        Array.from(files).some((file) => !file.type.startsWith('image/'))
            ? 'Only image files are allowed.'
            : true

    return (
        <Tabs.TabContent value={locale}>
            <div dir={direction} className="space-y-6 pt-4">
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h6>Featured image</h6>
                        {featured && (
                            <div className="flex gap-1">
                                <Button
                                    size="xs"
                                    icon={<TbEdit />}
                                    onClick={() => edit(featured)}
                                />
                                <Button
                                    size="xs"
                                    className="text-red-600"
                                    icon={<TbTrash />}
                                    disabled={busy}
                                    onClick={() => void remove(featured)}
                                />
                            </div>
                        )}
                    </div>
                    <ImageUploadField
                        existingUrl={featured?.url}
                        disabled={busy}
                        size={120}
                        onChange={(file) =>
                            file &&
                            void upload(locale, 'featured_image', [file])
                        }
                    />
                </section>
                <section>
                    <h6 className="mb-3">Gallery</h6>
                    <Upload
                        key={galleryUploadKey}
                        draggable
                        multiple
                        showList={false}
                        accept="image/*"
                        beforeUpload={validateImage}
                        disabled={busy}
                        onChange={(files) =>
                            void upload(locale, 'gallery', files).then(() =>
                                setGalleryUploadKey((value) => value + 1),
                            )
                        }
                    >
                        <div className="flex min-h-28 flex-col items-center justify-center gap-2 p-5 text-center">
                            <TbPhotoPlus className="text-3xl text-primary" />
                            <strong>Drop gallery images here</strong>
                            <span className="text-xs text-gray-500">
                                or click to browse · up to 20 images
                            </span>
                        </div>
                    </Upload>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        {gallery.map((item, index) => (
                            <div
                                key={item.id}
                                className="rounded-lg border border-gray-200 p-2 dark:border-gray-700"
                            >
                                <Avatar
                                    shape="square"
                                    size={90}
                                    className="mx-auto"
                                    src={item.url}
                                />
                                <div className="mt-2 truncate text-xs">
                                    {item.meta?.title ||
                                        item.file_name ||
                                        item.name}
                                </div>
                                <div className="mt-2 flex justify-center gap-1">
                                    <Button
                                        size="xs"
                                        icon={<TbArrowUp />}
                                        disabled={index === 0 || busy}
                                        onClick={() =>
                                            void move(
                                                locale,
                                                gallery,
                                                index,
                                                -1,
                                            )
                                        }
                                    />
                                    <Button
                                        size="xs"
                                        icon={<TbArrowDown />}
                                        disabled={
                                            index === gallery.length - 1 || busy
                                        }
                                        onClick={() =>
                                            void move(locale, gallery, index, 1)
                                        }
                                    />
                                    <Button
                                        size="xs"
                                        icon={<TbEdit />}
                                        onClick={() => edit(item)}
                                    />
                                    <Button
                                        size="xs"
                                        className="text-red-600"
                                        icon={<TbTrash />}
                                        disabled={busy}
                                        onClick={() => void remove(item)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <h6 className="mb-3">Attachments</h6>
                    <Upload
                        key={attachmentUploadKey}
                        draggable
                        multiple
                        showList={false}
                        accept="image/*,.pdf,application/pdf"
                        disabled={busy}
                        onChange={(files) =>
                            void upload(locale, 'attachments', files).then(() =>
                                setAttachmentUploadKey((value) => value + 1),
                            )
                        }
                    >
                        <div className="flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
                            <TbUpload className="text-3xl text-primary" />
                            <strong>Drop attachments here</strong>
                            <span className="text-xs text-gray-500">
                                Images and PDF files
                            </span>
                        </div>
                    </Upload>
                    <div className="mt-3 space-y-2">
                        {attachments.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                            >
                                <a
                                    className="flex min-w-0 items-center gap-2"
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <TbFile className="shrink-0 text-xl" />
                                    <span className="truncate">
                                        {item.meta?.title ||
                                            item.file_name ||
                                            item.name}
                                    </span>
                                </a>
                                <div className="flex gap-1">
                                    <Tag>
                                        {item.meta?.visibility ?? 'public'}
                                    </Tag>
                                    <Button
                                        size="xs"
                                        icon={<TbEdit />}
                                        onClick={() => edit(item)}
                                    />
                                    <Button
                                        size="xs"
                                        className="text-red-600"
                                        icon={<TbTrash />}
                                        disabled={busy}
                                        onClick={() => void remove(item)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </Tabs.TabContent>
    )
}
