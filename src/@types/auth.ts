export type SignInCredential = {
    email: string
    password: string
}

export type SignInResponse = {
    success: boolean
    message: string
    token: string
    has_active_store: boolean
    has_active_agency: boolean
    user: {
        id: number
        name: string
        email: string
        avatar: string | null
        email_verified_at: string | null
        google_id: string | null
        facebook_id: string | null
        twitter_id: string | null
        github_id: string | null
        deleted_at: string | null
        created_at: string
        updated_at: string
        otp: string | null
        otp_expires_at: string | null
    }
}


export type SignUpResponse = SignInResponse

export type SignUpCredential = {
    name: string
    email: string
    password: string
}

export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    password: string
}

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
}>

// export type User = {
//     userId?: string | null
//     avatar?: string | null
//     userName?: string | null
//     email?: string | null
//     authority?: string[]
// }

export type User = {
    id?: number | null
    name?: string | null
    email?: string | null
    avatar?: string | null
    email_verified_at?: string | null
    google_id?: string | null
    facebook_id?: string | null
    twitter_id?: string | null
    github_id?: string | null
    deleted_at?: string | null
    created_at?: string | null
    updated_at?: string | null
    otp?: string | null
    otp_expires_at?: string | null
    hasActiveStore?: boolean
    hasActiveAgency?: boolean
}

// export type 

export type Token = {
    accessToken: string
    refereshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
