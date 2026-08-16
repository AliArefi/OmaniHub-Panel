import useSWR from 'swr'
import { useEffect, useState } from 'react'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Switcher from '@/components/ui/Switcher'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiGetSingletonSettings,
    apiUpdateSingletonSettings,
} from '@/services/admin/AdminSettingsService'

type AgencyWorkflowData = { require_pending_review_on_owner_update: boolean }

const AgencyWorkflowSettings = () => {
    const { can } = usePermission()
    const canEdit = can('update otp settings') || can('update notification settings')
    const { data, mutate } = useSWR('admin-settings-agency-workflow', () =>
        apiGetSingletonSettings<AgencyWorkflowData>('agency-workflow'),
    )
    const [value, setValue] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const settingsData = data?.data as unknown as AgencyWorkflowData | undefined
        if (settingsData) {
            setValue(settingsData.require_pending_review_on_owner_update)
        }
    }, [data])

    const onSave = async () => {
        setSaving(true)
        try {
            await apiUpdateSingletonSettings('agency-workflow', {
                require_pending_review_on_owner_update: value,
            })
            toast.push(<Notification type="success" title="Saved" />)
            mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to save" />)
        } finally {
            setSaving(false)
        }
    }

    return (
        <AdaptiveCard>
            <h4 className="mb-6">Agency workflow</h4>
            <label className="flex items-center gap-3">
                <Switcher checked={value} onChange={setValue} disabled={!canEdit} />
                Require re-review when an agency owner updates their listing
            </label>
            {canEdit && (
                <div className="flex justify-end mt-6">
                    <Button variant="solid" loading={saving} onClick={onSave}>
                        Save
                    </Button>
                </div>
            )}
        </AdaptiveCard>
    )
}

export default AgencyWorkflowSettings
