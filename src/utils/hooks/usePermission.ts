import { useCallback } from 'react'
import { useSessionUser } from '@/store/authStore'

// Stable reference: a Zustand selector must return the same value on
// repeated calls when nothing changed, or React's useSyncExternalStore sees
// a "new" snapshot every render and loops forever ("Maximum update depth
// exceeded"). `state.user.permissions ?? []` was creating a fresh empty
// array on every call whenever permissions was undefined — this constant is
// the fix.
const EMPTY_PERMISSIONS: string[] = []

/**
 * Permission (not role) checks for the admin screens — e.g. gating a Delete
 * button on 'services.delete' rather than on possession of a role name.
 * Deny-by-default: an absent/undefined permissions list means every check
 * returns false, never true. Server-side authorization is still the real
 * gate (see admin.can middleware in the backend); this only controls what
 * the UI shows.
 */
function usePermission() {
    const permissions = useSessionUser(
        (state) => state.user.permissions ?? EMPTY_PERMISSIONS,
    )

    const can = useCallback(
        (permission: string) => permissions.includes(permission),
        [permissions],
    )

    const canAny = useCallback(
        (...perms: string[]) => perms.some((p) => permissions.includes(p)),
        [permissions],
    )

    const canAll = useCallback(
        (...perms: string[]) => perms.every((p) => permissions.includes(p)),
        [permissions],
    )

    return { can, canAny, canAll, permissions }
}

export default usePermission
