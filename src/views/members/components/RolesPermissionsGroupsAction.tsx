import Button from '@/components/ui/Button'
import { useRolePermissionsStore } from '../store/rolePermissionsStore'
import useTranslation from '@/utils/hooks/useTranslation'

const RolesPermissionsGroupsAction = () => {
    const { t } = useTranslation()
    const { setRoleDialog } = useRolePermissionsStore()

    return (
        <div>
            <Button
                variant="solid"
                onClick={() =>
                    setRoleDialog({
                        type: 'new',
                        open: true,
                    })
                }
            >
                {t('memberManagement.createRole')}
            </Button>
        </div>
    )
}

export default RolesPermissionsGroupsAction
