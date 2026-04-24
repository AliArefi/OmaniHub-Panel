import {
    Agency,
    Cities,
    CreateAgencyServiceRequest,
    CreateAgencyServiceResponse,
    CreateMemberAgencyRequest,
    CreateNewAgencyRequest,
    CreateNewAgencyResponse,
    CreateNewMemberAgencyResponse,
    MemberWorkingHoursRequest,
    MemberWorkingHoursResponse,
    MyAgencyDetails,
    MyAgencyService,
    RequestMyAgencyGallery,
    Services,
    UpdateAgencyRequest,
} from '@/@types/center'
import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'

export async function getMyAgencies() {
    return ApiService.fetchDataWithAxios<{ data: Agency[] }>({
        url: endpointConfig.getMyAgencies,
    })
}

export async function apiGetMyAgency(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ data: MyAgencyDetails }>({
        url: `${endpointConfig.getMyAgencies}/${encodeURIComponent(agencySlug)}`,
    })
}

export async function apiGetMyServices(params?: {
    agency_id?: number
    per_page?: number
    page?: number
}) {
    return ApiService.fetchDataWithAxios<{ data: MyAgencyService[] }>({
        url: '/my-services',
        params,
    })
}

export async function getServices(params?: {
    parent_id?: number
    q?: string
    with_children?: boolean | 0 | 1
    tree?: boolean | 0 | 1
}) {
    return ApiService.fetchDataWithAxios<{ data: Services[] }>({
        url: endpointConfig.getServices,
        params,
    })
}

export async function apiGetCities() {
    return ApiService.fetchDataWithAxios<{ data: Cities[] }>({
        url: endpointConfig.getCities,
    })
}

export async function apiCreateNewAgency(data: CreateNewAgencyRequest) {
    return ApiService.fetchDataWithAxios<CreateNewAgencyResponse>({
        url: endpointConfig.createNewAgency,
        method: 'post',
        data,
    })
}

export async function apiUpdateMyAgency(
    agencySlug: string,
    data: Partial<CreateNewAgencyRequest>,
) {
    return ApiService.fetchDataWithAxios<{
        success: boolean
        message?: string
    }>({
        url: `${endpointConfig.createNewAgency}/${encodeURIComponent(agencySlug)}`,
        method: 'put',
        data,
    })
}

export async function apiUpdateInfoMyAgency(
    agencySlug: string,
    data: Partial<UpdateAgencyRequest>,
) {
    return ApiService.fetchDataWithAxios<{
        success: boolean
        message?: string
    }>({
        url: `${endpointConfig.createNewAgency}/${encodeURIComponent(agencySlug)}`,
        method: 'put',
        data,
    })
}

export async function apiCreateAgencyService(data: CreateAgencyServiceRequest) {
    return ApiService.fetchDataWithAxios<CreateAgencyServiceResponse>({
        url: '/my-services',
        method: 'post',
        data,
    })
}

export async function apiCreateMemberAgency(
    data: CreateMemberAgencyRequest,
    agencyServiceId: number,
) {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('position', data.position)
    formData.append('image', data.image)

    return ApiService.fetchDataWithAxios<CreateNewMemberAgencyResponse>({
        url: `/my-services/${agencyServiceId}/members`,
        method: 'post',
        data: formData,
    })
}

export async function apiMemberWorkingHours(
    data: MemberWorkingHoursRequest,
    member_id: number,
) {
    return ApiService.fetchDataWithAxios<MemberWorkingHoursResponse>({
        url: `/my-service-members/${member_id}/working-hours`,
        method: 'put',
        data,
    })
}

export async function apiGetGallery() {
    return ApiService.fetchDataWithAxios<{ data: any[] }>({
        url: endpointConfig.getGallery,
    })
}

export async function AddGalleryItemMyAgencies(data: RequestMyAgencyGallery | FormData) {
    return ApiService.fetchDataWithAxios<any>({
        url: endpointConfig.getGallery,
        method: 'post',
        data,
    })
}
