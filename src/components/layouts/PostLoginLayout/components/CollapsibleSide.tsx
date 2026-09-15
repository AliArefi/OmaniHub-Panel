import SideNav from '@/components/template/SideNav'
import Header from '@/components/template/Header'
import SideNavToggle from '@/components/template/SideNavToggle'
import MobileNav from '@/components/template/MobileNav'
import UserProfileDropdown from '@/components//template/UserProfileDropdown'
import LayoutBase from '@/components//template/LayoutBase'
import useResponsive from '@/utils/hooks/useResponsive'
import { LAYOUT_COLLAPSIBLE_SIDE } from '@/constants/theme.constant'
import type { CommonProps } from '@/@types/common'
import { Button } from '@/components/ui'
import { HiOutlineBriefcase, HiOutlineChatAlt, HiOutlineHome, HiOutlineTag } from 'react-icons/hi'
import { useLocation, useNavigate } from 'react-router'

const CollapsibleSide = ({ children }: CommonProps) => {
    const { larger, smaller } = useResponsive()
    const navigate = useNavigate();
    const location = useLocation()

    return (
        <LayoutBase
            type={LAYOUT_COLLAPSIBLE_SIDE}
            className="app-layout-collapsible-side flex flex-auto flex-col"
        >
            <div className="flex flex-auto min-w-0">
                {larger.lg && <SideNav />}
                <div className="flex flex-col flex-auto min-h-screen min-w-0 relative w-full">
                    <Header
                        className="hidden sm:block shadow-sm dark:shadow-2xl"
                        headerStart={
                            <>
                                {smaller.lg && <MobileNav />}
                                {larger.lg && <SideNavToggle />}
                            </>
                        }
                        headerEnd={
                            <>
                                <Button size="sm" onClick={() => navigate('/chat')} variant="plain" >
                                    <HiOutlineChatAlt size={24} />
                                </Button>
                                <UserProfileDropdown hoverable={false} />
                            </>
                        }
                    />

                    <div className='block sm:hidden fixed w-full h-18 bg-white dark:bg-zinc-900 z-10 bottom-0 shadow-[0_-4px_16px_0_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_0_rgba(0,0,0,0.4)]'>
                        <div className='header-wrapper container w-full h-full flex items-center justify-between'>
                            <>
                                {smaller.lg && <MobileNav />}
                            </>
                            <div className={`text-2xl ${location.pathname == '/centers' && 'text-primary'}`} onClick={() => navigate('/centers')}>
                                <div className='header-action-item header-action-item-hoverable'>
                                    <HiOutlineBriefcase />
                                </div>
                            </div>

                            <div className={`text-2xl ${location.pathname == '/home' && 'text-primary'}`} onClick={() => navigate('/home')}>
                                <div className='header-action-item header-action-item-hoverable'>
                                    <HiOutlineHome />
                                </div>
                            </div>
                            <div className={`text-2xl ${location.pathname == '/bookings' && 'text-primary'}`} onClick={() => navigate('/bookings')}>
                                <div className='header-action-item header-action-item-hoverable'>
                                    <HiOutlineTag />
                                </div>
                            </div>
                            <UserProfileDropdown hoverable={false} />
                        </div>
                    </div>

                    <div className="h-full flex flex-auto flex-col">
                        {children}
                    </div>
                </div>
            </div>
        </LayoutBase>
    )
}

export default CollapsibleSide
