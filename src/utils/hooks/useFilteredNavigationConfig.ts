import { useMemo } from 'react'
import navigationConfig from '@/configs/navigation.config'
import usePermission from './usePermission'
import type { NavigationTree } from '@/@types/navigation'

const filterTree = (
    items: NavigationTree[],
    canAny: (...perms: string[]) => boolean,
): NavigationTree[] =>
    items.reduce<NavigationTree[]>((acc, item) => {
        const allowed =
            !item.permissions ||
            item.permissions.length === 0 ||
            canAny(...item.permissions)

        if (!allowed) {
            return acc
        }

        const subMenu = filterTree(item.subMenu ?? [], canAny)

        // A parent (title/collapse) whose every child was filtered out has
        // nothing left to show — drop it rather than rendering an empty
        // section header or a collapse arrow that opens onto nothing.
        if (item.subMenu && item.subMenu.length > 0 && subMenu.length === 0) {
            return acc
        }

        acc.push({ ...item, subMenu })

        return acc
    }, [])

/**
 * Applies permission-based visibility on top of the existing authority
 * (role) gating that AuthorityCheck/AuthorityGuard already do per-item —
 * this filters the tree itself so a nav *section* (e.g. "Administration")
 * disappears entirely for admins who hold none of its children's
 * permissions, rather than rendering an empty collapse.
 */
function useFilteredNavigationConfig(): NavigationTree[] {
    const { canAny } = usePermission()

    return useMemo(() => filterTree(navigationConfig, canAny), [canAny])
}

export default useFilteredNavigationConfig
