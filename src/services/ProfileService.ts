import ApiService from './ApiService'

export type UpdateProfileResponse = {
    success: boolean
    message?: string
}

export type UpdateProfileRequest = {
    name: string
    avatar?: File | null
}

export const toUpdateProfileFormData = (payload: UpdateProfileRequest) => {
    const formData = new FormData()
    formData.append('name', payload.name)
    if (payload.avatar) {
        formData.append('avatar', payload.avatar)
    }
    return formData
}

export async function apiUpdateProfile(data: FormData) {
    return ApiService.fetchDataWithAxios<UpdateProfileResponse, FormData>({
        url: '/profile',
        method: 'post',
        data,
    })
}
