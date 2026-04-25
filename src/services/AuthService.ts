import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    SignInCredential,
    SignUpCredential,
    ForgotPassword,
    ResetPassword,
    AuthChallengeResponse,
    AuthConfigResponse,
    VerifyOtpRequest,
    ResendOtpRequest,
    AuthUser,
} from '@/@types/auth'

export async function apiSignIn(data: SignInCredential) {
    return ApiService.fetchDataWithAxios<AuthChallengeResponse>({
        url: endpointConfig.signIn,
        method: 'post',
        data,
    })
}

export async function apiSignUp(data: SignUpCredential) {
    return ApiService.fetchDataWithAxios<AuthChallengeResponse>({
        url: endpointConfig.signUp,
        method: 'post',
        data,
    })
}

export async function apiSignOut() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.signOut,
        method: 'post',
    })
}

export async function apiAuthMe() {
    return ApiService.fetchDataWithAxios<{
        authenticated: boolean
        user: AuthUser
    }>({
        url: '/auth/me',
        method: 'get',
    })
}

export async function apiAuthConfig() {
    return ApiService.fetchDataWithAxios<AuthConfigResponse>({
        url: endpointConfig.authConfig,
        method: 'get',
    })
}

export async function apiVerifyOtp(data: VerifyOtpRequest) {
    return ApiService.fetchDataWithAxios<AuthChallengeResponse>({
        url: endpointConfig.otpVerify,
        method: 'post',
        data,
    })
}

export async function apiResendOtp(data: ResendOtpRequest) {
    return ApiService.fetchDataWithAxios<AuthChallengeResponse>({
        url: endpointConfig.otpResend,
        method: 'post',
        data,
    })
}

export async function apiForgotPassword<T>(data: ForgotPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.forgotPassword,
        method: 'post',
        data,
    })
}

export async function apiResetPassword<T>(data: ResetPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.resetPassword,
        method: 'post',
        data,
    })
}
