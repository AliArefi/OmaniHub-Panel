import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import {
    apiCmsEntryAction,
    apiCreateCmsEntry,
    apiGetCmsEntries,
    apiGetCmsEntry,
    apiUpdateCmsEntry,
    apiUploadCmsMedia,
    type CmsEntry,
    type CmsLocale,
    type CmsTranslation,
} from '@/services/admin/AdminCmsService'

const emptyTranslation = (): CmsTranslation => ({
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    seo: { robots: 'index,follow' },
})

export default function CmsManager() {
    const { type = 'posts' } = useParams()
    const typeKey = useMemo(
        () => ({ pages: 'page', posts: 'post', blocks: 'block' })[type] || type,
        [type],
    )
    const [entries, setEntries] = useState<CmsEntry[]>([])
    const [selected, setSelected] = useState<CmsEntry | null>(null)
    const [locale, setLocale] = useState<CmsLocale>('ar')
    const [translations, setTranslations] = useState<
        Record<CmsLocale, CmsTranslation>
    >({ ar: emptyTranslation(), en: emptyTranslation() })
    const [busy, setBusy] = useState(false)

    const reload = useCallback(async () => {
        const response = await apiGetCmsEntries(typeKey)
        setEntries(response.data || [])
    }, [typeKey])
    useEffect(() => {
        void reload()
    }, [reload])

    const edit = async (id: number) => {
        const response = await apiGetCmsEntry(id)
        setSelected(response.data)
        setTranslations({
            ar: { ...emptyTranslation(), ...response.data.translations?.ar },
            en: { ...emptyTranslation(), ...response.data.translations?.en },
        })
    }
    const field = (name: keyof CmsTranslation, value: string) =>
        setTranslations((current) => ({
            ...current,
            [locale]: { ...current[locale], [name]: value },
        }))
    const seo = (name: string, value: string) =>
        setTranslations((current) => ({
            ...current,
            [locale]: {
                ...current[locale],
                seo: { ...current[locale].seo, [name]: value },
            },
        }))
    const customFields = (value: string) => {
        try {
            const parsed = JSON.parse(value) as Record<string, unknown>
            setTranslations((current) => ({
                ...current,
                [locale]: { ...current[locale], custom_fields: parsed },
            }))
        } catch {
            // Keep the last valid value while the editor contains incomplete JSON.
        }
    }
    const upload = async (
        collection: 'featured_image' | 'gallery' | 'attachments',
        files: FileList | null,
    ) => {
        if (!selected || !files?.length) return
        await apiUploadCmsMedia(selected.id, locale, collection, files)
        await edit(selected.id)
    }
    const save = async () => {
        setBusy(true)
        if (selected) await apiUpdateCmsEntry(selected.id, { translations })
        else await apiCreateCmsEntry(typeKey, translations)
        await reload()
        setBusy(false)
    }
    const action = async (
        value: 'publish' | 'unpublish' | 'trash' | 'restore' | 'delete',
    ) => {
        if (
            !selected ||
            (selected.is_system && ['trash', 'delete'].includes(value))
        )
            return
        await apiCmsEntryAction(selected.id, value)
        await reload()
    }

    const translation = translations[locale]
    return (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-xl border bg-white p-4 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold capitalize">
                        CMS · {type}
                    </h2>
                    <button
                        className="rounded bg-primary px-3 py-2 text-white"
                        onClick={() => {
                            setSelected(null)
                            setTranslations({
                                ar: emptyTranslation(),
                                en: emptyTranslation(),
                            })
                        }}
                    >
                        New
                    </button>
                </div>
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <button
                            key={entry.id}
                            className="flex w-full items-center justify-between rounded-lg border p-3 text-start hover:border-primary"
                            onClick={() => edit(entry.id)}
                        >
                            <span>
                                #{entry.id} · {entry.status}
                            </span>
                            {entry.is_system && (
                                <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">
                                    System
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </aside>
            <main className="rounded-xl border bg-white p-6 dark:bg-gray-800">
                <div className="mb-6 flex gap-2">
                    {(['ar', 'en'] as CmsLocale[]).map((item) => (
                        <button
                            key={item}
                            className={`rounded px-4 py-2 ${locale === item ? 'bg-primary text-white' : 'bg-gray-100'}`}
                            onClick={() => setLocale(item)}
                        >
                            {item === 'ar' ? 'العربية' : 'English'}
                            {item === 'en' && !translations.en.title
                                ? ' · Missing'
                                : ''}
                        </button>
                    ))}
                </div>
                <div className="grid gap-4">
                    <label>
                        Title
                        <input
                            value={translation.title}
                            className="mt-1 w-full rounded border p-3"
                            dir={locale === 'ar' ? 'rtl' : 'ltr'}
                            onChange={(e) => field('title', e.target.value)}
                        />
                    </label>
                    <label>
                        Slug
                        <input
                            value={translation.slug}
                            className="mt-1 w-full rounded border p-3"
                            dir="ltr"
                            onChange={(e) => field('slug', e.target.value)}
                        />
                    </label>
                    <label>
                        Excerpt
                        <textarea
                            value={translation.excerpt}
                            className="mt-1 w-full rounded border p-3"
                            rows={3}
                            onChange={(e) => field('excerpt', e.target.value)}
                        />
                    </label>
                    <label>
                        Content HTML
                        <textarea
                            value={translation.content_html}
                            className="mt-1 w-full rounded border p-3 font-mono"
                            rows={12}
                            onChange={(e) =>
                                field('content_html', e.target.value)
                            }
                        />
                    </label>
                    <label>
                        Custom fields (JSON)
                        <textarea
                            key={`${selected?.id || 'new'}-${locale}-custom-fields`}
                            className="mt-1 w-full rounded border p-3 font-mono"
                            rows={4}
                            defaultValue={JSON.stringify(
                                translation.custom_fields || {},
                                null,
                                2,
                            )}
                            onBlur={(event) => customFields(event.target.value)}
                        />
                    </label>
                    {selected && (
                        <div className="grid gap-3 md:grid-cols-3">
                            <label>
                                Featured image
                                <input
                                    accept="image/*"
                                    className="mt-1 block w-full"
                                    type="file"
                                    onChange={(event) =>
                                        upload(
                                            'featured_image',
                                            event.target.files,
                                        )
                                    }
                                />
                            </label>
                            <label>
                                Gallery
                                <input
                                    multiple
                                    accept="image/*"
                                    className="mt-1 block w-full"
                                    type="file"
                                    onChange={(event) =>
                                        upload('gallery', event.target.files)
                                    }
                                />
                            </label>
                            <label>
                                Attachments
                                <input
                                    multiple
                                    accept="image/*,.pdf"
                                    className="mt-1 block w-full"
                                    type="file"
                                    onChange={(event) =>
                                        upload(
                                            'attachments',
                                            event.target.files,
                                        )
                                    }
                                />
                            </label>
                        </div>
                    )}
                    <h3 className="mt-3 font-semibold">SEO</h3>
                    <label>
                        SEO title
                        <input
                            value={translation.seo.title || ''}
                            className="mt-1 w-full rounded border p-3"
                            onChange={(e) => seo('title', e.target.value)}
                        />
                    </label>
                    <label>
                        Meta description
                        <textarea
                            value={translation.seo.description || ''}
                            className="mt-1 w-full rounded border p-3"
                            rows={3}
                            onChange={(e) => seo('description', e.target.value)}
                        />
                    </label>
                    <label>
                        Canonical URL
                        <input
                            value={translation.seo.canonical || ''}
                            className="mt-1 w-full rounded border p-3"
                            dir="ltr"
                            onChange={(e) => seo('canonical', e.target.value)}
                        />
                    </label>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                    <button
                        disabled={busy}
                        className="rounded bg-primary px-5 py-2 text-white"
                        onClick={save}
                    >
                        Save
                    </button>
                    {selected && (
                        <>
                            <button
                                className="rounded bg-emerald-600 px-4 py-2 text-white"
                                onClick={() => action('publish')}
                            >
                                Publish
                            </button>
                            <button
                                className="rounded bg-gray-600 px-4 py-2 text-white"
                                onClick={() => action('unpublish')}
                            >
                                Unpublish
                            </button>
                            <button
                                disabled={selected.is_system}
                                className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-40"
                                onClick={() => action('trash')}
                            >
                                Trash
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
