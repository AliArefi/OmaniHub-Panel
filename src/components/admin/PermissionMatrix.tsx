import useSWR from 'swr'
import Checkbox from '@/components/ui/Checkbox'
import Card from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import { apiGetGroupedPermissions } from '@/services/admin/AdminRolesPermissionsService'

type PermissionMatrixProps = {
    value: string[]
    onChange: (permissions: string[]) => void
}

/**
 * React replacement for the flat 1..n permission checkbox table in
 * resources/views/admin/views/roles/{create,edit}.blade.php — grouped by
 * resource (GET /admin/permissions/grouped), with a select-all per group and
 * a global select-all. Submits permission NAMES (the Blade form mixes ids
 * for individual checkboxes and names for its "select all" checkbox — a bug
 * this doesn't repeat).
 */
function PermissionMatrix(props: PermissionMatrixProps) {
    const { value, onChange } = props
    const { data, isLoading } = useSWR(
        'admin-permissions-grouped',
        apiGetGroupedPermissions,
        { revalidateOnFocus: false, revalidateIfStale: false },
    )

    const groups = data?.data ?? []
    const allNames = groups.flatMap((g) => g.permissions.map((p) => p.name))
    const allSelected = allNames.length > 0 && allNames.every((n) => value.includes(n))

    const toggleAll = (checked: boolean) => {
        onChange(checked ? allNames : [])
    }

    const toggleGroup = (groupNames: string[], checked: boolean) => {
        const withoutGroup = value.filter((n) => !groupNames.includes(n))
        onChange(checked ? [...withoutGroup, ...groupNames] : withoutGroup)
    }

    const toggleOne = (name: string, checked: boolean) => {
        onChange(
            checked ? [...value, name] : value.filter((n) => n !== name),
        )
    }

    if (isLoading) {
        return <Skeleton height={200} />
    }

    return (
        <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 font-semibold">
                <Checkbox
                    checked={allSelected}
                    onChange={(checked) => toggleAll(checked)}
                />
                Select all
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                    const groupNames = group.permissions.map((p) => p.name)
                    const groupSelected =
                        groupNames.length > 0 &&
                        groupNames.every((n) => value.includes(n))

                    return (
                        <Card key={group.group} bodyClass="p-4">
                            <label className="flex items-center gap-2 font-medium mb-2">
                                <Checkbox
                                    checked={groupSelected}
                                    onChange={(checked) =>
                                        toggleGroup(groupNames, checked)
                                    }
                                />
                                {group.group}
                            </label>
                            <div className="flex flex-col gap-1 ps-6">
                                {group.permissions.map((permission) => (
                                    <label
                                        key={permission.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            checked={value.includes(permission.name)}
                                            onChange={(checked) =>
                                                toggleOne(permission.name, checked)
                                            }
                                        />
                                        {permission.name}
                                    </label>
                                ))}
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

export default PermissionMatrix
