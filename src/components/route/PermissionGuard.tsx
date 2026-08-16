import { PropsWithChildren } from 'react'
import { Navigate } from 'react-router'
import usePermission from '@/utils/hooks/usePermission'

type PermissionGuardProps = PropsWithChildren<{
    /** Permission names — any one matching is enough. Empty/omitted = no restriction. */
    permissions?: string[]
}>

const PermissionGuard = (props: PermissionGuardProps) => {
    const { permissions = [], children } = props
    const { canAny } = usePermission()

    const allowed = permissions.length === 0 || canAny(...permissions)

    return <>{allowed ? children : <Navigate to="/access-denied" />}</>
}

export default PermissionGuard
