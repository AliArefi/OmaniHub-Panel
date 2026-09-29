import { useState } from 'react'
import { useNavigate } from 'react-router'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import DebouceInput from '@/components/shared/DebouceInput'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import useAdminList from '@/utils/hooks/useAdminList'
import usePermission from '@/utils/hooks/usePermission'
import useTranslation from '@/utils/hooks/useTranslation'
import { apiBulkAdminUsers } from '@/services/admin/AdminUsersService'
import {
    TbPlus,
    TbSearch,
    TbTrash,
    TbRestore,
    TbEdit,
    TbUsers,
    TbShieldCheck,
    TbUserOff,
} from 'react-icons/tb'
import type { AdminUser } from '@/@types/admin'
import type { TableQueries } from '@/@types/common'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'

type Segment = 'with_roles' | 'without_roles' | 'deleted'

const UsersList = () => {
    const navigate = useNavigate()
    const { can } = usePermission()
    const { t } = useTranslation()
    const [segment, setSegment] = useState<Segment>('with_roles')
    const [table, setTable] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 20,
        query: '',
        sort: { key: '', order: '' },
    })
    const [selected, setSelected] = useState<AdminUser[]>([])
    const [pending, setPending] = useState<{
        action: 'delete' | 'restore'
        ids: number[]
    } | null>(null)
    const [busy, setBusy] = useState(false)
    const { list, total, counts, isLoading, mutate } = useAdminList<AdminUser>(
        '/admin/users',
        table,
        { segment },
    )

    const changeSegment = (next: Segment) => {
        setSegment(next)
        setSelected([])
        setTable((previous) => ({ ...previous, pageIndex: 1 }))
    }

    const performAction = async () => {
        if (!pending) return
        setBusy(true)
        try {
            const result = await apiBulkAdminUsers(pending.action, pending.ids)
            if (result.affected === 0) throw new Error('No users changed')
            toast.push(
                <Notification
                    type="success"
                    title={t(
                        pending.action === 'restore'
                            ? 'adminUsers.restored'
                            : 'adminUsers.deleted',
                    )}
                />,
            )
            setSelected([])
            await mutate()
        } catch {
            toast.push(
                <Notification
                    type="danger"
                    title={t('adminUsers.actionError')}
                />,
            )
        } finally {
            setBusy(false)
            setPending(null)
        }
    }

    const columns: ColumnDef<AdminUser>[] = [
        {
            header: t('adminUsers.fields.name'),
            accessorKey: 'name',
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex items-center gap-3 py-1">
                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-600"
                            aria-hidden="true"
                        >
                            {user.name?.trim().charAt(0).toUpperCase() || '?'}
                        </span>
                        <span className="min-w-0">
                            <span className="block font-semibold text-slate-900 dark:text-slate-100">
                                {user.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                                #{user.id}
                            </span>
                        </span>
                    </div>
                )
            },
        },
        {
            header: t('adminUsers.contact'),
            id: 'contact',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="break-all text-slate-700 dark:text-slate-200">
                        {row.original.email}
                    </div>
                    <div className="text-xs text-slate-500" dir="ltr">
                        {row.original.mobile || '—'}
                    </div>
                </div>
            ),
        },
        {
            header: t('adminUsers.fields.roles'),
            id: 'roles',
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1.5">
                    {row.original.roles?.length ? (
                        row.original.roles.map((role) => (
                            <span
                                key={role}
                                className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                            >
                                {role}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-slate-500">
                            {t('adminUsers.noRole')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: t('adminUsers.fields.verified'),
            id: 'verified',
            cell: ({ row }) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.original.email_verified_at ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'}`}
                >
                    {t(
                        row.original.email_verified_at
                            ? 'adminUsers.verified'
                            : 'adminUsers.unverified',
                    )}
                </span>
            ),
        },
        {
            header: t('adminUsers.actions'),
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    {segment !== 'deleted' && can('users.edit') && (
                        <button
                            type="button"
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 dark:hover:bg-slate-700"
                            aria-label={`${t('adminUsers.edit')} ${row.original.name}`}
                            onClick={() =>
                                navigate(`/admin/users/${row.original.id}/edit`)
                            }
                        >
                            <TbEdit size={18} />
                        </button>
                    )}
                    {can('users.delete') && (
                        <button
                            type="button"
                            className={`rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-indigo-500 ${segment === 'deleted' ? 'text-emerald-700 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'}`}
                            aria-label={`${t(segment === 'deleted' ? 'adminUsers.restore' : 'adminUsers.delete')} ${row.original.name}`}
                            onClick={() =>
                                setPending({
                                    action:
                                        segment === 'deleted'
                                            ? 'restore'
                                            : 'delete',
                                    ids: [row.original.id],
                                })
                            }
                        >
                            {segment === 'deleted' ? (
                                <TbRestore size={18} />
                            ) : (
                                <TbTrash size={18} />
                            )}
                        </button>
                    )}
                </div>
            ),
        },
    ]

    if (!can('users.view')) return <></>

    const segments: {
        key: Segment
        icon: typeof TbUsers
        label: string
        tone: string
    }[] = [
        {
            key: 'with_roles',
            icon: TbShieldCheck,
            label: t('adminUsers.withRoles'),
            tone: 'text-indigo-600 dark:text-indigo-300',
        },
        {
            key: 'without_roles',
            icon: TbUsers,
            label: t('adminUsers.withoutRoles'),
            tone: 'text-amber-600 dark:text-amber-300',
        },
        {
            key: 'deleted',
            icon: TbUserOff,
            label: t('adminUsers.deletedAccounts'),
            tone: 'text-rose-600 dark:text-rose-300',
        },
    ]

    return (
        <Container>
            <main className="space-y-6 pb-8">
                <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-lg sm:px-9">
                    <div
                        className="absolute inset-y-0 end-0 w-1/3 opacity-20"
                        aria-hidden="true"
                        style={{
                            backgroundImage:
                                'repeating-linear-gradient(135deg, transparent 0, transparent 18px, #818cf8 19px, transparent 20px)',
                        }}
                    />
                    <div className="relative flex flex-wrap items-end justify-between gap-5">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
                                <TbShieldCheck size={18} />{' '}
                                {t('adminUsers.workspace')}
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {t('adminUsers.title')}
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-slate-300">
                                {t('adminUsers.description')}
                            </p>
                        </div>
                        {can('users.create') && (
                            <Button
                                variant="solid"
                                icon={<TbPlus />}
                                onClick={() => navigate('/admin/users/new')}
                            >
                                {t('adminUsers.newTitle')}
                            </Button>
                        )}
                    </div>
                </header>

                <section
                    className="grid gap-3 sm:grid-cols-3"
                    aria-label={t('adminUsers.sections')}
                >
                    {segments.map(({ key, icon: Icon, label, tone }) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={segment === key}
                            className={`rounded-xl border p-4 text-start shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${segment === key ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/40' : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800'}`}
                            onClick={() => changeSegment(key)}
                        >
                            <span
                                className={`mb-3 inline-flex rounded-lg bg-white/80 p-2 dark:bg-slate-800 ${tone}`}
                            >
                                <Icon size={21} />
                            </span>
                            <span className="block text-2xl font-bold text-slate-900 dark:text-white">
                                {counts[key] ?? '—'}
                            </span>
                            <span className="mt-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                                {label}
                            </span>
                        </button>
                    ))}
                </section>

                <section
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    aria-label={t('adminUsers.title')}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:px-7">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {
                                    segments.find(
                                        (item) => item.key === segment,
                                    )?.label
                                }
                            </h2>
                            <p className="text-sm text-slate-500">
                                {total} {t('adminUsers.accounts')}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {selected.length > 0 && can('users.delete') && (
                                <Button
                                    size="sm"
                                    icon={
                                        segment === 'deleted' ? (
                                            <TbRestore />
                                        ) : (
                                            <TbTrash />
                                        )
                                    }
                                    onClick={() =>
                                        setPending({
                                            action:
                                                segment === 'deleted'
                                                    ? 'restore'
                                                    : 'delete',
                                            ids: selected.map(
                                                (user) => user.id,
                                            ),
                                        })
                                    }
                                >
                                    {t(
                                        segment === 'deleted'
                                            ? 'adminUsers.restore'
                                            : 'adminUsers.delete',
                                    )}{' '}
                                    ({selected.length})
                                </Button>
                            )}
                            <DebouceInput
                                placeholder={t('adminUsers.search')}
                                prefix={<TbSearch />}
                                onChange={(event) =>
                                    setTable((previous) => ({
                                        ...previous,
                                        query: event.target.value,
                                        pageIndex: 1,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="px-3 py-3 sm:px-5">
                        <DataTable
                            columns={columns}
                            data={list}
                            loading={isLoading}
                            noData={!isLoading && list.length === 0}
                            selectable={can('users.delete')}
                            pagingData={{
                                total,
                                pageIndex: table.pageIndex ?? 1,
                                pageSize: table.pageSize ?? 20,
                            }}
                            checkboxChecked={(row) =>
                                selected.some((user) => user.id === row.id)
                            }
                            onPaginationChange={(pageIndex) =>
                                setTable((previous) => ({
                                    ...previous,
                                    pageIndex,
                                }))
                            }
                            onSelectChange={(pageSize) =>
                                setTable((previous) => ({
                                    ...previous,
                                    pageSize: Number(pageSize),
                                    pageIndex: 1,
                                }))
                            }
                            onSort={(sort: OnSortParam) =>
                                setTable((previous) => ({ ...previous, sort }))
                            }
                            onCheckBoxChange={(checked, row) =>
                                setSelected((previous) =>
                                    checked
                                        ? [
                                              ...previous.filter(
                                                  (user) => user.id !== row.id,
                                              ),
                                              row,
                                          ]
                                        : previous.filter(
                                              (user) => user.id !== row.id,
                                          ),
                                )
                            }
                            onIndeterminateCheckBoxChange={(checked, rows) =>
                                setSelected(
                                    checked
                                        ? rows.map((row) => row.original)
                                        : [],
                                )
                            }
                        />
                    </div>
                </section>
            </main>
            <ConfirmDialog
                isOpen={Boolean(pending)}
                type={pending?.action === 'delete' ? 'danger' : 'info'}
                title={t(
                    pending?.action === 'restore'
                        ? 'adminUsers.confirmRestore'
                        : 'adminUsers.confirmDelete',
                )}
                confirmButtonProps={{ loading: busy }}
                onClose={() => setPending(null)}
                onCancel={() => setPending(null)}
                onConfirm={performAction}
            >
                {t('adminUsers.confirmAction', {
                    count: pending?.ids.length ?? 0,
                })}
            </ConfirmDialog>
        </Container>
    )
}

export default UsersList
