import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    // {
    //     key: 'home',
    //     path: '/home',
    //     component: lazy(() => import('@/views/Home')),
    //     authority: [],
    // },
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/dashboard')),
        authority: [],
    },
    /** Example purpose only, please remove */
    {
        key: 'singleMenuItem',
        path: '/single-menu-view',
        component: lazy(() => import('@/views/demo/SingleMenuView')),
        authority: [],
    },
    {
        key: 'createCenter',
        path: '/create-center',
        component: lazy(() => import('@/views/center/CreateCenter')),
        authority: [],
    },
    {
        key: 'newCenter',
        path: '/new-center',
        component: lazy(() => import('@/views/center/NewCenter')),
        authority: [],
        meta: {
            pageContainerType: 'contained',
            header: {
                title: 'انشاء حجرة جدیدة',
                contained: true,
            },
        },
    },
    {
        key: 'viewCenter',
        path: '/centers/:agencySlug/view',
        component: lazy(() => import('@/views/center/ViewCenter')),
        authority: [],
        meta: {
            pageContainerType: 'contained',
            header: {
                title: 'مشاهدة الحُجرة',
                contained: true,
            },
        },
    },
    {
        key: 'editCenter',
        path: '/centers/:agencySlug/edit',
        component: lazy(() => import('@/views/center/CreateCenter')),
        authority: [],
    },
    {
        key: 'reservationsCenter',
        path: '/centers/:agencySlug/reservations',
        component: lazy(() => import('@/views/center/Reservations')),
        authority: [],
    },
    {
        key: 'agencyStats',
        path: '/centers/:agencySlug/stats',
        component: lazy(() => import('@/views/center/AgencyStats')),
        authority: [],
    },
    {
        key: 'centers',
        path: '/centers',
        component: lazy(() => import('@/views/center/Centers')),
        authority: [],
    },
    {
        key: 'profile',
        path: '/profile',
        component: lazy(() => import('@/views/profile')),
        authority: [],
    },
    {
        key: 'members',
        path: '/members',
        component: lazy(() => import('@/views/members')),
        authority: [],
    },
    {
        key: 'gateways',
        path: '/gateways',
        component: lazy(() => import('@/views/gateway')),
        authority: [],
    },
    {
        key: 'bookings',
        path: '/bookings',
        component: lazy(() => import('@/views/bookings')),
        authority: [],
    },
    {
        key: 'chat',
        path: '/chat',
        component: lazy(() => import('@/views/chat')),
        authority: [],
    },
    // {
    //     key: 'collapseMenu.item1',
    //     path: '/collapse-menu-item-view-1',
    //     component: lazy(() => import('@/views/demo/CollapseMenuItemView1')),
    //     authority: [],
    // },
    // {
    //     key: 'collapseMenu.item2',
    //     path: '/collapse-menu-item-view-2',
    //     component: lazy(() => import('@/views/demo/CollapseMenuItemView2')),
    //     authority: [],
    // },
    // {
    //     key: 'groupMenu.single',
    //     path: '/group-single-menu-item-view',
    //     component: lazy(() => import('@/views/demo/GroupSingleMenuItemView')),
    //     authority: [],
    // },
    // {
    //     key: 'groupMenu.collapse.item1',
    //     path: '/group-collapse-menu-item-view-1',
    //     component: lazy(
    //         () => import('@/views/demo/GroupCollapseMenuItemView1'),
    //     ),
    //     authority: [],
    // },
    // {
    //     key: 'groupMenu.collapse.item2',
    //     path: '/group-collapse-menu-item-view-2',
    //     component: lazy(
    //         () => import('@/views/demo/GroupCollapseMenuItemView2'),
    //     ),
    //     authority: [],
    // },
    ...othersRoute,
]
