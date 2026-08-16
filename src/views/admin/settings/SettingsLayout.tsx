import { NavLink, useLocation } from 'react-router'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import usePermission from '@/utils/hooks/usePermission'
import type { ReactNode } from 'react'

const GROUPS: Array<{ key: string; label: string; permission: string }> = [
    { key: 'general', label: 'General', permission: 'general settings' },
    { key: 'contact-us', label: 'Contact us', permission: 'general settings' },
    { key: 'about-us', label: 'About us', permission: 'general settings' },
    { key: 'about', label: 'About', permission: 'general settings' },
    { key: 'faq', label: 'Home FAQ', permission: 'general settings' },
    { key: 'store', label: 'Store', permission: 'general settings' },
    { key: 'agency-workflow', label: 'Agency workflow', permission: 'view otp settings' },
    { key: 'otp', label: 'OTP', permission: 'view otp settings' },
    { key: 'notifications', label: 'Notifications', permission: 'view notification settings' },
]

/**
 * Left-menu shell for the settings area — one menu item per group, matching
 * resources/views/admin/views/settings/nav.blade.php. Each group is its own
 * route (/admin/settings/:group) so deep-linking and back/forward work the
 * same way the Blade panel's separate pages did.
 */
const SettingsLayout = ({ children }: { children: ReactNode }) => {
    const location = useLocation()
    const { can } = usePermission()
    const visibleGroups = GROUPS.filter((g) => can(g.permission))

    return (
        <Container>
            <div className="flex flex-col lg:flex-row gap-4">
                <AdaptiveCard className="lg:w-64 shrink-0" bodyClass="p-2">
                    <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                        {visibleGroups.map((group) => (
                            <NavLink
                                key={group.key}
                                to={`/admin/settings/${group.key}`}
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-lg whitespace-nowrap ${
                                        isActive ||
                                        location.pathname.endsWith(group.key)
                                            ? 'bg-primary-50 text-primary dark:bg-primary-900'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`
                                }
                            >
                                {group.label}
                            </NavLink>
                        ))}
                    </nav>
                </AdaptiveCard>
                <div className="flex-1">{children}</div>
            </div>
        </Container>
    )
}

export default SettingsLayout
