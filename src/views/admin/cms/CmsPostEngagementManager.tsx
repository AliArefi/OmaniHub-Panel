import { useCallback, useEffect, useState } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import { FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import {
    apiCreateCmsPostComment,
    apiCreateCmsPostFaq,
    apiCreateCmsPostRating,
    apiDeleteCmsPostComment,
    apiDeleteCmsPostFaq,
    apiDeleteCmsPostRating,
    apiGetCmsPostComments,
    apiGetCmsPostFaqs,
    apiGetCmsPostRatings,
    apiUpdateCmsPostComment,
    apiUpdateCmsPostFaq,
    apiUpdateCmsPostRating,
    type CmsLocale,
    type CmsPostComment,
    type CmsPostFaq,
    type CmsPostRating,
} from '@/services/admin/AdminCmsService'

const localeOptions = [
    { label: 'Arabic', value: 'ar' },
    { label: 'English', value: 'en' },
]

export default function CmsPostEngagementManager({
    entryId,
}: {
    entryId: number
}) {
    const [locale, setLocale] = useState<CmsLocale>('ar')
    const [comments, setComments] = useState<CmsPostComment[]>([])
    const [ratings, setRatings] = useState<CmsPostRating[]>([])
    const [faqs, setFaqs] = useState<CmsPostFaq[]>([])
    const [summary, setSummary] = useState({ average: 0, count: 0 })
    const [author, setAuthor] = useState('')
    const [comment, setComment] = useState('')
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null,
    )
    const [rating, setRating] = useState(5)
    const [question, setQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [editingFaqId, setEditingFaqId] = useState<number | null>(null)
    const [busy, setBusy] = useState(false)

    const reload = useCallback(async () => {
        const [commentsResponse, ratingsResponse, faqsResponse] =
            await Promise.all([
                apiGetCmsPostComments(entryId),
                apiGetCmsPostRatings(entryId),
                apiGetCmsPostFaqs(entryId, locale),
            ])
        setComments(commentsResponse.data ?? [])
        setRatings(ratingsResponse.data ?? [])
        setSummary(ratingsResponse.summary)
        setFaqs(faqsResponse.data ?? [])
    }, [entryId, locale])

    useEffect(() => {
        void reload()
    }, [reload])

    const run = async (action: () => Promise<unknown>) => {
        setBusy(true)
        try {
            await action()
            await reload()
            toast.push(<Notification type="success" title="Saved" />)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="space-y-6">
            <AdaptiveCard>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h5>Post engagement</h5>
                        <p className="text-sm text-gray-500">
                            Manual and visitor-submitted comments, ratings, and
                            FAQs.
                        </p>
                    </div>
                    <Select
                        className="w-36"
                        options={localeOptions}
                        value={localeOptions.find(
                            (item) => item.value === locale,
                        )}
                        onChange={(item) =>
                            setLocale((item?.value ?? 'ar') as CmsLocale)
                        }
                    />
                </div>

                <section className="border-t pt-5">
                    <h6 className="mb-3">Comments</h6>
                    <div className="grid gap-3 md:grid-cols-3">
                        <Input
                            placeholder="Author name"
                            value={author}
                            onChange={(event) => setAuthor(event.target.value)}
                        />
                        <Input
                            className="md:col-span-2"
                            placeholder="Comment"
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                        />
                    </div>
                    <Button
                        className="mt-3"
                        variant="solid"
                        loading={busy}
                        disabled={!author.trim() || !comment.trim()}
                        onClick={() =>
                            void run(async () => {
                                const payload = {
                                    author_name: author,
                                    content: comment,
                                    locale,
                                    approved: true,
                                }
                                if (editingCommentId)
                                    await apiUpdateCmsPostComment(
                                        entryId,
                                        editingCommentId,
                                        payload,
                                    )
                                else
                                    await apiCreateCmsPostComment(
                                        entryId,
                                        payload,
                                    )
                                setAuthor('')
                                setComment('')
                                setEditingCommentId(null)
                            })
                        }
                    >
                        {editingCommentId
                            ? 'Save comment'
                            : 'Add approved comment'}
                    </Button>
                    <div className="mt-4 space-y-2">
                        {comments.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start justify-between gap-3 rounded-lg border p-3"
                            >
                                <div>
                                    <strong>
                                        {item.user?.name ??
                                            item.reviewer_name ??
                                            'Visitor'}
                                    </strong>
                                    <p className="text-sm text-gray-600">
                                        {item.comment}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="xs"
                                        onClick={() => {
                                            setEditingCommentId(item.id)
                                            setAuthor(
                                                item.user?.name ??
                                                    item.reviewer_name ??
                                                    '',
                                            )
                                            setComment(item.comment)
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Switcher
                                        checked={item.status}
                                        onChange={(approved) =>
                                            void run(() =>
                                                apiUpdateCmsPostComment(
                                                    entryId,
                                                    item.id,
                                                    { approved },
                                                ),
                                            )
                                        }
                                    />
                                    <Button
                                        size="xs"
                                        onClick={() =>
                                            void run(() =>
                                                apiDeleteCmsPostComment(
                                                    entryId,
                                                    item.id,
                                                ),
                                            )
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-6 border-t pt-5">
                    <h6>
                        Ratings · {summary.average.toFixed(2)} / 5 (
                        {summary.count})
                    </h6>
                    <div className="mt-3 flex items-end gap-3">
                        <FormItem label="Manual rating">
                            <Input
                                type="number"
                                min={1}
                                max={5}
                                value={rating}
                                onChange={(event) =>
                                    setRating(Number(event.target.value))
                                }
                            />
                        </FormItem>
                        <Button
                            variant="solid"
                            loading={busy}
                            onClick={() =>
                                void run(() =>
                                    apiCreateCmsPostRating(
                                        entryId,
                                        rating,
                                        locale,
                                    ),
                                )
                            }
                        >
                            Add rating
                        </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {ratings.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                            >
                                <Input
                                    className="w-16"
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={item.rating}
                                    onChange={(event) =>
                                        void run(() =>
                                            apiUpdateCmsPostRating(
                                                entryId,
                                                item.id,
                                                Number(event.target.value),
                                            ),
                                        )
                                    }
                                />
                                <span className="text-xs text-gray-500">
                                    {item.user?.name ??
                                        item.admin?.name ??
                                        'Visitor'}
                                </span>
                                <Button
                                    size="xs"
                                    onClick={() =>
                                        void run(() =>
                                            apiDeleteCmsPostRating(
                                                entryId,
                                                item.id,
                                            ),
                                        )
                                    }
                                >
                                    Delete
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-6 border-t pt-5">
                    <h6 className="mb-3">FAQ and FAQ schema</h6>
                    <div className="grid gap-3">
                        <Input
                            placeholder="Question"
                            value={question}
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                        />
                        <Input
                            textArea
                            placeholder="Answer"
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value)}
                        />
                    </div>
                    <Button
                        className="mt-3"
                        variant="solid"
                        loading={busy}
                        disabled={!question.trim() || !answer.trim()}
                        onClick={() =>
                            void run(async () => {
                                const payload = {
                                    question,
                                    answer,
                                    locale,
                                    is_active: true,
                                    sort_order: faqs.length,
                                }
                                if (editingFaqId)
                                    await apiUpdateCmsPostFaq(
                                        entryId,
                                        editingFaqId,
                                        payload,
                                    )
                                else await apiCreateCmsPostFaq(entryId, payload)
                                setQuestion('')
                                setAnswer('')
                                setEditingFaqId(null)
                            })
                        }
                    >
                        {editingFaqId ? 'Save FAQ' : 'Add FAQ'}
                    </Button>
                    <div className="mt-4 space-y-2">
                        {faqs.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between gap-3 rounded-lg border p-3"
                            >
                                <div>
                                    <strong>{item.question}</strong>
                                    <p className="text-sm text-gray-600">
                                        {item.answer}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="xs"
                                        onClick={() => {
                                            setEditingFaqId(item.id)
                                            setQuestion(item.question)
                                            setAnswer(item.answer)
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Switcher
                                        checked={item.is_active}
                                        onChange={(is_active) =>
                                            void run(() =>
                                                apiUpdateCmsPostFaq(
                                                    entryId,
                                                    item.id,
                                                    { ...item, is_active },
                                                ),
                                            )
                                        }
                                    />
                                    <Button
                                        size="xs"
                                        onClick={() =>
                                            void run(() =>
                                                apiDeleteCmsPostFaq(
                                                    entryId,
                                                    item.id,
                                                ),
                                            )
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </AdaptiveCard>
        </div>
    )
}
