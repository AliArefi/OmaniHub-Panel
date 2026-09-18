import { useRef } from 'react'
import ToggleDrawer from '@/components/shared/ToggleDrawer'
import SettingsMenu from './SettingsMenu'
import type { ToggleDrawerRef } from '@/components/shared/ToggleDrawer'
import useTranslation from '@/utils/hooks/useTranslation'

const SettingMobileMenu = () => {
    const { t } = useTranslation()
    const drawerRef = useRef<ToggleDrawerRef>(null)
    return (
        <>
            <div>
                <ToggleDrawer ref={drawerRef} title={t('profile.menu.mobileTitle')}>
                    <SettingsMenu
                        onChange={() => {
                            drawerRef.current?.handleCloseDrawer()
                        }}
                    />
                </ToggleDrawer>
            </div>
        </>
    )
}

export default SettingMobileMenu
