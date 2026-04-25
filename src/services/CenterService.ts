import {
    Agency,
    AgencyMediaItem,
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
    MyAgencyMediaResponse,
    MyAgencyService,
    TeamMemberApiResponse,
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

export async function apiDeleteMyAgency(agencySlug: string) {
    return ApiService.fetchDataWithAxios<{ success: boolean; message?: string }>({
        url: `${endpointConfig.getMyAgencies}/${encodeURIComponent(agencySlug)}`,
        method: 'delete',
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
        method: 'post',
        data,
    })
}

export async function apiUpdateInfoMyAgency(
    agencySlug: string,
    data: Partial<UpdateAgencyRequest> | FormData,
) {
    return ApiService.fetchDataWithAxios<{
        success: boolean
        message?: string
    }>({
        url: `${endpointConfig.createNewAgency}/${encodeURIComponent(agencySlug)}`,
        method: 'post',
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

export async function apiGetServiceMembers(agencyServiceId: number) {
    return ApiService.fetchDataWithAxios<{ data: TeamMemberApiResponse[] }>({
        url: `/my-services/${agencyServiceId}/members`,
    })
}

export async function apiUpdateServiceMember(
    agencyServiceId: number,
    memberId: number,
    data: Partial<{
        name: string
        position: string
        image: File
    }>,
) {
    const formData = new FormData()
    if (typeof data.name === 'string') formData.append('name', data.name)
    if (typeof data.position === 'string')
        formData.append('position', data.position)
    if (data.image instanceof File) formData.append('image', data.image)

    return ApiService.fetchDataWithAxios<{ success: boolean; message?: string }>({
        url: `/my-services/${agencyServiceId}/members/${memberId}`,
        method: 'put',
        data: formData,
    })
}

export async function apiDeleteServiceMember(
    agencyServiceId: number,
    memberId: number,
) {
    return ApiService.fetchDataWithAxios<{ success: boolean; message?: string }>({
        url: `/my-services/${agencyServiceId}/members/${memberId}`,
        method: 'delete',
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

export async function apiGetMemberWorkingHours(member_id: number) {
    return ApiService.fetchDataWithAxios<MemberWorkingHoursResponse>({
        url: `/my-service-members/${member_id}/working-hours`,
    })
}

export async function apiGetMyAgencyMedia(agencySlug: string) {
    return ApiService.fetchDataWithAxios<MyAgencyMediaResponse>({
        url: `/my-agencies/${encodeURIComponent(agencySlug)}/media`,
    })
}

export async function apiUploadMyAgencyMedia(
    agencySlug: string,
    data: FormData,
) {
    return ApiService.fetchDataWithAxios<{
        success: boolean
        message?: string
        data?: AgencyMediaItem
    }>({
        url: `/my-agencies/${encodeURIComponent(agencySlug)}/media/upload`,
        method: 'post',
        data,
    })
}

export async function apiUpdateMyAgencyMedia(
    agencySlug: string,
    mediaId: number,
    data: Record<string, unknown>,
) {
    return ApiService.fetchDataWithAxios<{
        success: boolean
        message?: string
        data?: AgencyMediaItem
    }>({
        url: `/my-agencies/${encodeURIComponent(agencySlug)}/media/${mediaId}/update`,
        method: 'post',
        data,
    })
}

export async function apiDeleteMyAgencyMedia(agencySlug: string, mediaId: number) {
    return ApiService.fetchDataWithAxios<{
        success: boolean
        message?: string
    }>({
        url: `/my-agencies/${encodeURIComponent(agencySlug)}/media/${mediaId}/delete`,
        method: 'post',
    })
}

export async function apiSetFeaturedMyAgencyMedia(
    agencySlug: string,
    mediaId: number,
) {
    return ApiService.fetchDataWithAxios<{
        success: boolean
        message?: string
        data?: AgencyMediaItem
    }>({
        url: `/my-agencies/${encodeURIComponent(agencySlug)}/media/${mediaId}/set-featured`,
        method: 'post',
    })
}
