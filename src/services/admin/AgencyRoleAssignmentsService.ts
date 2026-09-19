import ApiService from '@/services/ApiService'
export type AssignableRole = { id: number; name: string }
export function apiGetAgencyRoleAssignmentOptions() { return ApiService.fetchDataWithAxios<{ data: AssignableRole[] }>({ url: '/admin/agency-role-assignments/options' }) }
export function apiAssignAgencyRole(payload: { agency_id: number; identifier: string; role_id: number }) { return ApiService.fetchDataWithAxios({ url: '/admin/agency-role-assignments', method: 'post', data: payload }) }
