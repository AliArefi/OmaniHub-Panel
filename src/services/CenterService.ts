import { CreateNewAgencyRequest, CreateNewAgencyResponse } from '@/@types/center'
import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'

export async function getMyAgencies() {
    return ApiService.fetchDataWithAxios<any>({
        url: endpointConfig.getMyAgencies
    })
}

export async function getServices() {
    return ApiService.fetchDataWithAxios<any>({
        url: endpointConfig.getServices
    })
}

export async function apiCreateNewAgency(data: CreateNewAgencyRequest) {
    return ApiService.fetchDataWithAxios<CreateNewAgencyResponse>({
        url: endpointConfig.createNewAgency,
        method: 'post',
        data,
    })
}