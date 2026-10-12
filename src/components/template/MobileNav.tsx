import { useState, Suspense, lazy } from 'react'
import classNames from 'classnames'
import Drawer from '@/components/ui/Drawer'
import NavToggle from '@/components/shared/NavToggle'
import { DIR_RTL } from '@/constants/theme.constant'
import withHeaderItem, { WithHeaderItemProps } from '@/utils/hoc/withHeaderItem'
import appConfig from '@/configs/app.config'
import { useThemeStore } from '@/store/themeStore'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import { useSessionUser } from '@/store/authStore'
import useFilteredNavigationConfig from '@/utils/hooks/useFilteredNavigationConfig'
import useTranslation from '@/utils/hooks/useTranslation'
import { useAuth } from '@/auth'
import { HiOutlineLogout } from 'react-icons/hi'

const VerticalMenuContent = lazy(
    () => import('@/components/template/VerticalMenuContent'),
)

type MobileNavToggleProps = {
    toggled?: boolean
}

type MobileNavProps = {
    translationSetup?: boolean
}

const MobileNavToggle = withHeaderItem<
    MobileNavToggleProps & WithHeaderItemProps
>(NavToggle)

const MobileNav = ({
    translationSetup = appConfig.activeNavTranslation,
}: MobileNavProps) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const { signOut } = useAuth()

    const handleOpenDrawer = () => {
        setIsOpen(true)
    }

    const handleDrawerClose = () => {
        setIsOpen(false)
    }

    const direction = useThemeStore((state) => state.direction)
    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)

    const userAuthority = useSessionUser((state) => state.user.authority)
    const navigationConfig = useFilteredNavigationConfig()

    return (
        <>
            <div className="text-2xl" onClick={handleOpenDrawer}>
                <MobileNavToggle toggled={isOpen} />
            </div>
            <Drawer
                title={t('shared.mobileNav.title')}
                isOpen={isOpen}
                bodyClass={classNames('p-0 flex-1 min-h-0')}
                footerClass="p-3"
                footer={
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => {
                            handleDrawerClose()
                            signOut()
                        }}
                    >
                        <HiOutlineLogout className="text-xl" />
                        <span>{t('shared.userMenu.signOut')}</span>
                    </button>
                }
                width={330}
                placement={direction === DIR_RTL ? 'right' : 'left'}
                onClose={handleDrawerClose}
                onRequestClose={handleDrawerClose}
            >
                <Suspense fallback={<></>}>
                    {isOpen && (
                        <VerticalMenuContent
                            collapsed={false}
                            navigationTree={navigationConfig}
                            routeKey={currentRouteKey}
                            userAuthority={userAuthority as string[]}
                            direction={direction}
                            translationSetup={translationSetup}
                            onMenuItemClick={handleDrawerClose}
                        />
                    )}
                </Suspense>
            </Drawer>
        </>
    )
}

export default MobileNav
