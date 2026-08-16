import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
import adminRoutes from './adminRoutes'
import type { Routes } from '@/@types/routes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/dashboard')),
        authority: [],
    },
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
    {
        key: 'workCalendar',
        path: '/work-calendar',
        component: lazy(() => import('@/views/workCalendar')),
        authority: [],
        meta: {
            pageContainerType: 'contained',
            header: {
                title: 'تقويم العمل',
                contained: true,
            },
        },
    },
    ...adminRoutes,
    ...othersRoute,
]
