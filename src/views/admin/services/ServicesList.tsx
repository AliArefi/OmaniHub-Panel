import { useState } from 'react'
import { useNavigate } from 'react-router'
import AdminListPage from '@/components/admin/AdminListPage'
import AdminPreviewAction from '@/components/admin/AdminPreviewAction'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { TbCheck, TbCornerDownRight, TbEdit, TbFilterPlus, TbList, TbTrash, TbTree, TbX } from 'react-icons/tb'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import usePermission from '@/utils/hooks/usePermission'
import { apiApproveServiceRecommendation, apiDeleteAdminService, apiRejectServiceRecommendation } from '@/services/admin/AdminServicesService'
import type { AdminService } from '@/@types/admin'
import type { ColumnDef } from '@/components/shared/DataTable'

const statusColor: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
}

type ServiceTreeRow = AdminService & {
    depth?: number
    parentLabel?: string | null
    childCount?: number
    agency?: { title: string; slug: string }
    parent_service?: { name: string | null; title: string | null }
    user?: { name: string; email: string }
    estimate_time?: number
    duration_unit?: string
    pricing_type?: string
    price?: number | null
}

const serviceLabel = (service: AdminService) =>
    service.name?.trim() || service.title?.trim() || service.slug

const buildServiceTreeRows = (services: ServiceTreeRow[]): ServiceTreeRow[] => {
    const servicesByParent = new Map<number | null, ServiceTreeRow[]>()
    const servicesById = new Map<number, ServiceTreeRow>()

    services.forEach((service) => {
        servicesById.set(service.id, service)
        const parentId = service.service_id ?? null
        servicesByParent.set(parentId, [
            ...(servicesByParent.get(parentId) ?? []),
            service,
        ])
    })

    const sortServices = (items: ServiceTreeRow[]) =>
        [...items].sort((a, b) => {
            const orderDiff = (a.order_number ?? 0) - (b.order_number ?? 0)
            if (orderDiff !== 0) return orderDiff

            return serviceLabel(a).localeCompare(serviceLabel(b))
        })

    const rows: ServiceTreeRow[] = []
    const visited = new Set<number>()

    const appendRows = (
        parentId: number | null,
        depth: number,
        parentLabel: string | null,
    ) => {
        sortServices(servicesByParent.get(parentId) ?? []).forEach((service) => {
            if (visited.has(service.id)) return

            visited.add(service.id)
            rows.push({
                ...service,
                depth,
                parentLabel,
                childCount: servicesByParent.get(service.id)?.length ?? 0,
            })

            appendRows(service.id, depth + 1, serviceLabel(service))
        })
    }

    appendRows(null, 0, null)

    sortServices(services.filter((service) => !visited.has(service.id))).forEach(
        (service) => {
            const parent = service.service_id
                ? servicesById.get(service.service_id)
                : null

            rows.push({
                ...service,
                depth: 0,
                parentLabel: parent ? serviceLabel(parent) : 'Missing parent',
                childCount: servicesByParent.get(service.id)?.length ?? 0,
            })
        },
    )

    return rows
}

const ServicesList = () => {
    const navigate = useNavigate()
    const { can } = usePermission()
    const canCreate = can('services.create')
    const [pendingDelete, setPendingDelete] = useState<{
        service: AdminService
        mutate: () => void
    } | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [treeView, setTreeView] = useState(false)
    const [reviewingId, setReviewingId] = useState<number | null>(null)

    const reviewRecommendation = async (row: ServiceTreeRow, approve: boolean, mutate: () => void) => {
        const note = approve ? '' : window.prompt('Reason for rejection:')?.trim()
        if (!approve && !note) return
        setReviewingId(row.id)
        try {
            if (approve) await apiApproveServiceRecommendation(row.id)
            else await apiRejectServiceRecommendation(row.id, note as string)
            await mutate()
            toast.push(<Notification type="success" title={approve ? 'Approved' : 'Rejected'} />)
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
            toast.push(<Notification type="danger" title="Review failed">{message}</Notification>)
        } finally { setReviewingId(null) }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return

        setDeleting(true)
        try {
            await apiDeleteAdminService(pendingDelete.service.slug)
            toast.push(<Notification type="success" title="Deleted" />)
            pendingDelete.mutate()
        } catch {
            toast.push(<Notification type="danger" title="Failed to delete" />)
        } finally {
            setDeleting(false)
            setPendingDelete(null)
        }
    }

    const defaultColumns = ({ mutate, isTrash }: { mutate: () => void; isTrash: boolean }): ColumnDef<ServiceTreeRow>[] => [
        {
            header: 'Name',
            accessorKey: 'name',
            cell: (props) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span>{props.row.original.name ?? props.row.original.title}</span>
                        {props.row.original.use_as_filter && <Tag className="bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-100">Filter only</Tag>}
                    </div>
                    <div className='text-xs'>{props.row.original.translations?.en?.name}</div>

                </div>
            ),
        },
        {
            header: 'Slug',
            accessorKey: 'slug',
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (props) => (
                <Tag className={statusColor[props.row.original.status]}>
                    {props.row.original.status}
                </Tag>
            ),
        },
        {
            header: 'Order',
            accessorKey: 'order_number',
        },
        {
            header: '',
            id: 'actions',
            cell: (props) => {
                const row = props.row.original
                return (
                    <div className="flex items-center gap-3">
                        {!isTrash && (!row.use_as_filter || row.service_id) && <AdminPreviewAction label="service" slug={row.slug} />}
                        {!isTrash && can('services.edit') && (
                            <Tooltip title="Edit">
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={() =>
                                        navigate(`/admin/services/${row.slug}/edit`)
                                    }
                                >
                                    <TbEdit />
                                </button>
                            </Tooltip>
                        )}
                        {!isTrash && can('services.delete') && (
                            <Tooltip title="Delete">
                                <button
                                    type="button"
                                    className="text-lg text-red-600"
                                    onClick={() =>
                                        setPendingDelete({ service: row, mutate })
                                    }
                                >
                                    <TbTrash />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
    ]
    const treeColumns = ({ mutate, isTrash }: { mutate: () => void; isTrash: boolean }): ColumnDef<ServiceTreeRow>[] => [
        {
            header: 'Name',
            accessorKey: 'name',
            cell: (props) => {
                const row = props.row.original
                const depth = row.depth ?? 0
                const name = serviceLabel(row)

                return (
                    <div
                        className="flex min-w-[260px] items-center gap-2"
                        style={{ paddingInlineStart: depth * 24 }}
                    >
                        {depth > 0 && (
                            <TbCornerDownRight className="shrink-0 text-gray-400" />
                        )}
                        <div className="min-w-0">
                            <div className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                {name}
                            </div>
                            {row.parentLabel && (
                                <div className="truncate text-xs text-gray-500">
                                    Parent: {row.parentLabel}
                                </div>
                            )}
                        </div>
                        {row.childCount ? (
                            <Tag className="ml-auto shrink-0 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                                {row.childCount} child{row.childCount === 1 ? '' : 'ren'}
                            </Tag>
                        ) : null}
                    </div>
                )
            },
        },
        {
            header: 'Parent',
            accessorKey: 'service_id',
            cell: (props) => props.row.original.parentLabel ?? 'Root',
        },
        ...defaultColumns({ mutate, isTrash }).slice(1),
    ]
    const recommendationColumns = ({ mutate }: { mutate: () => void; isTrash: boolean }): ColumnDef<ServiceTreeRow>[] => [
        { header: 'Service', accessorKey: 'title', cell: ({ row }) => <div><div className="font-semibold">{row.original.title}</div><div className="text-xs text-gray-500">{row.original.name}</div></div> },
        { header: 'Parent', id: 'parent', cell: ({ row }) => row.original.parent_service?.name ?? row.original.parent_service?.title ?? '-' },
        { header: 'Agency', id: 'agency', cell: ({ row }) => <div><div>{row.original.agency?.title}</div><div className="text-xs text-gray-500">{row.original.user?.email}</div></div> },
        { header: 'Offering', id: 'offering', cell: ({ row }) => `${row.original.estimate_time} ${row.original.duration_unit} · ${row.original.pricing_type}${row.original.price != null ? ` · ${row.original.price}` : ''}` },
        { header: '', id: 'actions', cell: ({ row }) => <div className="flex gap-2"><Button icon={<TbCheck />} loading={reviewingId === row.original.id} size="sm" variant="solid" onClick={() => reviewRecommendation(row.original, true, mutate)}>Approve</Button><Button icon={<TbX />} size="sm" onClick={() => reviewRecommendation(row.original, false, mutate)}>Disapprove</Button></div> },
    ]

    return (
        <>
            <AdminListPage<ServiceTreeRow>
                trashEnabled
                title="Services"
                endpoint="/admin/services"
                columns={treeView ? treeColumns : defaultColumns}
                transformRows={treeView ? buildServiceTreeRows : undefined}
                initialPageSize={treeView ? 100 : 20}
                headerActions={
                    <div className="flex flex-wrap gap-2">
                        {canCreate && <Button size="sm" icon={<TbFilterPlus />} onClick={() => navigate('/admin/services/filter-only/new')}>Filter-only service</Button>}
                        <Button size="sm" icon={treeView ? <TbList /> : <TbTree />} onClick={() => setTreeView((enabled) => !enabled)}>
                            {treeView ? 'Default view' : 'Tree view'}
                        </Button>
                    </div>
                }
                createPath="/admin/services/new"
                createPermission="services.create"
                deletePermission="services.delete"
                viewPermission="services.view"
                searchPlaceholder="Search services…"
                statusFilters={['published', 'draft', 'pending']}
                alternateView={{ label: 'Pending recommendations', endpoint: '/admin/service-recommendations', columns: recommendationColumns }}
            />
            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                type="danger"
                title="Delete service"
                confirmButtonProps={{ loading: deleting }}
                onClose={() => setPendingDelete(null)}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            >
                Delete service &quot;{pendingDelete?.service.name ?? pendingDelete?.service.title}&quot;? It can be restored from the trash.
            </ConfirmDialog>
        </>
    )
}

export default ServicesList
