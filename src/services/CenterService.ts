import {
    CreateAgencyServiceRequest,
    CreateAgencyServiceResponse,
    CreateMemberAgencyRequest,
    CreateNewAgencyRequest,
    CreateNewAgencyResponse,
    CreateNewMemberAgencyResponse,
    MemberWorkingHoursRequest,
    MemberWorkingHoursResponse,
} from '@/@types/center'
import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'

export async function getMyAgencies() {
    return ApiService.fetchDataWithAxios<unknown>({
        url: endpointConfig.getMyAgencies,
    })
}

export async function getServices() {
    return ApiService.fetchDataWithAxios<unknown>({
        url: endpointConfig.getServices,
    })
}

export async function apiCreateNewAgency(data: CreateNewAgencyRequest) {
    return ApiService.fetchDataWithAxios<CreateNewAgencyResponse>({
        url: endpointConfig.createNewAgency,
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
