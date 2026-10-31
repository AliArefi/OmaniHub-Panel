import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import type { LocationRecord } from '@/services/admin/AdminLocationsService'
import ApiService from '@/services/ApiService'

type Props = { cityId: number | null; areaId: number | null; onChange: (cityId: number | null, areaId: number | null) => void }

export default function ProviderLocationFields({ cityId, areaId, onChange }: Props) {
    const [countryId, setCountryId] = useState<number | null>(null)
    const { data, error } = useSWR('provider-location-options', () => ApiService.fetchDataWithAxios<{ countries: LocationRecord[]; cities: LocationRecord[]; areas: LocationRecord[] }>({ url: '/admin/provider-location-options' }))
    const countries = { data: data?.countries ?? [] }
    const cities = data?.cities
    const areas = { data: data?.areas ?? [] }
    useEffect(() => {
        const city = cities?.find((item) => item.id === cityId)
        if (city?.country_id) setCountryId(city.country_id)
    }, [cities, cityId])
    const countryOptions = (countries?.data ?? []).map((item) => ({ value: item.id, label: item.name || item.name_en || item.slug }))
    const cityOptions = (cities ?? []).filter((item) => !countryId || item.country_id === countryId).map((item) => ({ value: item.id, label: item.name || item.name_en || item.slug }))
    const areaOptions = (areas?.data ?? []).filter((item) => item.city_id === cityId).map((item) => ({ value: item.id, label: item.name_ar || item.name_en || item.slug }))
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {error && <p role="alert" className="md:col-span-3 text-red-600">تعذر تحميل المواقع / Unable to load locations.</p>}
        <FormItem label="Country / الدولة"><Select isClearable options={countryOptions} value={countryOptions.find((item) => item.value === countryId) ?? null} onChange={(item) => { setCountryId(item?.value ?? null); onChange(null, null) }} /></FormItem>
        <FormItem label="City / المدينة"><Select isClearable options={cityOptions} value={cityOptions.find((item) => item.value === cityId) ?? null} onChange={(item) => onChange(item?.value ?? null, null)} /></FormItem>
        <FormItem label="Neighborhood / الحي"><Select isClearable isDisabled={!cityId} options={areaOptions} value={areaOptions.find((item) => item.value === areaId) ?? null} onChange={(item) => onChange(cityId, item?.value ?? null)} /></FormItem>
    </div>
}
