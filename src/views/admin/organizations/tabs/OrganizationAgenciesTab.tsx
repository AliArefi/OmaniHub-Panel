import useSWR from 'swr'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import { apiGetAdminOrganizationAgencies } from '@/services/admin/AdminOrganizationAgenciesService'

/**
 * React port of the organization "Agencies" tab — read-only cross-reference
 * of the agencies belonging to this organization (agencies are edited on
 * their own admin screen).
 */
function OrganizationAgenciesTab({ organizationSlug }: { organizationSlug: string }) {
    const { data, isLoading } = useSWR(
        ['admin-organization-agencies', organizationSlug],
        () => apiGetAdminOrganizationAgencies(organizationSlug),
    )

    const agencies = data?.data ?? []

    return (
        <Card>
            <h5 className="mb-4">Agencies</h5>
            {!isLoading && agencies.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    No agencies belong to this organization yet.
                </div>
            )}
            <div className="flex flex-col gap-2">
                {agencies.map((agency) => (
                    <div
                        key={agency.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between gap-4"
                    >
                        <div>
                            <div className="font-semibold">{agency.title}</div>
                            <div className="text-xs text-gray-500">
                                {agency.service?.name ?? '—'} · {agency.city?.name ?? '—'}
                            </div>
                        </div>
                        <Tag>{agency.status}</Tag>
                    </div>
                ))}
            </div>
        </Card>
    )
}

export default OrganizationAgenciesTab
