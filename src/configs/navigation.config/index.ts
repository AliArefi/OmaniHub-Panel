import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'

import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    {
        key: 'home',
        path: '/home',
        title: 'لوحة التحكم',
        translateKey: 'nav.home',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'centers',
        path: '/centers',
        title: 'مراكزي',
        translateKey: 'nav.singleMenuItem',
        icon: 'store',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'createCenter',
        path: '/create-center',
        title: 'إنشاء مركز',
        translateKey: 'nav.singleMenuItem',
        icon: 'groupMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'members',
        path: '/members',
        title: 'العملاء',
        translateKey: 'nav.singleMenuItem',
        icon: 'account',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'bookings',
        path: '/bookings',
        title: 'إدارة الحجوزات',
        translateKey: 'nav.singleMenuItem',
        icon: 'groupMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
    {
        key: 'chat',
        path: '/chat',
        title: 'المحادثات',
        translateKey: 'nav.singleMenuItem',
        icon: 'groupMenu',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [],
        subMenu: [],
    },
]

export default navigationConfig

