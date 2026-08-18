import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import {
    apiCreateCmsCollectionItem,
    apiDeleteCmsCollectionItem,
    apiGetCmsCollection,
    apiModerateCmsComment,
    type CmsCollectionItem,
} from '@/services/admin/AdminCmsService'

export default function CmsCollectionManager() {
    const { resource = 'categories' } = useParams()
    const [items, setItems] = useState<CmsCollectionItem[]>([])
    const [ar, setAr] = useState('')
    const [en, setEn] = useState('')
    const [key, setKey] = useState('')
    const reload = useCallback(async () => {
        const response = await apiGetCmsCollection(resource)
        setItems(
            Array.isArray(response.data)
                ? response.data
                : response.data.data || [],
        )
    }, [resource])
    useEffect(() => {
        void reload()
    }, [reload])

    const create = async () => {
        if (!ar.trim() || resource === 'comments') return
        const translations = { ar: { name: ar }, en: { name: en } }
        await apiCreateCmsCollectionItem(
            resource,
            resource === 'types'
                ? {
                      key,
                      translations,
                      settings: {
                          supports: ['title', 'editor', 'seo', 'meta'],
                      },
                  }
                : { translations },
        )
        setAr('')
        setEn('')
        setKey('')
        await reload()
    }
    const label = (item: CmsCollectionItem) =>
        item.comment || item.translations?.ar?.name || item.key || `#${item.id}`

    return (
        <div className="rounded-xl border bg-white p-6 dark:bg-gray-800">
            <h1 className="mb-6 text-xl font-semibold capitalize">
                CMS · {resource}
            </h1>
            {resource !== 'comments' && (
                <div className="mb-6 grid gap-3 md:grid-cols-3">
                    {resource === 'types' && (
                        <input
                            className="rounded border p-3"
                            placeholder="Machine key"
                            value={key}
                            onChange={(event) => setKey(event.target.value)}
                        />
                    )}
                    <input
                        className="rounded border p-3"
                        placeholder="الاسم بالعربية"
                        value={ar}
                        onChange={(event) => setAr(event.target.value)}
                    />
                    <input
                        className="rounded border p-3"
                        placeholder="English name"
                        value={en}
                        onChange={(event) => setEn(event.target.value)}
                    />
                    <button
                        className="rounded bg-primary px-4 py-2 text-white"
                        onClick={create}
                    >
                        Create
                    </button>
                </div>
            )}
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                    >
                        <span>
                            {label(item)}{' '}
                            {item.is_system && (
                                <small className="ms-2 rounded bg-amber-100 px-2 py-1 text-amber-800">
                                    System
                                </small>
                            )}
                        </span>
                        <div className="flex gap-2">
                            {resource === 'comments' ? (
                                <>
                                    <button
                                        className="rounded bg-emerald-600 px-3 py-2 text-white"
                                        onClick={async () => {
                                            await apiModerateCmsComment(
                                                item.id,
                                                true,
                                            )
                                            await reload()
                                        }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="rounded bg-gray-500 px-3 py-2 text-white"
                                        onClick={async () => {
                                            await apiModerateCmsComment(
                                                item.id,
                                                false,
                                            )
                                            await reload()
                                        }}
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-40"
                                    disabled={item.is_system}
                                    onClick={async () => {
                                        await apiDeleteCmsCollectionItem(
                                            resource,
                                            item.id,
                                        )
                                        await reload()
                                    }}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
