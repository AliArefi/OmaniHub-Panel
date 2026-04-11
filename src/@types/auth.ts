export type OtpChannel = 'auto' | 'sms' | 'whatsapp' | 'email'

export type SignInCredential = {
    email: string
    password: string
    otp_channel?: OtpChannel
}

export type SignUpCredential = {
    name: string
    mobile: string
    mobile_country_code?: string
    mobile_local_number?: string
    email?: string
    password: string
    password_confirmation: string
    otp_channel?: OtpChannel
}

export type VerifyOtpRequest = {
    challenge_id: string
    otp: string
}

export type ResendOtpRequest = {
    challenge_id: string
}

export type GoogleLoginRequest = {
    id_token: string
    otp_channel?: OtpChannel
}

export type GoogleRegisterRequest = {
    id_token: string
    mobile: string
    mobile_country_code?: string
    mobile_local_number?: string
    otp_channel?: OtpChannel
}

export type AuthNextStep =
    | 'otp_verify'
    | 'authenticated'
    | 'register'
    | 'login'
    | 'wait'
    | null

export type AuthChallengeMeta = {
    auth_state?: string
    challenge_type?: string
    purpose?: string
    identifier?: string
    channel?: string
    delivery_driver?: string
    delivery_channel?: string
    attempt_count?: number
    attempts_remaining?: number
    resend_count?: number
    resends_remaining?: number
    blocked_until?: string | null
    mfa_required?: boolean
    otp_policy?: 'required' | 'optional' | 'disabled' | string
    otp_required?: boolean
    prefill?: {
        email?: string | null
        name?: string | null
        avatar_url?: string | null
    }
}

export type AuthUser = {
    id: number
    name: string | null
    email: string | null
    avatar: string | null
    has_active_store?: boolean
    has_active_agency?: boolean
    created_at?: string | null
}

export type AuthChallengeResponse = {
    success: boolean
    message: string
    challenge_id: string | null
    next_step: AuthNextStep
    expires_at: string | null
    user: AuthUser | null
    token: string | null
    meta: AuthChallengeMeta | Record<string, never>
}

export type AuthConfigResponse = {
    otp: {
        enabled: boolean
        login_flow_mode: string
        registration_flow_mode: string
        code_length: number
        resend_cooldown_seconds: number
        expires_in_seconds: number
        static_code_hint: string | null
        default_auth_identifier_mode: string
        allow_email_identifier_fallback: boolean
        login_otp_channel_policy: string
        registration_otp_channel_policy: string
    }
    oauth: {
        google_client_id: string | null
    }
}

export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    password: string
    // kept as-is; server contract requires more fields, but UI in this template may differ
}

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
    fieldErrors?: Record<string, string[]>
}>

export type User = {
    id?: number | null
    name?: string | null
    email?: string | null
    avatar?: string | null
    has_active_store?: boolean
    has_active_agency?: boolean
    created_at?: string | null
    authority?: string[]
}

export type Token = {
    accessToken: string
    refereshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
