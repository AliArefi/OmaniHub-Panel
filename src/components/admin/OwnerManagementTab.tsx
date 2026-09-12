import { useMemo, useState } from 'react'
import useSWR from 'swr'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Tag from '@/components/ui/Tag'
import DebouceInput from '@/components/shared/DebouceInput'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { TbSearch, TbUser } from 'react-icons/tb'
import { apiGetAdminOwnerOptions, type AdminOwnerOption } from '@/services/admin/AdminOwnerOptionsService'

type Props = {
    owner: AdminOwnerOption | null | undefined
    ownerRequired?: boolean
    onSave: (ownerId: number | null) => Promise<unknown>
}

export default function OwnerManagementTab({ owner, ownerRequired = false, onSave }: Props) {
    const [query, setQuery] = useState('')
    const [selectedId, setSelectedId] = useState<number | null>(owner?.id ?? null)
    const [saving, setSaving] = useState(false)
    const { data, isLoading } = useSWR(['admin-owner-options', query], () => apiGetAdminOwnerOptions(query))
    const options = useMemo(() => (data?.data ?? []).map((user) => ({ value: user.id, label: `${user.name} · ${user.email}` })), [data])

    const save = async () => {
        if (ownerRequired && !selectedId) {
            toast.push(<Notification type="danger" title="Owner required">Select an owner.</Notification>)
            return
        }
        setSaving(true)
        try {
            await onSave(selectedId)
            toast.push(<Notification type="success" title="Owner updated" />)
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.push(<Notification type="danger" title="Update failed">{message || 'Could not update the owner.'}</Notification>)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-5 dark:border-gray-700">
                <Avatar icon={<TbUser />} src={owner?.avatar ?? undefined} size={64} />
                <div className="min-w-0 space-y-1">
                    <div className="truncate text-base font-semibold">{owner?.name || 'No owner assigned'}</div>
                    {owner && <><div className="truncate text-sm text-gray-600 dark:text-gray-300">{owner.email}</div><div className="text-sm text-gray-500">{owner.mobile || 'No mobile number'}</div><Tag className={owner.email_verified_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{owner.email_verified_at ? 'Email verified' : 'Email not verified'}</Tag></>}
                </div>
            </div>
            <div className="max-w-2xl space-y-3">
                <DebouceInput placeholder="Search users by name, email, or mobile" prefix={<TbSearch />} onChange={(event) => setQuery(event.target.value)} />
                <Select isClearable={!ownerRequired} isLoading={isLoading} options={options} value={options.find((option) => option.value === selectedId) ?? (owner && owner.id === selectedId ? { value: owner.id, label: `${owner.name} · ${owner.email}` } : null)} onChange={(option) => setSelectedId(option?.value ?? null)} />
            </div>
            <div className="flex justify-end"><Button loading={saving} variant="solid" onClick={save}>Save owner</Button></div>
        </div>
    )
}
