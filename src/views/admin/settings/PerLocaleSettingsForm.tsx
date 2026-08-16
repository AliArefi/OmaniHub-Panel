import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useForm, Controller } from 'react-hook-form'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Upload from '@/components/ui/Upload'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import useAdminLocales from '@/utils/hooks/useAdminLocales'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiGetPerLocaleSettings,
    apiUpdatePerLocaleSettings,
} from '@/services/admin/AdminSettingsService'
import type { PerLocaleSettingsGroup } from '@/services/admin/AdminSettingsService'

export type SettingsFieldDescriptor = {
    name: string
    label: string
    type?: 'text' | 'textarea' | 'file' | 'url' | 'email'
    rows?: number
}

type PerLocaleSettingsFormProps = {
    group: PerLocaleSettingsGroup
    title: string
    fields: SettingsFieldDescriptor[]
}

/**
 * Generic form for the per-locale settings groups (general/contact-us/
 * about-us/about/faq/store) — one row per locale on the backend, selected
 * via ?locale=. A locale switcher lets an admin working in an English UI
 * still edit the Arabic row (and vice versa).
 */
const PerLocaleSettingsForm = (props: PerLocaleSettingsFormProps) => {
    const { group, title, fields } = props
    const { locales, fallbackLocale } = useAdminLocales()
    const { can } = usePermission()
    const canEdit = can('general settings')
    const [locale, setLocale] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!locale && fallbackLocale) setLocale(fallbackLocale)
    }, [fallbackLocale, locale])

    const { data, mutate } = useSWR(
        locale ? [`admin-settings-${group}`, locale] : null,
        () => apiGetPerLocaleSettings(group, locale),
    )

    const { control, handleSubmit, reset } = useForm<Record<string, unknown>>({
        defaultValues: {},
    })

    useEffect(() => {
        if (data?.data) {
            reset(data.data as Record<string, unknown>)
        }
    }, [data, reset])

    const localeOptions = Object.entries(locales).map(([value, label]) => ({
        value,
        label,
    }))

    const onSubmit = async (values: Record<string, unknown>) => {
        setSubmitting(true)
        try {
            const hasFile = fields.some(
                (f) => f.type === 'file' && values[f.name] instanceof File,
            )

            if (hasFile) {
                const formData = new FormData()
                for (const field of fields) {
                    const value = values[field.name]
                    if (field.type === 'file') {
                        if (value instanceof File) formData.append(field.name, value)
                    } else {
                        formData.append(field.name, (value as string) ?? '')
                    }
                }
                await apiUpdatePerLocaleSettings(group, formData, locale)
            } else {
                await apiUpdatePerLocaleSettings(group, values, locale)
            }

            toast.push(
                <Notification type="success" title="Saved">
                    Settings saved successfully.
                </Notification>,
            )
            mutate()
        } catch {
            toast.push(
                <Notification type="danger" title="Failed to save">
                    Please check the form for errors.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AdaptiveCard>
            <div className="flex items-center justify-between mb-6">
                <h4>{title}</h4>
                <div className="w-40">
                    <Select
                        options={localeOptions}
                        value={localeOptions.find((o) => o.value === locale)}
                        onChange={(option) => option && setLocale(option.value)}
                    />
                </div>
            </div>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((field) => (
                        <FormItem
                            key={field.name}
                            label={field.label}
                            className={
                                field.type === 'textarea' ? 'md:col-span-2' : undefined
                            }
                        >
                            <Controller
                                name={field.name}
                                control={control}
                                render={({ field: rhfField }) => {
                                    if (field.type === 'file') {
                                        return (
                                            <Upload
                                                uploadLimit={1}
                                                onChange={(files) =>
                                                    rhfField.onChange(files[0] ?? null)
                                                }
                                            />
                                        )
                                    }
                                    if (field.type === 'textarea') {
                                        return (
                                            <Input
                                                textArea
                                                rows={field.rows ?? 4}
                                                value={
                                                    typeof rhfField.value === 'string'
                                                        ? rhfField.value
                                                        : ''
                                                }
                                                onChange={rhfField.onChange}
                                            />
                                        )
                                    }
                                    return (
                                        <Input
                                            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
                                            value={
                                                typeof rhfField.value === 'string'
                                                    ? rhfField.value
                                                    : ''
                                            }
                                            onChange={rhfField.onChange}
                                            disabled={!canEdit}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                    ))}
                </div>
                {canEdit && (
                    <div className="flex justify-end mt-6">
                        <Button type="submit" variant="solid" loading={submitting}>
                            Save
                        </Button>
                    </div>
                )}
            </Form>
        </AdaptiveCard>
    )
}

export default PerLocaleSettingsForm
