import { useMemo } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import { Tabs } from '@/components/ui/Tabs'
import { FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Tag from '@/components/ui/Tag'
import RichTextEditor from '@/components/shared/RichTextEditor'
import useAdminLocales from '@/utils/hooks/useAdminLocales'
import type { Control, FieldErrors } from 'react-hook-form'

export type LocalizedFieldGroup = 'content' | 'seo'
export type LocalizedFieldType = 'text' | 'url' | 'textarea' | 'richtext'

export type LocalizedFieldDescriptor = {
    name: string
    label: string
    group: LocalizedFieldGroup
    type?: LocalizedFieldType
    rows?: number
    maxLength?: number
    help?: string
}

type TranslationsShape = Record<string, Record<string, string | null | undefined>>

type LocalizedFieldsTabsProps = {
    fields: LocalizedFieldDescriptor[]
    requiredFields?: string[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors?: FieldErrors<any>
}

const GROUP_LABELS: Record<LocalizedFieldGroup, string> = {
    content: 'Content',
    seo: 'SEO',
}

/**
 * React port of resources/views/admin/includes/localized-fields.blade.php —
 * one tab per active locale (from GET /admin/meta/locales), grouped fields,
 * dir set per-locale, and the same Complete/Draft/Fallback badge logic
 * (required-field completeness is checked on the fallback locale only,
 * matching App\Services\Localization\TranslatableContentSync).
 *
 * Fields are registered on the parent react-hook-form instance as
 * `translations.<locale>.<field>` — pass that same `control` in.
 */
function LocalizedFieldsTabs(props: LocalizedFieldsTabsProps) {
    const { fields, requiredFields = [], control, errors } = props
    const { locales, localeMeta, fallbackLocale, isLoading } = useAdminLocales()

    const localeKeys = useMemo(() => Object.keys(locales), [locales])
    const translations: TranslationsShape = useWatch({
        control,
        name: 'translations',
    }) ?? {}

    if (isLoading || localeKeys.length === 0) {
        return null
    }

    const groups: LocalizedFieldGroup[] = ['content', 'seo']

    return (
        <Tabs defaultValue={localeKeys[0]}>
            <Tabs.TabList>
                {localeKeys.map((locale) => {
                    const values = translations[locale] ?? {}
                    const complete =
                        requiredFields.length === 0 ||
                        requiredFields.every((field) => Boolean(values[field]?.trim?.()))

                    return (
                        <Tabs.TabNav key={locale} value={locale}>
                            <span className="flex items-center gap-2">
                                {locales[locale]}
                                <Tag
                                    className={
                                        complete
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100'
                                    }
                                >
                                    {complete ? 'Complete' : 'Draft'}
                                </Tag>
                                {locale === fallbackLocale && (
                                    <Tag className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100">
                                        Fallback
                                    </Tag>
                                )}
                            </span>
                        </Tabs.TabNav>
                    )
                })}
            </Tabs.TabList>
            {localeKeys.map((locale) => {
                const direction = localeMeta[locale]?.direction ?? 'ltr'

                return (
                    <Tabs.TabContent key={locale} value={locale}>
                        {groups.map((group) => {
                            const groupFields = fields.filter((f) => f.group === group)
                            if (groupFields.length === 0) return null

                            return (
                                <div key={group} className="mb-6">
                                    <h6 className="mb-3 font-semibold">
                                        {GROUP_LABELS[group]}
                                    </h6>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {groupFields.map((field) => {
                                            const fieldName = `translations.${locale}.${field.name}`
                                            const fieldErrors = errors?.translations as
                                                | Record<string, Record<string, { message?: string }>>
                                                | undefined
                                            const errorMessage =
                                                fieldErrors?.[locale]?.[field.name]?.message

                                            return (
                                                <FormItem
                                                    key={fieldName}
                                                    label={field.label}
                                                    asterisk={
                                                        locale === fallbackLocale &&
                                                        requiredFields.includes(field.name)
                                                    }
                                                    invalid={Boolean(errorMessage)}
                                                    errorMessage={errorMessage}
                                                    extra={field.help}
                                                    className={
                                                        field.type === 'textarea' ||
                                                        field.type === 'richtext'
                                                            ? 'md:col-span-2'
                                                            : undefined
                                                    }
                                                >
                                                    <Controller
                                                        name={fieldName}
                                                        control={control}
                                                        render={({ field: rhfField }) => {
                                                            if (field.type === 'richtext') {
                                                                return (
                                                                    <div dir={direction}>
                                                                        <RichTextEditor
                                                                            content={rhfField.value ?? ''}
                                                                            onChange={({ html }) =>
                                                                                rhfField.onChange(html)
                                                                            }
                                                                        />
                                                                    </div>
                                                                )
                                                            }

                                                            if (field.type === 'textarea') {
                                                                return (
                                                                    <Input
                                                                        {...rhfField}
                                                                        textArea
                                                                        dir={direction}
                                                                        rows={field.rows ?? 4}
                                                                        maxLength={field.maxLength}
                                                                        value={rhfField.value ?? ''}
                                                                    />
                                                                )
                                                            }

                                                            return (
                                                                <Input
                                                                    {...rhfField}
                                                                    type={field.type === 'url' ? 'url' : 'text'}
                                                                    dir={direction}
                                                                    maxLength={field.maxLength}
                                                                    value={rhfField.value ?? ''}
                                                                />
                                                            )
                                                        }}
                                                    />
                                                </FormItem>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </Tabs.TabContent>
                )
            })}
        </Tabs>
    )
}

export default LocalizedFieldsTabs
