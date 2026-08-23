import ApiService from './ApiService'

export type UpdateProfileResponse = {
    success: boolean
    message?: string
}

export type UpdateProfileRequest = {
    name: string
    bio?: string
    avatar?: File | null
    current_password?: string
    new_password?: string
}

export const toUpdateProfileFormData = (payload: UpdateProfileRequest) => {
    const formData = new FormData()
    if (payload.name) {
        formData.append('name', payload.name)
    }
    if (payload.bio !== undefined) {
        formData.append('bio', payload.bio)
    }
    if (payload.avatar) {
        formData.append('avatar', payload.avatar)
    }
    if (payload.current_password) {
        formData.append('current_password', payload.current_password)
    }
    if (payload.new_password) {
        formData.append('new_password', payload.new_password)
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
