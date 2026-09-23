import { Navigate } from 'react-router'
import { useSessionUser } from '@/store/authStore'
import usePermission from '@/utils/hooks/usePermission'
import type { ReactNode } from 'react'

export default function StaffPermissionGuard({ permissions = [], children }: { permissions?: string[]; children: ReactNode }) {
    const user = useSessionUser((state) => state.user)
    const { canAny } = usePermission()
    const isStaffOnly = (user.staff_contexts?.length ?? 0) > 0 && !user.has_active_agency
    if (isStaffOnly && permissions.length > 0 && !canAny(...permissions)) {
        return <Navigate replace to="/home" />
    }
    return children
}
