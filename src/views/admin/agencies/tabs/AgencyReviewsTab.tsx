import { useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Dialog from '@/components/ui/Dialog'
import Tag from '@/components/ui/Tag'
import { Form, FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { TbPlus, TbEdit, TbTrash, TbStarFilled } from 'react-icons/tb'
import {
    apiGetAdminAgencyReviews,
    apiCreateAdminAgencyReview,
    apiUpdateAdminAgencyReview,
    apiDeleteAdminAgencyReview,
    apiUpdateAdminAgencySeedStats,
} from '@/services/admin/AdminAgencyReviewsService'
import type { AdminAgencyReview } from '@/services/admin/AdminAgencyReviewsService'

type ReviewFormValues = {
    reviewer_name: string
    comment: string
    rates: number
    status: boolean
}

const emptyReview: ReviewFormValues = {
    reviewer_name: '',
    comment: '',
    rates: 5,
    status: true,
}

type SeedFormValues = {
    review_seed_average: number
    review_seed_total_count: number
}

/**
 * React port of the agency "Reviews" tab (AgencyReviewsController) —
 * manual reviews (polymorphic Comment rows) plus the seed-rating blend
 * used to bootstrap a public rating average before real reviews exist.
 */
function AgencyReviewsTab({ agencySlug }: { agencySlug: string }) {
    const { can } = usePermission()
    const canEdit = can('agencies.edit')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<AdminAgencyReview | null>(null)
    const [pendingDelete, setPendingDelete] = useState<AdminAgencyReview | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [seedDialogOpen, setSeedDialogOpen] = useState(false)
    const [seedSubmitting, setSeedSubmitting] = useState(false)

    const { data, mutate, isLoading } = useSWR(
        ['admin-agency-reviews', agencySlug],
        () => apiGetAdminAgencyReviews(agencySlug),
    )

    const { control, handleSubmit, reset } = useForm<ReviewFormValues>({
        defaultValues: emptyReview,
    })
    const seedForm = useForm<SeedFormValues>({
        defaultValues: { review_seed_average: 4.5, review_seed_total_count: 10 },
    })

    const reviews = data?.data ?? []
    const seedStats = data?.seed_stats

    const openCreate = () => {
        setEditing(null)
        reset(emptyReview)
        setDialogOpen(true)
    }

    const openEdit = (review: AdminAgencyReview) => {
        setEditing(review)
        reset({
            reviewer_name: review.reviewer_name,
            comment: review.comment,
            rates: Number(review.rates),
            status: review.status,
        })
        setDialogOpen(true)
    }

    const onSubmit = async (values: ReviewFormValues) => {
        setSubmitting(true)
        try {
            const payload = { ...values, status: values.status ? 1 : 0 }
            if (editing) {
                await apiUpdateAdminAgencyReview(agencySlug, editing.id, payload)
            } else {
                await apiCreateAdminAgencyReview(agencySlug, payload)
            }
            toast.push(<Notification type="success" title="Saved" />)
            setDialogOpen(false)
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
            await apiDeleteAdminAgencyReview(agencySlug, pendingDelete.id)
            toast.push(<Notification type="success" title="Deleted" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setPendingDelete(null)
        }
    }

    const onSubmitSeed = async (values: SeedFormValues) => {
        setSeedSubmitting(true)
        try {
            await apiUpdateAdminAgencySeedStats(agencySlug, values)
            toast.push(<Notification type="success" title="Seed stats updated" />)
            setSeedDialogOpen(false)
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to update">
                    That average cannot be reached with the requested seed count.
                </Notification>,
            )
        } finally {
            setSeedSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h5>Reviews</h5>
                    {canEdit && (
                        <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => setSeedDialogOpen(true)}>
                                Seed rating
                            </Button>
                            <Button size="sm" icon={<TbPlus />} onClick={openCreate}>
                                Add review
                            </Button>
                        </div>
                    )}
                </div>

                {seedStats && (
                    <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                        Seed distribution:
                        {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n}>
                                {n}★:{' '}
                                {seedStats[
                                    `review_seed_${n}_count` as keyof typeof seedStats
                                ] ?? 0}
                            </span>
                        ))}
                    </div>
                )}

                {!isLoading && reviews.length === 0 && (
                    <div className="text-center text-gray-400 py-8">No reviews yet.</div>
                )}

                <div className="flex flex-col gap-2">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-start justify-between gap-4"
                        >
                            <div className="flex items-start gap-3">
                                <Avatar src={review.reviewer_avatar ?? undefined} />
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        {review.reviewer_name}
                                        <Tag className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                                            <TbStarFilled className="inline mr-1" />
                                            {review.rates}
                                        </Tag>
                                        {!review.status && (
                                            <Tag className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                Hidden
                                            </Tag>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {review.comment}
                                    </div>
                                </div>
                            </div>
                            {canEdit && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="xs"
                                        icon={<TbEdit />}
                                        onClick={() => openEdit(review)}
                                    />
                                    <Button
                                        size="xs"
                                        icon={<TbTrash />}
                                        onClick={() => setPendingDelete(review)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
                <h4 className="mb-4">{editing ? 'Edit review' : 'New review'}</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Reviewer name">
                        <Controller
                            name="reviewer_name"
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Comment">
                        <Controller
                            name="comment"
                            control={control}
                            render={({ field }) => <Input textArea rows={3} {...field} />}
                        />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-4">
                        <FormItem label="Rating (1-5)">
                            <Controller
                                name="rates"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        min={1}
                                        max={5}
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Visible">
                            <Controller
                                name="status"
                                control={control}
                                render={({ field: { value, onChange } }) => (
                                    <Switcher checked={value} onChange={onChange} />
                                )}
                            />
                        </FormItem>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="plain" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="solid" loading={submitting}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Dialog>

            <Dialog isOpen={seedDialogOpen} onClose={() => setSeedDialogOpen(false)}>
                <h4 className="mb-4">Seed rating distribution</h4>
                <p className="text-sm text-gray-500 mb-4">
                    Blend real reviews with a target public average, spread across a
                    number of seed ratings.
                </p>
                <Form onSubmit={seedForm.handleSubmit(onSubmitSeed)}>
                    <FormItem label="Target average (1-5)">
                        <Controller
                            name="review_seed_average"
                            control={seedForm.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    step="0.1"
                                    min={1}
                                    max={5}
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Seed count">
                        <Controller
                            name="review_seed_total_count"
                            control={seedForm.control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => setSeedDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="solid" loading={seedSubmitting}>
                            Apply
                        </Button>
                    </div>
                </Form>
            </Dialog>

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete review"
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Are you sure you want to delete this review?
            </ConfirmDialog>
        </div>
    )
}

export default AgencyReviewsTab
