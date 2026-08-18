import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import AdminListPage from '@/components/admin/AdminListPage'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import {
    apiCmsEntryAction,
    type CmsEntry,
} from '@/services/admin/AdminCmsService'
import { TbEdit, TbTrash } from 'react-icons/tb'
import type { ColumnDef } from '@/components/shared/DataTable'

const TYPE_KEYS: Record<string, string> = {
    pages: 'page',
    posts: 'post',
    blocks: 'block',
}
const STATUS_COLORS: Record<string, string> = {
    published:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
    pending:
        'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
}

export default function CmsManager() {
    const navigate = useNavigate()
    const { type = 'posts' } = useParams()
    const typeKey = TYPE_KEYS[type] ?? type
    const resource =
        typeKey === 'page'
            ? 'pages'
            : typeKey === 'post'
              ? 'posts'
              : typeKey === 'block'
                ? 'blocks'
                : 'entries'
    const { can } = usePermission()
    const title =
        typeKey === 'post'
            ? 'Posts / Blog'
            : `${typeKey.charAt(0).toUpperCase()}${typeKey.slice(1)}s`

    const columns = useMemo(
        () =>
            ({
                mutate,
                isTrash,
            }: {
                mutate: () => void
                isTrash: boolean
            }): ColumnDef<CmsEntry>[] => [
                {
                    header: 'Title',
                    accessorKey: 'title',
                    cell: ({ row }) => (
                        <div>
                            <div className="flex items-center gap-2 font-semibold">
                                {row.original.title || 'Untitled'}
                                {row.original.is_system && <Tag>System</Tag>}
                            </div>
                            <span className="text-xs text-gray-500">
                                /{row.original.slug || '—'}
                            </span>
                        </div>
                    ),
                },
                {
                    header: 'Status',
                    accessorKey: 'status',
                    cell: ({ row }) => (
                        <Tag className={STATUS_COLORS[row.original.status]}>
                            {row.original.status}
                        </Tag>
                    ),
                },
                { header: 'Comments', accessorKey: 'comments_count' },
                {
                    header: 'Published',
                    accessorKey: 'published_at',
                    cell: ({ row }) =>
                        row.original.published_at
                            ? new Date(
                                  row.original.published_at,
                              ).toLocaleDateString()
                            : '—',
                },
                {
                    header: '',
                    id: 'actions',
                    cell: ({ row }) => (
                        <div className="flex items-center gap-3">
                            {!isTrash && can(`cms.${resource}.edit`) && (
                                <Tooltip title="Edit">
                                    <button
                                        type="button"
                                        className="text-lg"
                                        onClick={() =>
                                            navigate(
                                                `/admin/cms/${type}/${row.original.id}/edit`,
                                            )
                                        }
                                    >
                                        <TbEdit />
                                    </button>
                                </Tooltip>
                            )}
                            {!isTrash &&
                                !row.original.is_system &&
                                can(`cms.${resource}.delete`) && (
                                    <Tooltip title="Move to trash">
                                        <button
                                            type="button"
                                            className="text-lg text-red-600"
                                            onClick={async () => {
                                                try {
                                                    await apiCmsEntryAction(
                                                        row.original.id,
                                                        'trash',
                                                    )
                                                    toast.push(
                                                        <Notification
                                                            type="success"
                                                            title="Moved to trash"
                                                        />,
                                                    )
                                                    mutate()
                                                } catch {
                                                    toast.push(
                                                        <Notification
                                                            type="danger"
                                                            title="Could not delete entry"
                                                        />,
                                                    )
                                                }
                                            }}
                                        >
                                            <TbTrash />
                                        </button>
                                    </Tooltip>
                                )}
                        </div>
                    ),
                },
            ],
        [can, navigate, resource, type],
    )

    return (
        <AdminListPage<CmsEntry>
            trashEnabled
            title={title}
            endpoint="/admin/cms/entries"
            bulkEndpoint="/admin/cms/entries/bulk"
            columns={columns}
            filterData={{ type: typeKey }}
            createPath={`/admin/cms/${type}/new`}
            createPermission={`cms.${resource}.create`}
            deletePermission={`cms.${resource}.delete`}
            viewPermission={`cms.${resource}.view`}
            searchPlaceholder={`Search ${title.toLowerCase()}…`}
            statusFilters={['published', 'draft', 'pending', 'scheduled']}
        />
    )
}
