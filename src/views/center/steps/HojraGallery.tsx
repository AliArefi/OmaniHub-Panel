import {
    Button,
    Card,
    Form,
    FormItem,
    Input,
    toast,
    Spinner,
} from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { useEffect, useMemo, useState } from 'react'
import { useCreateStore } from '@/context/createStoreContext'
import {
    AddGalleryItemMyAgencies,
    apiGetGallery,
} from '@/services/CenterService'

interface GalleryItem {
    id: number
    image: string
    alt: string
}

interface HojraGalleryProps {
    changeState: (value: number) => void
}

export const HojraGallery = ({ changeState }: HojraGalleryProps) => {
    const { newHojraData } = useCreateStore()
    const [items, setItems] = useState<GalleryItem[]>([])
    const [alt, setAlt] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [fetchingGallery, setFetchingGallery] = useState(true)

    const fetchGallery = async () => {
        try {
            setFetchingGallery(true)
            const galleryResponse = await apiGetGallery()
            if (galleryResponse.data) {
                setItems(galleryResponse.data)
            }
        } catch (err) {
            console.error('خطأ في تحميل المعرض:', err)
        } finally {
            setFetchingGallery(false)
        }
    }

    useEffect(() => {
        fetchGallery()
    }, [])

    const canUpload = useMemo(() => Boolean(file), [file])

    const onAdd = async () => {
        try {
            if (!newHojraData?.id) {
                throw new Error('معرّف الحجرة غير موجود')
            }
            if (!file) {
                throw new Error('يرجى اختيار صورة')
            }

            setLoading(true)

            const formData = new FormData()
            formData.append('image', file)
            formData.append('alt', alt)
            formData.append('agency_id', String(newHojraData.id))

            const resp = await AddGalleryItemMyAgencies(formData as any)

            if (resp.success) {
                toast.push(
                    <Notification type="success">
                        تم رفع الصورة بنجاح
                    </Notification>,
                )

                // Refresh gallery from API
                await fetchGallery()

                setAlt('')
                setFile(null)

                // Reset file input
                const fileInput = document.querySelector(
                    'input[type="file"]',
                ) as HTMLInputElement
                if (fileInput) fileInput.value = ''
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'خطأ أثناء الرفع'
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setLoading(false)
        }
    }

    const onRemove = (id: number) => {
        // استدعاء API للحذف
        setItems((prev) => prev.filter((x) => x.id !== id))
    }

    return (
        <div>
            <Card
                header={{
                    content: 'معرض الصور',
                    bordered: false,
                }}
            >
                <Form
                    size="md"
                    onSubmit={(e) => {
                        e.preventDefault()
                        onAdd()
                    }}
                >
                    <FormItem label="النص البديل (ALT)" className="mb-4">
                        <Input
                            value={alt}
                            onChange={(e) => setAlt(e.target.value)}
                            placeholder="مثال: Front desk"
                            disabled={loading}
                        />
                    </FormItem>

                    <FormItem label="الصورة" className="mb-4">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const target = e.target as HTMLInputElement
                                setFile(target.files?.[0] || null)
                            }}
                            disabled={loading}
                        />
                    </FormItem>

                    <FormItem>
                        <div className="flex items-center justify-end">
                            <Button
                                size="sm"
                                variant="solid"
                                type="submit"
                                disabled={!canUpload || loading}
                                loading={loading}
                            >
                                {loading ? 'جاري الرفع...' : 'إضافة للصالة'}
                            </Button>
                        </div>
                    </FormItem>
                </Form>

                <div className="mt-6">
                    {fetchingGallery ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner size={30} />
                            <span className="mr-3 text-gray-500">
                                جاري التحميل...
                            </span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            لا توجد صور بعد
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="border rounded-xl overflow-hidden bg-white shadow-sm"
                                >
                                    <div className="aspect-video bg-gray-100">
                                        <img
                                            src={item.image}
                                            alt={item.alt}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <div className="text-xs text-gray-500 mb-2">
                                            ALT: {item.alt}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            onClick={() => onRemove(item.id)}
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-between">
                    <Button
                        size="sm"
                        variant="plain"
                        onClick={() => changeState(2)}
                    >
                        السابق
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        onClick={() => changeState(4)}
                    >
                        إنهاء
                    </Button>
                </div>
            </Card>
        </div>
    )
}
