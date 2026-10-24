import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Building2, Edit3, Globe2, Map, MapPin, Trash2 } from 'lucide-react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Container from '@/components/shared/Container'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Table from '@/components/ui/Table'
import Tabs from '@/components/ui/Tabs'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import { Form, FormItem } from '@/components/ui/Form'
import usePermission from '@/utils/hooks/usePermission'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    deleteLocation, getLocations, saveLocation,
    type LocationRecord, type LocationType,
} from '@/services/admin/AdminLocationsService'

const types: LocationType[] = ['countries', 'provinces', 'cities', 'areas']
const typeIcons: Record<LocationType, typeof Globe2> = {
    countries: Globe2,
    provinces: Map,
    cities: Building2,
    areas: MapPin,
}
const empty = (): Partial<LocationRecord> => ({ slug: '', name: '', name_en: '', name_ar: '', is_active: true, flag: true })
const ltrFields: Array<keyof LocationRecord> = ['slug', 'iso2', 'name_en']

function errorMessage(cause: unknown, fallback: string): string {
    if (!isAxiosError(cause)) return fallback
    const payload = cause.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    return payload?.errors ? Object.values(payload.errors).flat().join(' ') : payload?.message || fallback
}

export default function LocationsManager() {
    const { can } = usePermission()
    const { t, i18n } = useTranslation()
    const isArabic = i18n.language === 'ar'
    const [type, setType] = useState<LocationType>('areas')
    const [countryId, setCountryId] = useState<number | undefined>()
    const [records, setRecords] = useState<Record<LocationType, LocationRecord[]>>({ countries: [], provinces: [], cities: [], areas: [] })
    const [form, setForm] = useState<Partial<LocationRecord>>(empty)
    const [editingId, setEditingId] = useState<number | undefined>()
    const [pendingDelete, setPendingDelete] = useState<LocationRecord | null>(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [loading, setLoading] = useState(true)

    const displayName = useCallback((record: LocationRecord) => (isArabic
        ? record.name_ar || record.name || record.name_en
        : record.name_en || record.name || record.name_ar) || record.slug, [isArabic])
    const secondaryName = (record: LocationRecord) => {
        const other = isArabic ? record.name_en : record.name_ar
        return other && other !== displayName(record) ? other : ''
    }

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const countries = await getLocations('countries')
            const chosenCountry = countryId ?? countries.data.find((row) => row.iso2 === 'OM')?.id ?? countries.data[0]?.id
            if (chosenCountry && !countryId) setCountryId(chosenCountry)
            const results = await Promise.all(types.slice(1).map((key) => getLocations(key, chosenCountry)))
            setRecords({ countries: countries.data, provinces: results[0].data, cities: results[1].data, areas: results[2].data })
            setError('')
        } catch {
            setError(t('adminLocations.loadError'))
        } finally {
            setLoading(false)
        }
    }, [countryId, t])

    useEffect(() => { void refresh() }, [refresh])

    const countryOptions = useMemo(
        () => records.countries.map((item) => ({ label: displayName(item), value: item.id })),
        [records.countries, displayName],
    )
    const setField = (key: keyof LocationRecord, value: string | number | boolean) =>
        setForm((current) => ({ ...current, [key]: value }))
    const resetForm = (selectedType = type) => {
        setForm({ ...empty(), ...(selectedType === 'countries' ? {} : { country_id: countryId }) })
        setEditingId(undefined)
        setError('')
    }
    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        setBusy(true)
        setError('')
        try {
            await saveLocation(type, form, editingId)
            resetForm()
            await refresh()
        } catch (cause: unknown) {
            setError(errorMessage(cause, t('adminLocations.saveError')))
        } finally {
            setBusy(false)
        }
    }
    const remove = async () => {
        if (!pendingDelete) return
        setBusy(true)
        try {
            await deleteLocation(type, pendingDelete.id)
            setPendingDelete(null)
            await refresh()
        } catch (cause: unknown) {
            setError(errorMessage(cause, t('adminLocations.saveError')))
        } finally {
            setBusy(false)
        }
    }
    const selectType = (value: string | number) => {
        const selectedType = value as LocationType
        setType(selectedType)
        resetForm(selectedType)
    }
    const input = (key: keyof LocationRecord, label: string, required = false) => (
        <FormItem asterisk={required} label={label}>
            <Input
                dir={ltrFields.includes(key) ? 'ltr' : key === 'name_ar' ? 'rtl' : undefined}
                disabled={Boolean(editingId && (key === 'slug' || key === 'iso2'))}
                required={required}
                value={String(form[key] ?? '')}
                onChange={(event) => setField(key, event.target.value)}
            />
        </FormItem>
    )
    const parentSelect = (
        key: 'country_id' | 'state_id' | 'city_id',
        source: LocationType,
        label: string,
        options = records[source],
    ) => {
        const selectOptions = options.map((item) => ({ label: displayName(item), value: item.id }))
        return (
            <FormItem asterisk label={label}>
                <Select
                    isDisabled={Boolean(editingId)}
                    options={selectOptions}
                    value={selectOptions.find((option) => option.value === form[key]) ?? null}
                    onChange={(option) => setField(key, option?.value ?? '')}
                />
            </FormItem>
        )
    }
    const isActive = (record: LocationRecord) => type === 'areas' ? record.is_active : record.flag
    const TypeIcon = typeIcons[type]

    return (
        <Container>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3>{t('adminLocations.title')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('adminLocations.subtitle')}</p>
                </div>
                <Tag className="w-fit bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100">{t('adminLocations.records', { count: records[type].length })}</Tag>
            </div>

            <AdaptiveCard>
                <Tabs value={type} variant="pill" onChange={selectType}>
                    <Tabs.TabList className="mb-6 flex-wrap">
                        {types.map((item) => {
                            const Icon = typeIcons[item]
                            return <Tabs.TabNav key={item} value={item}><span className="flex items-center gap-2"><Icon size={16} />{t(`adminLocations.types.${item}`)}</span></Tabs.TabNav>
                        })}
                    </Tabs.TabList>
                </Tabs>

                {type !== 'countries' && <div className="mb-6 max-w-sm">
                    <FormItem label={t('adminLocations.countryScope')}>
                        <Select
                            options={countryOptions}
                            value={countryOptions.find((option) => option.value === countryId) ?? null}
                            onChange={(option) => {
                                const value = option?.value
                                setCountryId(value)
                                setForm({ ...empty(), country_id: value })
                                setEditingId(undefined)
                            }}
                        />
                    </FormItem>
                </div>}

                {error && <Alert showIcon className="mb-6" type="danger">{error}</Alert>}

                {can(editingId ? 'locations.edit' : 'locations.create') && (
                    <div className="mb-6 rounded-md border border-gray-200 p-5 dark:border-gray-700">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-subtle text-primary"><TypeIcon size={18} /></span>
                            <div>
                                <h5>{editingId ? t('adminLocations.editTitle') : t('adminLocations.addTitle')}</h5>
                                <p className="text-xs text-gray-500">{t(`adminLocations.types.${type}`)}</p>
                            </div>
                        </div>
                        <Form onSubmit={submit}>
                            <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
                                {type === 'countries' && <>{input('name', t('adminLocations.fields.name'), true)}{input('iso2', t('adminLocations.fields.iso2'), true)}</>}
                                {type === 'provinces' && <>{parentSelect('country_id', 'countries', t('adminLocations.fields.country'))}{input('name', t('adminLocations.fields.name'), true)}</>}
                                {type === 'cities' && <>
                                    {parentSelect('country_id', 'countries', t('adminLocations.fields.country'))}
                                    {parentSelect('state_id', 'provinces', t('adminLocations.fields.governorate'), records.provinces.filter((row) => row.country_id === Number(form.country_id)))}
                                    {input('name', t('adminLocations.fields.name'), true)}
                                </>}
                                {type === 'areas' && <>
                                    {parentSelect('city_id', 'cities', t('adminLocations.fields.city'))}
                                    {input('name_en', t('adminLocations.fields.nameEn'), true)}
                                    {input('name_ar', t('adminLocations.fields.nameAr'), true)}
                                    {input('meta_title', t('adminLocations.fields.metaTitle'))}
                                    {input('meta_description', t('adminLocations.fields.metaDescription'))}
                                    <FormItem className="md:col-span-2" label={t('adminLocations.fields.body')}>
                                        <Input textArea rows={4} value={form.body ?? ''} onChange={(event) => setField('body', event.target.value)} />
                                    </FormItem>
                                </>}
                                {input('slug', t('adminLocations.fields.slug'), true)}
                                <FormItem label={t('adminLocations.fields.status')}>
                                    <div className="flex h-11 items-center gap-3">
                                        <Switcher checked={Boolean(type === 'areas' ? form.is_active : form.flag)} onChange={(checked) => setField(type === 'areas' ? 'is_active' : 'flag', checked)} />
                                        <span className="text-sm">{t('adminLocations.active')}</span>
                                    </div>
                                </FormItem>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-gray-200 pt-5 dark:border-gray-700">
                                {editingId && <Button type="button" onClick={() => resetForm()}>{t('adminLocations.cancel')}</Button>}
                                <Button loading={busy} type="submit" variant="solid">{t('adminLocations.save')}</Button>
                            </div>
                        </Form>
                    </div>
                )}

                <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                    <Table>
                        <Table.THead><Table.Tr>
                            <Table.Th>{t('adminLocations.table.name')}</Table.Th><Table.Th>{t('adminLocations.table.slug')}</Table.Th><Table.Th>{t('adminLocations.table.status')}</Table.Th><Table.Th>{t('adminLocations.table.id')}</Table.Th><Table.Th><span className="sr-only">{t('adminLocations.table.actions')}</span></Table.Th>
                        </Table.Tr></Table.THead>
                        <Table.TBody>
                            {!loading && records[type].map((row) => <Table.Tr key={row.id}>
                                <Table.Td><span className="font-semibold">{displayName(row)}</span>{secondaryName(row) && <span className="block text-xs text-gray-500" dir="auto">{secondaryName(row)}</span>}</Table.Td>
                                <Table.Td><code className="text-xs" dir="ltr">{row.slug}</code></Table.Td>
                                <Table.Td><Tag className={isActive(row) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'}>{isActive(row) ? t('adminLocations.active') : t('adminLocations.inactive')}</Tag></Table.Td>
                                <Table.Td>{row.id}</Table.Td>
                                <Table.Td><div className="flex justify-end gap-3">
                                    {can('locations.edit') && <Tooltip title={t('adminLocations.edit')}><button aria-label={t('adminLocations.editLabel')} className="text-lg" type="button" onClick={() => { setForm(row); setEditingId(row.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Edit3 size={18} /></button></Tooltip>}
                                    {can('locations.delete') && isActive(row) && <Tooltip title={t('adminLocations.deactivate')}><button aria-label={t('adminLocations.deactivateLabel')} className="text-lg text-red-600" type="button" onClick={() => setPendingDelete(row)}><Trash2 size={18} /></button></Tooltip>}
                                </div></Table.Td>
                            </Table.Tr>)}
                            {!loading && records[type].length === 0 && <Table.Tr><Table.Td className="py-12 text-center text-gray-500" colSpan={5}>{t('adminLocations.empty')}</Table.Td></Table.Tr>}
                            {loading && <Table.Tr><Table.Td className="py-12 text-center text-gray-500" colSpan={5}>{t('adminLocations.loading')}</Table.Td></Table.Tr>}
                        </Table.TBody>
                    </Table>
                </div>
            </AdaptiveCard>

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title={t('adminLocations.deactivateTitle')}
                cancelText={t('adminLocations.cancel')}
                confirmText={t('adminLocations.deactivate')}
                confirmButtonProps={{ loading: busy }}
                onCancel={() => setPendingDelete(null)}
                onClose={() => setPendingDelete(null)}
                onConfirm={() => void remove()}
            >
                {t('adminLocations.deactivateConfirm', { name: pendingDelete ? displayName(pendingDelete) : '' })}
            </ConfirmDialog>
        </Container>
    )
}
