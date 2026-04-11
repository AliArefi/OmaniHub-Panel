import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    AuthChallengeResponse,
    GoogleLoginRequest,
    GoogleRegisterRequest,
} from '@/@types/auth'

export async function apiGoogleOauthLogin(data: GoogleLoginRequest) {
    return ApiService.fetchDataWithAxios<AuthChallengeResponse>({
        url: endpointConfig.googleLogin,
        method: 'post',
        data,
    })
}

export async function apiGoogleOauthRegister(data: GoogleRegisterRequest) {
    return ApiService.fetchDataWithAxios<AuthChallengeResponse>({
        url: endpointConfig.googleRegister,
        method: 'post',
        data,
    })
}

