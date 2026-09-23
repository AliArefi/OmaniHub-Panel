import { useEffect, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser } from '@/store/authStore'
import { Link } from 'react-router'
import { useAuth } from '@/auth'
import type { JSX } from 'react'
import { resolveImageUrl } from '@/utils/imageUrl'
import { HiOutlineChatAlt, HiOutlineLightningBolt, HiOutlineLogout, HiOutlineTranslate, HiOutlineUser } from 'react-icons/hi'
import useTranslation from '@/utils/hooks/useTranslation'
import LanguageDialog from './LanguageDialog'

type DropdownList = { label: string; path: string; icon: JSX.Element }

const _UserDropdown = () => {
    const { t } = useTranslation()
    const { avatar, name, email, permissions = [], has_active_agency: ownsAgency, staff_contexts: staffContexts = [] } = useSessionUser((state) => state.user)
    const [languageOpen, setLanguageOpen] = useState(false)
    const { signOut } = useAuth()

    useEffect(() => {
        if (staffContexts.length > 0 && !window.localStorage.getItem('agency-member-context')) {
            window.localStorage.setItem('agency-member-context', String(staffContexts[0].member_id))
        }
    }, [staffContexts])

    const avatarProps = avatar ? { src: resolveImageUrl(avatar) } : { icon: <HiOutlineUser /> }
    const dropdownItemList: DropdownList[] = [
        { label: t('shared.userMenu.profile'), path: '/profile', icon: <HiOutlineUser /> },
        ...((staffContexts.length === 0 || ownsAgency || permissions.includes('agency.chat.view'))
            ? [{ label: t('shared.userMenu.chat'), path: '/chat', icon: <HiOutlineChatAlt /> }]
            : []),
        { label: t('shared.userMenu.subscription'), path: '/plans', icon: <HiOutlineLightningBolt /> },
    ]

    return <>
        <Dropdown className="flex" toggleClassName="flex items-center" placement="bottom-end" renderTitle={<div className="cursor-pointer flex items-center"><Avatar size={32} {...avatarProps} /></div>}>
            <Dropdown.Item variant="header"><div className="py-2 px-3 flex items-center gap-3"><Avatar {...avatarProps} /><div><div className="font-bold text-gray-900 dark:text-gray-100">{name || t('shared.userMenu.unknown')}</div><div className="text-xs">{email || t('shared.userMenu.noEmail')}</div></div></div></Dropdown.Item>
            <Dropdown.Item variant="divider" />
            {staffContexts.length > 1 && <Dropdown.Item variant="header"><label className="block px-3 py-2 text-xs text-gray-500">Staff context<select className="mt-1 w-full rounded border border-gray-300 bg-transparent p-2 text-sm" defaultValue={window.localStorage.getItem('agency-member-context') || String(staffContexts[0].member_id)} onChange={(event) => { window.localStorage.setItem('agency-member-context', event.target.value); window.location.reload() }}>{staffContexts.map((context) => <option key={`${context.agency_id}:${context.member_id}`} value={context.member_id}>{context.agency_title} - {context.member_name}</option>)}</select></label></Dropdown.Item>}
            {staffContexts.length > 1 && <Dropdown.Item variant="divider" />}
            {dropdownItemList.map((item) => <Dropdown.Item key={item.label} eventKey={item.label} className="px-0"><Link className="flex h-full w-full px-2" to={item.path}><span className="flex gap-2 items-center w-full"><span className="text-xl">{item.icon}</span><span>{item.label}</span></span></Link></Dropdown.Item>)}
            <Dropdown.Item eventKey="language" className="px-2 lg:hidden" onClick={() => setLanguageOpen(true)}><span className="text-xl"><HiOutlineTranslate /></span><span>{t('shared.userMenu.language')}</span></Dropdown.Item>
            <Dropdown.Item eventKey="sign-out" className="px-2 text-red-400" onClick={() => signOut()}><span className="text-xl"><HiOutlineLogout /></span><span>{t('shared.userMenu.signOut')}</span></Dropdown.Item>
        </Dropdown>
        <LanguageDialog isOpen={languageOpen} onClose={() => setLanguageOpen(false)} />
    </>
}

const UserDropdown = withHeaderItem(_UserDropdown)
export default UserDropdown
