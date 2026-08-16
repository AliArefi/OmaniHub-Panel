import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

/**
 * Admin screens, kept in their own file and lazy-loaded so a plain site
 * user's session never downloads any of this. Each entry declares the
 * permission that must be held for PermissionGuard (see
 * src/components/route/AllRoutes.tsx) to let the route render — the menu
 * entries in navigation.config mirror the same permission names.
 */
const adminRoutes: Routes = [
    {
        key: 'admin.services',
        path: '/admin/services',
        component: lazy(() => import('@/views/admin/services/ServicesList')),
        authority: [],
        permissions: ['services.view'],
    },
    {
        key: 'admin.services.new',
        path: '/admin/services/new',
        component: lazy(() => import('@/views/admin/services/ServiceForm')),
        authority: [],
        permissions: ['services.create'],
    },
    {
        key: 'admin.services.edit',
        path: '/admin/services/:slug/edit',
        component: lazy(() => import('@/views/admin/services/ServiceForm')),
        authority: [],
        permissions: ['services.edit'],
    },
    {
        key: 'admin.organizations',
        path: '/admin/organizations',
        component: lazy(
            () => import('@/views/admin/organizations/OrganizationsList'),
        ),
        authority: [],
        permissions: ['organizations.view'],
    },
    {
        key: 'admin.organizations.new',
        path: '/admin/organizations/new',
        component: lazy(
            () => import('@/views/admin/organizations/OrganizationForm'),
        ),
        authority: [],
        permissions: ['organizations.create'],
    },
    {
        key: 'admin.organizations.edit',
        path: '/admin/organizations/:slug/edit',
        component: lazy(
            () => import('@/views/admin/organizations/OrganizationForm'),
        ),
        authority: [],
        permissions: ['organizations.edit'],
    },
    {
        key: 'admin.agencies',
        path: '/admin/agencies',
        component: lazy(() => import('@/views/admin/agencies/AgenciesList')),
        authority: [],
        permissions: ['agencies.view'],
    },
    {
        key: 'admin.agencies.new',
        path: '/admin/agencies/new',
        component: lazy(() => import('@/views/admin/agencies/AgencyForm')),
        authority: [],
        permissions: ['agencies.create'],
    },
    {
        key: 'admin.agencies.edit',
        path: '/admin/agencies/:slug/edit',
        component: lazy(() => import('@/views/admin/agencies/AgencyForm')),
        authority: [],
        permissions: ['agencies.edit'],
    },
    {
        key: 'admin.users',
        path: '/admin/users',
        component: lazy(() => import('@/views/admin/users/UsersList')),
        authority: [],
        permissions: ['users.view'],
    },
    {
        key: 'admin.users.new',
        path: '/admin/users/new',
        component: lazy(() => import('@/views/admin/users/UserForm')),
        authority: [],
        permissions: ['users.create'],
    },
    {
        key: 'admin.users.edit',
        path: '/admin/users/:id/edit',
        component: lazy(() => import('@/views/admin/users/UserForm')),
        authority: [],
        permissions: ['users.edit'],
    },
    {
        key: 'admin.roles',
        path: '/admin/roles',
        component: lazy(() => import('@/views/admin/roles/RolesList')),
        authority: [],
        permissions: ['roles.view'],
    },
    {
        key: 'admin.roles.new',
        path: '/admin/roles/new',
        component: lazy(() => import('@/views/admin/roles/RoleForm')),
        authority: [],
        permissions: ['roles.create'],
    },
    {
        key: 'admin.roles.edit',
        path: '/admin/roles/:id/edit',
        component: lazy(() => import('@/views/admin/roles/RoleForm')),
        authority: [],
        permissions: ['roles.edit'],
    },
    {
        key: 'admin.permissions',
        path: '/admin/permissions',
        component: lazy(
            () => import('@/views/admin/permissions/PermissionsList'),
        ),
        authority: [],
        permissions: ['permissions.view'],
    },
    {
        key: 'admin.settings',
        path: '/admin/settings/:group',
        component: lazy(
            () => import('@/views/admin/settings/SettingsGroupPage'),
        ),
        authority: [],
        permissions: [
            'general settings',
            'view otp settings',
            'view notification settings',
        ],
    },
]

export default adminRoutes
