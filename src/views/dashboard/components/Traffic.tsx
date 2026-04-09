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

type TrafficTableProps = {
    data: TrafficData[]
}

const { Tr, Td, TBody, THead, Th } = Table

const columnHelper = createColumnHelper<TrafficData>()

const columns = [
    columnHelper.accessor('source', {
        header: 'مصدر',
        cell: (props) => {
            const { source } = props.row.original
            return <div className="heading-text font-semibold">{source}</div>
        },
    }),
    columnHelper.accessor('visits', {
        header: 'زيارات',
    }),
    columnHelper.accessor('uniqueVisitors', {
        header: 'زوار فريدون',
    }),
    columnHelper.accessor('bounceRate', {
        header: 'معدل الارتداد',
    }),
    columnHelper.accessor('avgSessionDuration', {
        header: 'متوسط مدة الجلسة',
    }),
    columnHelper.accessor('progress', {
        header: 'التقدم نحو الهدف (%)',
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
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h4>بيانات الزيارات</h4>
                <CSVLink
                    filename="traffic-data.csv"
                    data={data.map((traffic) => {
                        return {
                            المصدر: traffic.source,
                            الزيارات: traffic.visits,
                            'الزوار الفريدون': traffic.uniqueVisitors,
                            'معدل الارتداد': traffic.bounceRate,
                            'متوسط مدة الجلسة': traffic.avgSessionDuration,
                            'التقدم نحو الهدف': `${traffic.progress}%`,
                        }
                    })}
                >
                    <Button size="sm">تصدير البيانات</Button>
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
