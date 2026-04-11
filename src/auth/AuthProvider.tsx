import { useRef, useImperativeHandle, useState } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import { apiSignIn, apiSignOut, apiSignUp } from '@/services/AuthService'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router'
import { useAuthChallengeStore } from '@/store/authChallengeStore'
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    OauthSignInCallbackPayload,
    User,
    Token,
    AuthChallengeResponse,
} from '@/@types/auth'
import type { ReactNode, Ref } from 'react'
import type { NavigateFunction } from 'react-router'

type AuthProviderProps = { children: ReactNode }

export type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

const IsolatedNavigator = ({ ref }: { ref: Ref<IsolatedNavigatorRef> }) => {
    const navigate = useNavigate()

    useImperativeHandle(ref, () => {
        return {
            navigate,
        }
    }, [navigate])

    return <></>
}

function AuthProvider({ children }: AuthProviderProps) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const setSessionSignedIn = useSessionUser(
        (state) => state.setSessionSignedIn,
    )
    const { token, setToken } = useToken()
    const [tokenState, setTokenState] = useState(token)
    const setPendingChallenge = useAuthChallengeStore((s) => s.setPending)
    const clearPendingChallenge = useAuthChallengeStore((s) => s.clear)

    const authenticated = Boolean(tokenState && signedIn)

    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        navigatorRef.current?.navigate(
            redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath,
        )
    }

    const handleSignIn = (tokens: Token, user?: User) => {
        clearPendingChallenge()
        setToken(tokens.accessToken)
        setTokenState(tokens.accessToken)
        setSessionSignedIn(true)

        if (user) {
            setUser(user)
        }
    }

    const handleSignOut = () => {
        setToken('')
        setUser({})
        setSessionSignedIn(false)
        clearPendingChallenge()
    }

    const completeAuth = (resp: AuthChallengeResponse) => {
        if (resp?.success && resp.next_step === 'authenticated' && resp.token) {
            handleSignIn(
                { accessToken: resp.token },
                resp.user
                    ? {
                          ...resp.user,
                          authority: [],
                      }
                    : undefined,
            )
            redirect()
            return
        }
    }

    const signIn = async (values: SignInCredential): AuthResult => {
        try {
            const resp = await apiSignIn(values)

            if (resp?.success && resp.next_step === 'otp_verify' && resp.challenge_id) {
                setPendingChallenge({
                    challenge_id: resp.challenge_id,
                    expires_at: resp.expires_at,
                    meta: resp.meta ?? {},
                    user: resp.user ?? null,
                })
                navigatorRef.current?.navigate('/otp-verification')
                return { status: 'success', message: resp.message }
            }

            if (resp?.success && resp.next_step === 'authenticated' && resp.token) {
                handleSignIn(
                    { accessToken: resp.token },
                    resp.user
                        ? {
                              ...resp.user,
                              authority: [],
                          }
                        : undefined,
                )
                redirect()
                return { status: 'success', message: resp.message }
            }

            if (resp?.success === false) {
                return { status: 'failed', message: resp.message || 'Unable to sign in' }
            }

            return {
                status: 'failed',
                message: 'Unable to sign in',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }


    const signUp = async (values: SignUpCredential): AuthResult => {
        try {
            const resp = await apiSignUp(values)

            if (resp?.success && resp.next_step === 'otp_verify' && resp.challenge_id) {
                setPendingChallenge({
                    challenge_id: resp.challenge_id,
                    expires_at: resp.expires_at,
                    meta: resp.meta ?? {},
                    user: resp.user ?? null,
                })
                navigatorRef.current?.navigate('/otp-verification')
                return { status: 'success', message: resp.message }
            }

            if (resp?.success && resp.next_step === 'authenticated' && resp.token) {
                handleSignIn(
                    { accessToken: resp.token },
                    resp.user
                        ? {
                              ...resp.user,
                              authority: [],
                          }
                        : undefined,
                )
                redirect()
                return { status: 'success', message: resp.message }
            }

            if (resp?.success === false) {
                return { status: 'failed', message: resp.message || 'Unable to sign up' }
            }

            return {
                status: 'failed',
                message: 'Unable to sign up',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const signOut = async () => {
        try {
            await apiSignOut()
        } finally {
            handleSignOut()
            navigatorRef.current?.navigate('/')
        }
    }
    const oAuthSignIn = (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => {
        callback({
            onSignIn: handleSignIn,
            redirect,
        })
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signUp,
                completeAuth,
                signOut,
                oAuthSignIn,
            }}
        >
            {children}
            <IsolatedNavigator ref={navigatorRef} />
        </AuthContext.Provider>
    )
}

export default AuthProvider
