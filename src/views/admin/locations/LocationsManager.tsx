import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import usePermission from '@/utils/hooks/usePermission'
import {
    deleteLocation, getLocations, saveLocation,
    type LocationRecord, type LocationType,
} from '@/services/admin/AdminLocationsService'

const types: LocationType[] = ['countries', 'provinces', 'cities', 'areas']
const labels: Record<LocationType, string> = {
    countries: 'Countries / الدول',
    provinces: 'Governorates / المحافظات',
    cities: 'Cities & Wilayats / المدن والولايات',
    areas: 'Neighborhoods / الأحياء',
}

const empty = (): Partial<LocationRecord> => ({ slug: '', name: '', name_en: '', name_ar: '', is_active: true, flag: true })

function errorMessage(cause: unknown): string {
    if (!isAxiosError(cause)) return 'Unable to save location.'
    const payload = cause.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    return payload?.errors ? Object.values(payload.errors).flat().join(' ') : payload?.message || 'Unable to save location.'
}

export default function LocationsManager() {
    const { can } = usePermission()
    const [type, setType] = useState<LocationType>('areas')
    const [countryId, setCountryId] = useState<number | undefined>()
    const [records, setRecords] = useState<Record<LocationType, LocationRecord[]>>({ countries: [], provinces: [], cities: [], areas: [] })
    const [form, setForm] = useState<Partial<LocationRecord>>(empty)
    const [editingId, setEditingId] = useState<number | undefined>()
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const refresh = useCallback(async () => {
        try {
            const countries = await getLocations('countries')
            const chosenCountry = countryId ?? countries.data.find((row) => row.iso2 === 'OM')?.id ?? countries.data[0]?.id
            if (chosenCountry && !countryId) setCountryId(chosenCountry)
            const results = await Promise.all(types.slice(1).map((key) => getLocations(key, chosenCountry)))
            setRecords({ countries: countries.data, provinces: results[0].data, cities: results[1].data, areas: results[2].data })
            setError('')
        } catch {
            setError('تعذر تحميل المواقع / Unable to load locations.')
        }
    }, [countryId])

    useEffect(() => { void refresh() }, [refresh])

    const setField = (key: keyof LocationRecord, value: string | number | boolean) =>
        setForm((current) => ({ ...current, [key]: value }))

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        setBusy(true)
        setError('')
        try {
            await saveLocation(type, form, editingId)
            setForm(empty())
            setEditingId(undefined)
            await refresh()
        } catch (cause: unknown) {
            setError(errorMessage(cause))
        } finally {
            setBusy(false)
        }
    }

    const remove = async (record: LocationRecord) => {
        if (!window.confirm(`Deactivate ${record.name_en || record.name || record.slug}?`)) return
        try {
            await deleteLocation(type, record.id)
            await refresh()
        } catch (cause: unknown) {
            setError(errorMessage(cause))
        }
    }

    const select = (type: LocationType) => {
        setType(type)
        setForm({ ...empty(), country_id: countryId })
        setEditingId(undefined)
        setError('')
    }

    const input = (key: keyof LocationRecord, label: string, required = false) => (
        <label className="flex flex-col gap-1 text-sm">
            <span>{label}</span>
            <input className="input input-md border rounded-md px-3 py-2" required={required}
                disabled={Boolean(editingId && (key === 'slug' || key === 'iso2'))}
                value={String(form[key] ?? '')} onChange={(event) => setField(key, event.target.value)} />
        </label>
    )

    const parentSelect = (key: 'country_id' | 'state_id' | 'city_id', source: LocationType, label: string, options = records[source]) => (
        <label className="flex flex-col gap-1 text-sm">
            <span>{label}</span>
            <select required className="border rounded-md px-3 py-2" value={form[key] ?? ''}
                disabled={Boolean(editingId)}
                onChange={(event) => setField(key, Number(event.target.value))}>
                <option value="">Select / اختر</option>
                {options.map((item) => <option key={item.id} value={item.id}>{item.name_en || item.name || item.slug}</option>)}
            </select>
        </label>
    )

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Locations / المواقع</h1>
            <div className="flex flex-wrap gap-2" role="tablist">
                {types.map((item) => <button key={item} role="tab" aria-selected={type === item} type="button"
                    className={`rounded-md px-4 py-2 ${type === item ? 'bg-primary text-white' : 'border'}`}
                    onClick={() => select(item)}>{labels[item]}</button>)}
            </div>
            {type !== 'countries' && <label className="flex flex-col gap-1 text-sm max-w-sm">
                <span>Country scope / الدولة</span>
                <select className="border rounded-md px-3 py-2" value={countryId ?? ''} onChange={(event) => {
                    const value = Number(event.target.value)
                    setCountryId(value)
                    setForm({ ...empty(), country_id: value })
                    setEditingId(undefined)
                }}>
                    {records.countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
                </select>
            </label>}
            {error && <p role="alert" className="text-red-600">{error}</p>}
            {(can(editingId ? 'locations.edit' : 'locations.create')) && <form className="grid gap-4 rounded-lg border p-5 md:grid-cols-2" onSubmit={submit}>
                {type === 'countries' && <>{input('name', 'Name / الاسم', true)}{input('iso2', 'ISO 2', true)}</>}
                {type === 'provinces' && <>{parentSelect('country_id', 'countries', 'Country / الدولة')}{input('name', 'Name / الاسم', true)}</>}
                {type === 'cities' && <>
                    {parentSelect('country_id', 'countries', 'Country / الدولة')}
                    {parentSelect('state_id', 'provinces', 'Governorate / المحافظة', records.provinces.filter((row) => row.country_id === Number(form.country_id)))}
                    {input('name', 'Name / الاسم', true)}
                </>}
                {type === 'areas' && <>
                    {parentSelect('city_id', 'cities', 'City or Wilayat / المدينة أو الولاية')}
                    {input('name_en', 'English name', true)}
                    {input('name_ar', 'الاسم العربي', true)}
                    {input('meta_title', 'SEO title')}
                    {input('meta_description', 'SEO description')}
                    <label className="flex flex-col gap-1 text-sm md:col-span-2"><span>Area text / وصف المنطقة</span>
                        <textarea className="border rounded-md px-3 py-2" rows={4} value={form.body ?? ''}
                            onChange={(event) => setField('body', event.target.value)} /></label>
                </>}
                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(type === 'areas' ? form.is_active : form.flag)}
                    onChange={(event) => setField(type === 'areas' ? 'is_active' : 'flag', event.target.checked)} />Active / نشط</label>
                {input('slug', 'Permanent English slug', true)}
                <div className="flex items-end gap-2"><button className="rounded-md bg-primary px-4 py-2 text-white" disabled={busy} type="submit">Save / حفظ</button>
                    {editingId && <button className="rounded-md border px-4 py-2" type="button" onClick={() => { setForm(empty()); setEditingId(undefined) }}>Cancel</button>}</div>
            </form>}
            <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead><tr>
                <th className="p-3 text-start">Name / الاسم</th><th className="p-3 text-start">Slug</th><th className="p-3 text-start">ID</th><th className="p-3 text-start">Actions</th>
            </tr></thead><tbody>{records[type].map((row) => <tr key={row.id} className="border-t">
                <td className="p-3">{row.name_en || row.name || row.slug} {row.name_ar && ` / ${row.name_ar}`}</td>
                <td className="p-3" dir="ltr">{row.slug}</td><td className="p-3">{row.id}</td>
                <td className="p-3 space-x-2">{can('locations.edit') && <button type="button" onClick={() => { setForm(row); setEditingId(row.id) }}>Edit</button>}
                    {can('locations.delete') && (type === 'areas' ? row.is_active : row.flag) && <button type="button" className="text-red-600" onClick={() => void remove(row)}>Deactivate</button>}</td>
            </tr>)}</tbody></table></div>
        </div>
    )
}
