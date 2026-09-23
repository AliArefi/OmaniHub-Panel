import ApiService from '@/services/ApiService'

export type AssignableRole = { id: number; name: string }
export type ControlledAgency = { id: number; slug: string; title: string }
export type AssignmentMember = { id: number; name: string; user: { id: number; name: string; email?: string; mobile?: string }; roles: AssignableRole[] }
export type AgencyAssignmentOptions = { agency: ControlledAgency; members: AssignmentMember[]; roles: AssignableRole[] }

export function apiGetControlledAgencies() {
    return ApiService.fetchDataWithAxios<{ data: ControlledAgency[] }>({ url: '/admin/agency-role-assignments/agencies' })
}
export function apiGetAgencyRoleAssignmentOptions(agencyId: number) {
    return ApiService.fetchDataWithAxios<{ data: AgencyAssignmentOptions }>({ url: `/admin/agencies/${agencyId}/role-assignment-options` })
}
export function apiAssignAgencyRole(payload: { agency_id: number; member_id: number; role_id: number }) {
    return ApiService.fetchDataWithAxios({ url: '/admin/agency-role-assignments', method: 'post', data: payload })
}
export function apiRevokeAgencyRole(payload: { agency_id: number; member_id: number; role_id: number }) {
    return ApiService.fetchDataWithAxios({ url: '/admin/agency-role-assignments/revoke', method: 'post', data: payload })
}
