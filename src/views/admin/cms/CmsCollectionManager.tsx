import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import DebouceInput from '@/components/shared/DebouceInput'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import { FormItem } from '@/components/ui/Form'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { TbEdit, TbPlus, TbSearch, TbTrash, TbX } from 'react-icons/tb'
import {
    apiCreateCmsCollectionItem,
    apiDeleteCmsCollectionItem,
    apiGetCmsCollection,
    apiModerateCmsComment,
    apiSaveCmsType,
    apiUpdateCmsCollectionItem,
    type CmsCollectionItem,
    type CmsCustomField,
} from '@/services/admin/AdminCmsService'
import type { ColumnDef } from '@/components/shared/DataTable'

const FIELD_TYPES = ['text', 'textarea', 'number', 'boolean', 'date'].map(
    (value) => ({ label: value, value }),
)
const SUPPORT_OPTIONS = [
    'title',
    'editor',
    'seo',
    'media',
    'taxonomy',
    'excerpt',
]
type EditableField = CmsCustomField & {
    label_ar?: string
    label_en?: string
    default_ar?: unknown
    default_en?: unknown
}

export default function CmsCollectionManager() {
    const navigate = useNavigate()
    const { resource = 'categories' } = useParams()
    const [items, setItems] = useState<CmsCollectionItem[]>([])
    const [selected, setSelected] = useState<CmsCollectionItem[]>([])
    const [query, setQuery] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [ar, setAr] = useState('')
    const [en, setEn] = useState('')
    const [key, setKey] = useState('')
    const [fields, setFields] = useState<EditableField[]>([])
    const [supports, setSupports] = useState<string[]>([
        'title',
        'editor',
        'seo',
        'media',
    ])

    const reload = useCallback(async () => {
        const response = await apiGetCmsCollection(resource)
        setItems(
            Array.isArray(response.data)
                ? response.data
                : response.data.data || [],
        )
        setSelected([])
    }, [resource])
    useEffect(() => {
        void reload()
    }, [reload])

    const filtered = useMemo(
        () =>
            items.filter((item) =>
                label(item).toLowerCase().includes(query.toLowerCase()),
            ),
        [items, query],
    )
    const resetForm = () => {
        setAr('')
        setEn('')
        setKey('')
        setFields([])
        setSupports(['title', 'editor', 'seo', 'media'])
        setEditingId(null)
        setShowForm(false)
    }
    const create = async () => {
        if (!ar.trim() || resource === 'comments') return
        const translations = {
            ar: {
                name: ar,
                custom_fields: Object.fromEntries(
                    fields.map((field) => [
                        field.id,
                        {
                            label: field.label_ar || field.id,
                            default: field.default_ar ?? null,
                        },
                    ]),
                ),
            },
            en: {
                name: en,
                custom_fields: Object.fromEntries(
                    fields.map((field) => [
                        field.id,
                        {
                            label: field.label_en || field.id,
                            default: field.default_en ?? null,
                        },
                    ]),
                ),
            },
        }
        if (resource === 'types') {
            await apiSaveCmsType(editingId, {
                ...(editingId ? {} : { key }),
                translations,
                settings: {
                    supports,
                    custom_fields: fields.map(({ id, type, required }) => ({
                        id,
                        type,
                        required,
                    })),
                },
            })
        } else {
            if (editingId) {
                await apiUpdateCmsCollectionItem(resource, editingId, {
                    translations,
                })
            } else {
                await apiCreateCmsCollectionItem(resource, { translations })
            }
        }
        toast.push(<Notification type="success" title="Saved" />)
        resetForm()
        await reload()
    }
    const remove = async (item: CmsCollectionItem) => {
        await apiDeleteCmsCollectionItem(resource, item.id)
        await reload()
    }
    const removeSelected = async () => {
        await Promise.all(
            selected.filter((item) => !item.is_system).map(remove),
        )
        toast.push(<Notification type="success" title="Deleted" />)
    }
    const moderateSelected = async (approved: boolean) => {
        await Promise.all(
            selected.map((item) => apiModerateCmsComment(item.id, approved)),
        )
        toast.push(
            <Notification
                type="success"
                title={approved ? 'Approved' : 'Rejected'}
            />,
        )
        await reload()
    }
    const editType = (item: CmsCollectionItem) => {
        setEditingId(item.id)
        setKey(item.key ?? '')
        setAr(item.translations?.ar?.name ?? '')
        setEn(item.translations?.en?.name ?? '')
        setSupports(item.settings?.supports ?? [])
        setFields(
            (item.settings?.custom_fields ?? []).map((field) => ({
                ...field,
                label_ar:
                    item.translations?.ar?.custom_fields?.[field.id]?.label,
                label_en:
                    item.translations?.en?.custom_fields?.[field.id]?.label,
                default_ar:
                    item.translations?.ar?.custom_fields?.[field.id]?.default,
                default_en:
                    item.translations?.en?.custom_fields?.[field.id]?.default,
            })),
        )
        setShowForm(true)
    }

    const editItem = (item: CmsCollectionItem) => {
        if (resource === 'types') return editType(item)
        setEditingId(item.id)
        setAr(item.translations?.ar?.name ?? '')
        setEn(item.translations?.en?.name ?? '')
        setShowForm(true)
    }

    const columns: ColumnDef<CmsCollectionItem>[] = [
        {
            header: 'Name / Content',
            id: 'name',
            cell: ({ row }) => (
                <div>
                    <strong>{label(row.original)}</strong>
                    {row.original.key && (
                        <div className="text-xs text-gray-500">
                            {row.original.key}
                        </div>
                    )}
                </div>
            ),
        },
        ...(resource === 'types'
            ? [
                  {
                      header: 'Fields',
                      id: 'fields',
                      cell: ({
                          row,
                      }: {
                          row: { original: CmsCollectionItem }
                      }) => row.original.settings?.custom_fields?.length ?? 0,
                  } as ColumnDef<CmsCollectionItem>,
              ]
            : []),
        ...(resource === 'comments'
            ? [
                  {
                      header: 'Status',
                      id: 'status',
                      cell: ({
                          row,
                      }: {
                          row: { original: CmsCollectionItem }
                      }) => (
                          <Tag
                              className={
                                  row.original.status
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-amber-100 text-amber-700'
                              }
                          >
                              {row.original.status ? 'Approved' : 'Pending'}
                          </Tag>
                      ),
                  } as ColumnDef<CmsCollectionItem>,
              ]
            : []),
        {
            header: 'Type',
            id: 'kind',
            cell: ({ row }) =>
                row.original.is_system ? <Tag>System</Tag> : <Tag>Custom</Tag>,
        },
        {
            header: '',
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    {resource === 'types' && (
                        <>
                            <Tooltip title="Manage entries">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/admin/cms/${row.original.key}`,
                                        )
                                    }
                                >
                                    Entries
                                </button>
                            </Tooltip>
                            <Tooltip title="Edit definition">
                                <button
                                    type="button"
                                    className="text-lg"
                                    onClick={() => editType(row.original)}
                                >
                                    <TbEdit />
                                </button>
                            </Tooltip>
                        </>
                    )}
                    {resource === 'comments' ? (
                        <>
                            <Button
                                size="xs"
                                onClick={() =>
                                    apiModerateCmsComment(
                                        row.original.id,
                                        true,
                                    ).then(reload)
                                }
                            >
                                Approve
                            </Button>
                            <Button
                                size="xs"
                                onClick={() =>
                                    apiModerateCmsComment(
                                        row.original.id,
                                        false,
                                    ).then(reload)
                                }
                            >
                                Reject
                            </Button>
                        </>
                    ) : (
                        <>
                            {resource !== 'types' && (
                                <Tooltip title="Edit">
                                    <button
                                        type="button"
                                        className="text-lg"
                                        onClick={() => editItem(row.original)}
                                    >
                                        <TbEdit />
                                    </button>
                                </Tooltip>
                            )}
                            {!row.original.is_system && (
                                <Tooltip title="Delete">
                                    <button
                                        type="button"
                                        className="text-lg text-red-600"
                                        onClick={() =>
                                            void remove(row.original)
                                        }
                                    >
                                        <TbTrash />
                                    </button>
                                </Tooltip>
                            )}
                        </>
                    )}
                </div>
            ),
        },
    ]

    return (
        <Container>
            <AdaptiveCard>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h3 className="capitalize">CMS · {resource}</h3>
                        <div className="flex gap-2">
                            {selected.length > 0 && resource === 'comments' && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        onClick={() =>
                                            void moderateSelected(true)
                                        }
                                    >
                                        Approve ({selected.length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            void moderateSelected(false)
                                        }
                                    >
                                        Reject ({selected.length})
                                    </Button>
                                </>
                            )}
                            {selected.length > 0 && (
                                <Button
                                    size="sm"
                                    className="bg-red-600 text-white"
                                    icon={<TbTrash />}
                                    onClick={() => void removeSelected()}
                                >
                                    Delete ({selected.length})
                                </Button>
                            )}
                            {resource !== 'comments' && (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<TbPlus />}
                                    onClick={() => setShowForm(true)}
                                >
                                    New
                                </Button>
                            )}
                        </div>
                    </div>
                    {showForm && (
                        <AdaptiveCard className="border border-gray-200">
                            <div className="mb-4 flex justify-between">
                                <h5>
                                    {editingId ? 'Edit' : 'New'}{' '}
                                    {resource === 'types'
                                        ? 'content type'
                                        : resource.slice(0, -1)}
                                </h5>
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<TbX />}
                                    onClick={resetForm}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {resource === 'types' && (
                                    <FormItem asterisk label="Machine key">
                                        <Input
                                            disabled={Boolean(editingId)}
                                            value={key}
                                            onChange={(event) =>
                                                setKey(event.target.value)
                                            }
                                        />
                                    </FormItem>
                                )}
                                <FormItem asterisk label="Arabic name">
                                    <Input
                                        dir="rtl"
                                        value={ar}
                                        onChange={(event) =>
                                            setAr(event.target.value)
                                        }
                                    />
                                </FormItem>
                                <FormItem label="English name">
                                    <Input
                                        value={en}
                                        onChange={(event) =>
                                            setEn(event.target.value)
                                        }
                                    />
                                </FormItem>
                            </div>
                            {resource === 'types' && (
                                <>
                                    <div className="mt-5">
                                        <h6 className="mb-3">
                                            Supported features
                                        </h6>
                                        <div className="flex flex-wrap gap-4">
                                            {SUPPORT_OPTIONS.map((support) => (
                                                <label
                                                    key={support}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Switcher
                                                        checked={supports.includes(
                                                            support,
                                                        )}
                                                        onChange={(checked) =>
                                                            setSupports(
                                                                (current) =>
                                                                    checked
                                                                        ? [
                                                                              ...current,
                                                                              support,
                                                                          ]
                                                                        : current.filter(
                                                                              (
                                                                                  item,
                                                                              ) =>
                                                                                  item !==
                                                                                  support,
                                                                          ),
                                                            )
                                                        }
                                                    />
                                                    <span className="capitalize">
                                                        {support}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <FieldBuilder
                                        fields={fields}
                                        onChange={setFields}
                                    />
                                </>
                            )}
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="plain" onClick={resetForm}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    onClick={() => void create()}
                                >
                                    Save
                                </Button>
                            </div>
                        </AdaptiveCard>
                    )}
                    <DebouceInput
                        placeholder={`Search ${resource}…`}
                        prefix={<TbSearch />}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <DataTable
                        selectable
                        columns={columns}
                        data={filtered}
                        noData={filtered.length === 0}
                        pagingData={{
                            total: filtered.length,
                            pageIndex: 1,
                            pageSize: Math.max(filtered.length, 20),
                        }}
                        checkboxChecked={(row) =>
                            selected.some((item) => item.id === row.id)
                        }
                        onCheckBoxChange={(checked, row) =>
                            setSelected((current) =>
                                checked
                                    ? [...current, row]
                                    : current.filter(
                                          (item) => item.id !== row.id,
                                      ),
                            )
                        }
                        onIndeterminateCheckBoxChange={(checked, rows) =>
                            setSelected(
                                checked ? rows.map((row) => row.original) : [],
                            )
                        }
                    />
                </div>
            </AdaptiveCard>
        </Container>
    )
}

function label(item: CmsCollectionItem) {
    return (
        item.comment ||
        item.translations?.ar?.name ||
        item.translations?.en?.name ||
        item.key ||
        `#${item.id}`
    )
}

function FieldBuilder({
    fields,
    onChange,
}: {
    fields: EditableField[]
    onChange: (fields: EditableField[]) => void
}) {
    const add = () =>
        onChange([
            ...fields,
            { id: `field_${fields.length + 1}`, type: 'text', required: false },
        ])
    return (
        <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
                <h6>Custom fields</h6>
                <Button size="xs" icon={<TbPlus />} onClick={add}>
                    Add field
                </Button>
            </div>
            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-1 items-end gap-3 rounded-lg border p-3 md:grid-cols-2 lg:grid-cols-4"
                    >
                        <FormItem label="Field key">
                            <Input
                                value={field.id}
                                onChange={(event) =>
                                    onChange(
                                        fields.map((item, i) =>
                                            i === index
                                                ? {
                                                      ...item,
                                                      id: event.target.value,
                                                  }
                                                : item,
                                        ),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Type">
                            <Select
                                options={FIELD_TYPES}
                                value={FIELD_TYPES.find(
                                    (option) => option.value === field.type,
                                )}
                                onChange={(option) =>
                                    onChange(
                                        fields.map((item, i) =>
                                            i === index
                                                ? {
                                                      ...item,
                                                      type: option?.value as CmsCustomField['type'],
                                                  }
                                                : item,
                                        ),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Required">
                            <Switcher
                                checked={Boolean(field.required)}
                                onChange={(value) =>
                                    onChange(
                                        fields.map((item, i) =>
                                            i === index
                                                ? { ...item, required: value }
                                                : item,
                                        ),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Arabic label">
                            <Input
                                dir="rtl"
                                value={field.label_ar ?? ''}
                                onChange={(event) =>
                                    onChange(
                                        fields.map((item, i) =>
                                            i === index
                                                ? {
                                                      ...item,
                                                      label_ar:
                                                          event.target.value,
                                                  }
                                                : item,
                                        ),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="English label">
                            <Input
                                value={field.label_en ?? ''}
                                onChange={(event) =>
                                    onChange(
                                        fields.map((item, i) =>
                                            i === index
                                                ? {
                                                      ...item,
                                                      label_en:
                                                          event.target.value,
                                                  }
                                                : item,
                                        ),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Arabic default">
                            <Input
                                dir="rtl"
                                value={String(field.default_ar ?? '')}
                                onChange={(event) =>
                                    onChange(
                                        fields.map((item, i) =>
                                            i === index
                                                ? {
                                                      ...item,
                                                      default_ar:
                                                          event.target.value,
                                                  }
                                                : item,
                                        ),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="English default">
                            <Input
                                value={String(field.default_en ?? '')}
                                onChange={(event) =>
                                    onChange(
                                        fields.map((item, i) =>
                                            i === index
                                                ? {
                                                      ...item,
                                                      default_en:
                                                          event.target.value,
                                                  }
                                                : item,
                                        ),
                                    )
                                }
                            />
                        </FormItem>
                        <Button
                            className="text-red-600"
                            icon={<TbTrash />}
                            onClick={() =>
                                onChange(fields.filter((_, i) => i !== index))
                            }
                        >
                            Remove
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
