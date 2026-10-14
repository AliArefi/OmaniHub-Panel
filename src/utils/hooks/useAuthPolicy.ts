import useSWR from 'swr'
import { apiAuthConfig } from '@/services/AuthService'

export default function useAuthPolicy() {
    return useSWR('public-auth-policy', apiAuthConfig, {
        revalidateOnFocus: true,
        dedupingInterval: 10000,
    })
}
