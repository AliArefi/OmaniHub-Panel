import { Button, Card, Form, FormItem, Input, toast } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { useMemo, useState } from 'react'
import { useCreateStore } from '@/context/createStoreContext'

interface GalleryItem {
  id: number
  file: File
  url: string
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

  const canUpload = useMemo(() => Boolean(file), [file])

  const onAdd = async () => {
    try {
      if (!newHojraData?.id) {
        throw new Error('شناسه حجره موجود نیست')
      }
      if (!file) {
        throw new Error('لطفاً تصویر را انتخاب کنید')
      }

      // CALL API
      const url = URL.createObjectURL(file)
      setItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          file,
          url,
          alt: alt || 'Image',
        },
      ])
      setAlt('')
      setFile(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطا در آپلود'
      toast.push(<Notification type="danger">{message}</Notification>)
    }
  }

  const onRemove = (id: number) => {
    // CALL API DELETE
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
        <Form size="md">
          <FormItem label="النص البديل (ALT)" className="mb-4">
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="مثال: Front desk"
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
            />
          </FormItem>


          <FormItem>
            <div className="flex items-center justify-end">
              <Button
                size="sm"
                variant="solid"
                onClick={onAdd}
                disabled={!canUpload}
              >
                إضافة للصالة
              </Button>
            </div>
          </FormItem>
        </Form>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="text-gray-500 text-sm">
              لا توجد صور بعد
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="border rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <div className="aspect-video bg-gray-100">
                <img
                  src={item.url}
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

        <div className="mt-8 flex items-center justify-between">
          <Button
            size="sm"
            variant="plain"
            onClick={() => changeState(2)}
          >
            السابق
          </Button>
          <Button size="sm" variant="solid" onClick={() => changeState(4)}>
            إنهاء
          </Button>
        </div>
      </Card>
    </div>
  )
}
