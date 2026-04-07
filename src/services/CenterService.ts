import {
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
    return ApiService.fetchDataWithAxios<any>({
        url: endpointConfig.getMyAgencies,
    })
}

export async function getServices() {
    return ApiService.fetchDataWithAxios<any>({
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

export async function apiCreateMemberAgency(
    data: CreateMemberAgencyRequest,
    slug: string,
) {
    return ApiService.fetchDataWithAxios<CreateNewMemberAgencyResponse>({
        url: `/my-services/${slug}/members`,
        method: 'post',
        data,
    })
}

export async function apiMemberWorkingHours(
    data: MemberWorkingHoursRequest,
    member_id: string,
) {
    return ApiService.fetchDataWithAxios<MemberWorkingHoursResponse>({
        url: `api/1/my-service-members/${member_id}/working-hours`,
        method: 'put',
        data,
    })
}
