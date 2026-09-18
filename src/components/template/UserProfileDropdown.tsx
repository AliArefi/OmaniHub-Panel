import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser } from '@/store/authStore'
import { Link } from 'react-router'
import { useAuth } from '@/auth'
import type { JSX } from 'react'
import { resolveImageUrl } from '@/utils/imageUrl'
import { HiOutlineChatAlt, HiOutlineLightningBolt, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi'
import useTranslation from '@/utils/hooks/useTranslation'

type DropdownList = {
    label: string
    path: string
    icon: JSX.Element
}

const _UserDropdown = () => {
    const { t } = useTranslation()
    const { avatar, name, email } = useSessionUser((state) => state.user)

    const { signOut } = useAuth()

    const handleSignOut = () => {
        signOut()
    }

    const avatarProps = {
        ...(avatar ? { src: resolveImageUrl(avatar) } : { icon: <HiOutlineUser /> }),
    }
    const dropdownItemList: DropdownList[] = [
        { label: t('shared.userMenu.profile'), path: '/profile', icon: <HiOutlineUser /> },
        { label: t('shared.userMenu.chat'), path: '/chat', icon: <HiOutlineChatAlt /> },
        { label: t('shared.userMenu.subscription'), path: '/plans', icon: <HiOutlineLightningBolt /> },
    ]

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            renderTitle={
                <div className="cursor-pointer flex items-center">
                    <Avatar size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <Avatar {...avatarProps} />
                    <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                            {name || t('shared.userMenu.unknown')}
                        </div>
                        <div className="text-xs">
                            {email || t('shared.userMenu.noEmail')}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            {dropdownItemList.map((item) => (
                <Dropdown.Item
                    key={item.label}
                    eventKey={item.label}
                    className="px-0"
                >
                    <Link className="flex h-full w-full px-2" to={item.path}>
                        <span className="flex gap-2 items-center w-full">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </span>
                    </Link>
                </Dropdown.Item>
            ))}
            <Dropdown.Item
                eventKey="sign-out"
                className='px-2 text-red-400'

                onClick={handleSignOut}
            >
                <span className="text-xl">
                    <HiOutlineLogout />
                </span>
                <span>{t('shared.userMenu.signOut')}</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown
