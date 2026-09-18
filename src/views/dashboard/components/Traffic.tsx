import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Progress from '@/components/ui/Progress'
import classNames from '@/utils/classNames'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table'
import { CSVLink } from 'react-csv'
import type { TrafficData } from '../types'
import useTranslation from '@/utils/hooks/useTranslation'

type TrafficTableProps = {
    data: TrafficData[]
}

const { Tr, Td, TBody, THead, Th } = Table

const columnHelper = createColumnHelper<TrafficData>()

const getColumns = (t: (key: string) => string) => [
    columnHelper.accessor('source', {
        header: t('dashboard.analytics.source'),
        cell: (props) => {
            const { source } = props.row.original
            return <div className="heading-text font-semibold">{source}</div>
        },
    }),
    columnHelper.accessor('visits', {
        header: t('dashboard.analytics.visit'),
    }),
    columnHelper.accessor('uniqueVisitors', {
        header: t('dashboard.analytics.uniqueVisitors'),
    }),
    columnHelper.accessor('bounceRate', {
        header: t('dashboard.analytics.bounceRate'),
    }),
    columnHelper.accessor('avgSessionDuration', {
        header: t('dashboard.analytics.averageSessionDuration'),
    }),
    columnHelper.accessor('progress', {
        header: t('dashboard.analytics.goalProgress'),
        size: 150,
        cell: (props) => {
            const { progress } = props.row.original
            return (
                <Progress
                    percent={progress}
                    size="sm"
                    customColorClass={classNames(
                        'bg-error',
                        progress > 40 && 'bg-warning',
                        progress > 70 && 'bg-success',
                    )}
                />
            )
        },
    }),
]

const Traffic = ({ data = [] }: TrafficTableProps) => {
    const { t } = useTranslation()
    const table = useReactTable({
        data,
        columns: getColumns(t),
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h4>{t('dashboard.analytics.trafficData')}</h4>
                <CSVLink
                    filename="traffic-data.csv"
                    data={data.map((traffic) => {
                        return {
                            [t('dashboard.analytics.source')]: traffic.source,
                            [t('dashboard.analytics.visit')]: traffic.visits,
                            [t('dashboard.analytics.uniqueVisitors')]: traffic.uniqueVisitors,
                            [t('dashboard.analytics.bounceRate')]: traffic.bounceRate,
                            [t('dashboard.analytics.averageSessionDuration')]: traffic.avgSessionDuration,
                            [t('dashboard.analytics.goalProgress')]: `${traffic.progress}%`,
                        }
                    })}
                >
                    <Button size="sm">{t('dashboard.analytics.exportData')}</Button>
                </CSVLink>
            </div>
            <Table>
                <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <Th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        style={{
                                            width: `${header.getSize()}px`,
                                        }}
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                    </Th>
                                )
                            })}
                        </Tr>
                    ))}
                </THead>
                <TBody>
                    {table.getRowModel().rows.map((row) => {
                        return (
                            <Tr key={row.id}>
                                {row.getVisibleCells().map((cell) => {
                                    return (
                                        <Td key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </Td>
                                    )
                                })}
                            </Tr>
                        )
                    })}
                </TBody>
            </Table>
        </Card>
    )
}

export default Traffic
