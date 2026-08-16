import usePermission from '@/utils/hooks/usePermission'
import type { CommonProps } from '@/@types/common'

interface PermissionCheckProps extends CommonProps {
    /** Permission names — any one matching is enough. Empty/omitted = no restriction. */
    permissions?: string[]
}

const PermissionCheck = (props: PermissionCheckProps) => {
    const { permissions = [], children } = props
    const { canAny } = usePermission()

    const allowed = permissions.length === 0 || canAny(...permissions)

    return <>{allowed ? children : null}</>
}

export default PermissionCheck
