import { useRef, useState } from 'react'
import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Tag from '@/components/ui/Tag'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbUpload, TbTrash, TbStar, TbStarFilled } from 'react-icons/tb'
import {
    apiGetAdminOrganizationMedia,
    apiUploadAdminOrganizationMedia,
    apiUpdateAdminOrganizationMedia,
    apiDeleteAdminOrganizationMedia,
} from '@/services/admin/AdminOrganizationMediaService'
import type {
    AdminOrganizationMedia,
    AdminOrganizationMediaCollection,
} from '@/services/admin/AdminOrganizationMediaService'

const COLLECTION_OPTIONS: { value: AdminOrganizationMediaCollection; label: string }[] = [
    { value: 'organization_hero_images', label: 'Hero images' },
    { value: 'organization_about_images', label: 'About images' },
    { value: 'organization_gallery_images', label: 'Gallery images' },
]

/**
 * React port of the organization "Media" tab — three image collections
 * (hero, about, gallery), each with its own single-featured-item toggle.
 */
function OrganizationMediaTab({ organizationSlug }: { organizationSlug: string }) {
    const { can } = usePermission()
    const canEdit = can('organizations.edit')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadCollection, setUploadCollection] =
        useState<AdminOrganizationMediaCollection>('organization_hero_images')
    const [uploading, setUploading] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<AdminOrganizationMedia | null>(null)

    const { data, mutate, isLoading } = useSWR(
        ['admin-organization-media', organizationSlug],
        () => apiGetAdminOrganizationMedia(organizationSlug),
    )

    const media = data?.data ?? []

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('collection', uploadCollection)
            formData.append('file', file)
            await apiUploadAdminOrganizationMedia(organizationSlug, formData)
            toast.push(<Notification type="success" title="Uploaded" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Upload failed" />)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const toggleFeatured = async (item: AdminOrganizationMedia) => {
        try {
            await apiUpdateAdminOrganizationMedia(organizationSlug, item.id, {
                is_featured: !item.is_featured,
            })
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to update" />)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            await apiDeleteAdminOrganizationMedia(organizationSlug, pendingDelete.id)
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
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <img
                                src={item.url}
                                alt={item.alt ?? item.name}
                                className="w-full h-full object-cover"
                            />
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
                                        icon={item.is_featured ? <TbStarFilled /> : <TbStar />}
                                        onClick={() => toggleFeatured(item)}
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

export default OrganizationMediaTab
