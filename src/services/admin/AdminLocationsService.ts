import ApiService from '@/services/ApiService'

export type LocationType = 'countries' | 'provinces' | 'cities' | 'areas'

export type LocationRecord = {
    id: number
    name?: string
    name_en?: string
    name_ar?: string
    slug: string
    iso2?: string
    country_id?: number
    state_id?: number
    city_id?: number
    meta_title?: string | null
    meta_description?: string | null
    body?: string | null
    is_active?: boolean
    flag?: boolean
}

export const getLocations = (type: LocationType, countryId?: number) =>
    ApiService.fetchDataWithAxios<{ data: LocationRecord[] }>({
        url: `/admin/locations/${type}`,
        params: countryId && type !== 'countries' ? { country_id: countryId } : undefined,
    })

export const saveLocation = (type: LocationType, values: Partial<LocationRecord>, id?: number) =>
    ApiService.fetchDataWithAxios<{ data: LocationRecord }>({
        url: `/admin/locations/${type}${id ? `/${id}/update` : ''}`,
        method: 'post',
        data: values,
    })

export const deleteLocation = (type: LocationType, id: number) =>
    ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/admin/locations/${type}/${id}/delete`,
        method: 'post',
    })
