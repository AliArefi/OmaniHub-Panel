import { useRef, useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Dialog from '@/components/ui/Dialog'
import Tag from '@/components/ui/Tag'
import { Form, FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbUpload, TbEdit, TbTrash, TbStar, TbStarFilled } from 'react-icons/tb'
import {
    apiGetAdminAgencyMedia,
    apiUploadAdminAgencyMedia,
    apiUpdateAdminAgencyMedia,
    apiDeleteAdminAgencyMedia,
} from '@/services/admin/AdminAgencyMediaService'
import type {
    AdminAgencyMedia,
    AdminAgencyMediaCollection,
} from '@/services/admin/AdminAgencyMediaService'

const COLLECTION_OPTIONS: { value: AdminAgencyMediaCollection; label: string }[] = [
    { value: 'agency_public_images', label: 'Public page image' },
    { value: 'agency_gallery_images', label: 'Gallery images' },
    { value: 'agency_gallery_videos', label: 'Gallery videos' },
    { value: 'agency_documents', label: 'Documents' },
]

type EditFormValues = {
    title: string
    caption: string
    alt: string
    sort_order: number
}

/**
 * React port of AgencyModulesController::media/storeMedia/updateMedia/
 * destroyMedia — Spatie MediaLibrary across the agency's three collections,
 * including the single-featured-item toggle.
 */
function AgencyMediaTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadCollection, setUploadCollection] =
        useState<AdminAgencyMediaCollection>('agency_gallery_images')
    const [uploading, setUploading] = useState(false)
    const [editing, setEditing] = useState<AdminAgencyMedia | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminAgencyMedia | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-media', agencySlug],
        () => apiGetAdminAgencyMedia(agencySlug),
    )

    const { control, handleSubmit, reset } = useForm<EditFormValues>({
        defaultValues: { title: '', caption: '', alt: '', sort_order: 0 },
    })

    const media = data?.data ?? []

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('collection', uploadCollection)
            formData.append('file', file)
            await apiUploadAdminAgencyMedia(agencySlug, formData)
            toast.push(<Notification type="success" title="Uploaded" />)
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Upload failed">
                    Check the file type matches the selected collection.
                </Notification>,
            )
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const toggleFeatured = async (item: AdminAgencyMedia) => {
        try {
            await apiUpdateAdminAgencyMedia(agencySlug, item.id, {
                is_featured: !item.is_featured,
            })
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to update" />)
        }
    }

    const openEdit = (item: AdminAgencyMedia) => {
        setEditing(item)
        reset({
            title: item.title ?? '',
            caption: item.caption ?? '',
            alt: item.alt ?? '',
            sort_order: item.order_column ?? 0,
        })
    }

    const onSubmitEdit = async (values: EditFormValues) => {
        if (!editing) return
        setSubmitting(true)
        try {
            await apiUpdateAdminAgencyMedia(agencySlug, editing.id, values)
            toast.push(<Notification type="success" title="Saved" />)
            setEditing(null)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to save" />)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminAgencyMedia(agencySlug, pendingDelete.id)
            toast.push(<Notification type="success" title="Deleted" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setPendingDelete(null)
        }
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h5>Media</h5>
                {canEdit && (
                    <div className="flex items-center gap-2">
                        <div className="w-48">
                            <Select
                                options={COLLECTION_OPTIONS}
                                value={COLLECTION_OPTIONS.find(
                                    (o) => o.value === uploadCollection,
                                )}
                                onChange={(option) =>
                                    option && setUploadCollection(option.value)
                                }
                            />
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <Button
                            size="sm"
                            icon={<TbUpload />}
                            loading={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Upload
                        </Button>
                    </div>
                )}
            </div>

            {!isLoading && media.length === 0 && (
                <div className="text-center text-gray-400 py-8">No media yet.</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map((item) => (
                    <div
                        key={item.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                    >
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {item.mime_type.startsWith('image/') ? (
                                <img
                                    src={item.url}
                                    alt={item.alt ?? item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xs text-gray-500 p-2 text-center break-all">
                                    {item.file_name}
                                </span>
                            )}
                        </div>
                        <div className="p-2">
                            <div className="flex items-center justify-between gap-1">
                                <span className="text-xs truncate">{item.name}</span>
                                {item.is_featured && (
                                    <Tag className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100 shrink-0">
                                        Featured
                                    </Tag>
                                )}
                            </div>
                            {canEdit && (
                                <div className="flex items-center gap-1 mt-2">
                                    <Button
                                        size="xs"
                                        icon={
                                            item.is_featured ? (
                                                <TbStarFilled />
                                            ) : (
                                                <TbStar />
                                            )
                                        }
                                        onClick={() => toggleFeatured(item)}
                                    />
                                    <Button
                                        size="xs"
                                        icon={<TbEdit />}
                                        onClick={() => openEdit(item)}
                                    />
                                    <Button
                                        size="xs"
                                        icon={<TbTrash />}
                                        onClick={() => setPendingDelete(item)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Dialog isOpen={Boolean(editing)} onClose={() => setEditing(null)}>
                <h4 className="mb-4">Edit media</h4>
                <Form onSubmit={handleSubmit(onSubmitEdit)}>
                    <FormItem label="Title">
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Alt text">
                        <Controller
                            name="alt"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Caption">
                        <Controller
                            name="caption"
                            control={control}
                            render={({ field }) => <Input textArea rows={3} {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Sort order">
                        <Controller
                            name="sort_order"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="plain" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="solid" loading={submitting}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete media"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this media item?
            </ConfirmDialog>
        </Card>
    )
}

export default AgencyMediaTab
