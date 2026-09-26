import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import useSWR from 'swr'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import Select from '@/components/ui/Select'
import toast from '@/components/ui/toast'
import { Form, FormItem } from '@/components/ui/Form'
import {
    apiCreateFilterOnlyAdminService,
    apiGetAdminServiceTree,
} from '@/services/admin/AdminServicesService'
import useTranslation from '@/utils/hooks/useTranslation'

type FormValues = {
    title: string
    name: string
    body: string
    status: 'pending' | 'draft' | 'published'
    service_id: number | null
    order_number: number
}

const FilterOnlyServiceForm = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)
    const { data: treeData } = useSWR('admin-service-tree', () =>
        apiGetAdminServiceTree(),
    )
    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: {
            title: '',
            name: '',
            body: '',
            status: 'published',
            service_id: null,
            order_number: 1,
        },
    })

    const statusOptions = [
        {
            label: t('adminServiceForm.status.pending'),
            value: 'pending' as const,
        },
        { label: t('adminServiceForm.status.draft'), value: 'draft' as const },
        {
            label: t('adminServiceForm.status.published'),
            value: 'published' as const,
        },
    ]
    const parentOptions = (treeData?.data ?? []).map((option) => ({
        label: option.label,
        value: option.id,
    }))

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true)
        try {
            await apiCreateFilterOnlyAdminService(values)
            toast.push(
                <Notification
                    type="success"
                    title={t('adminServiceForm.savedTitle')}
                >
                    {t('adminFilterOnlyService.saved')}
                </Notification>,
            )
            navigate('/admin/services')
        } catch {
            toast.push(
                <Notification
                    type="danger"
                    title={t('adminServiceForm.saveErrorTitle')}
                >
                    {t('adminServiceForm.saveError')}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Container>
            <AdaptiveCard>
                <h3>{t('adminFilterOnlyService.title')}</h3>
                <p className="mt-2 mb-6 text-sm text-gray-500">
                    {t('adminFilterOnlyService.description')}
                </p>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormItem
                            asterisk
                            label={t('adminServiceForm.fields.title')}
                        >
                            <Controller
                                name="title"
                                control={control}
                                rules={{ required: true, maxLength: 255 }}
                                render={({ field }) => (
                                    <Input {...field} maxLength={255} />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            asterisk
                            label={t('adminServiceForm.fields.name')}
                        >
                            <Controller
                                name="name"
                                control={control}
                                rules={{ required: true, maxLength: 255 }}
                                render={({ field }) => (
                                    <Input {...field} maxLength={255} />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label={t('adminServiceForm.fields.parentService')}
                        >
                            <Controller
                                name="service_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        isClearable
                                        options={parentOptions}
                                        value={parentOptions.find(
                                            (option) =>
                                                option.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(
                                                option?.value ?? null,
                                            )
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            asterisk
                            label={t('adminServiceForm.fields.status')}
                        >
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find(
                                            (option) =>
                                                option.value === field.value,
                                        )}
                                        onChange={(option) =>
                                            field.onChange(option?.value)
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label={t('adminServiceForm.fields.orderNumber')}
                        >
                            <Controller
                                name="order_number"
                                control={control}
                                rules={{ min: 0 }}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        min={0}
                                        {...field}
                                        onChange={(event) =>
                                            field.onChange(
                                                Number(event.target.value),
                                            )
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            asterisk
                            className="md:col-span-2"
                            label={t(
                                'adminFilterOnlyService.filterDescription',
                            )}
                        >
                            <Controller
                                name="body"
                                control={control}
                                rules={{
                                    required: true,
                                    maxLength: 255,
                                    validate: (value) => !/[\r\n]/.test(value),
                                }}
                                render={({ field }) => (
                                    <Input {...field} maxLength={255} />
                                )}
                            />
                        </FormItem>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={() => navigate('/admin/services')}
                        >
                            {t('adminServiceForm.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={submitting}
                        >
                            {t('adminServiceForm.save')}
                        </Button>
                    </div>
                </Form>
            </AdaptiveCard>
        </Container>
    )
}

export default FilterOnlyServiceForm
