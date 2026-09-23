import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiAssignAgencyRole, apiGetAgencyRoleAssignmentOptions, apiGetControlledAgencies, apiRevokeAgencyRole } from '@/services/admin/AgencyRoleAssignmentsService'

type Option = { value: number; label: string }

export default function AgencyRoleAssignments() {
    const [agencyId, setAgencyId] = useState<number>()
    const [memberId, setMemberId] = useState<number>()
    const [roleId, setRoleId] = useState<number>()
    const [busy, setBusy] = useState(false)
    const { data: agenciesData } = useSWR('controlled-agencies', apiGetControlledAgencies)
    const { data: optionsData, mutate } = useSWR(agencyId ? ['agency-role-assignment-options', agencyId] : null, () => apiGetAgencyRoleAssignmentOptions(agencyId!))
    const options = optionsData?.data
    const selectedMember = options?.members.find((item) => item.id === memberId)
    const agencyOptions = useMemo(() => (agenciesData?.data ?? []).map((agency) => ({ value: agency.id, label: agency.title })), [agenciesData])
    const memberOptions = (options?.members ?? []).map((member) => ({ value: member.id, label: `${member.name} - ${member.user.email || member.user.mobile || member.user.name}` }))
    const roleOptions = (options?.roles ?? []).map((role) => ({ value: role.id, label: role.name }))

    const assign = async () => {
        if (!agencyId || !memberId || !roleId) return
        setBusy(true)
        try {
            await apiAssignAgencyRole({ agency_id: agencyId, member_id: memberId, role_id: roleId })
            await mutate()
            toast.push(<Notification type="success" title="Role assigned" />)
        } finally { setBusy(false) }
    }
    const revoke = async (assignedRoleId: number) => {
        if (!agencyId || !memberId) return
        setBusy(true)
        try {
            await apiRevokeAgencyRole({ agency_id: agencyId, member_id: memberId, role_id: assignedRoleId })
            await mutate()
            toast.push(<Notification type="success" title="Role revoked" />)
        } finally { setBusy(false) }
    }

    return <div className="p-6 max-w-3xl"><h3 className="mb-6">Agency staff access</h3><Card><div className="grid gap-4">
        <Select<Option> placeholder="Select agency" options={agencyOptions} onChange={(option) => { setAgencyId(option?.value); setMemberId(undefined); setRoleId(undefined) }} />
        <Select<Option> placeholder="Select linked member" isDisabled={!agencyId} options={memberOptions} onChange={(option) => { setMemberId(option?.value); setRoleId(undefined) }} />
        <Select<Option> placeholder="Select role" isDisabled={!memberId} options={roleOptions} onChange={(option) => setRoleId(option?.value)} />
        <Button variant="solid" loading={busy} disabled={!agencyId || !memberId || !roleId} onClick={assign}>Assign role</Button>
    </div>{selectedMember && <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"><div className="font-semibold mb-2">Current roles</div>{selectedMember.roles.length === 0 ? <div className="text-gray-500">No agency role is assigned.</div> : <div className="flex flex-wrap gap-2">{selectedMember.roles.map((role) => <Button key={role.id} size="sm" loading={busy} onClick={() => revoke(role.id)}>Revoke {role.name}</Button>)}</div>}</div>}</Card></div>
}
