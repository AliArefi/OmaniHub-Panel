import { useState } from 'react'
import dayjs from 'dayjs'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import type { DatePickerRangeValue } from '@/components/ui/DatePicker/DatePickerRange'

export type AdminDateRange = { from?: string; to?: string }

type Preset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'custom'

const presetOptions: { value: Preset; label: string }[] = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'this_month', label: 'This month' },
    { value: 'last_month', label: 'Last month' },
    { value: 'custom', label: 'Custom range' },
]

const FORMAT = 'YYYY-MM-DD'

function presetRange(preset: Preset): AdminDateRange {
    const today = dayjs().startOf('day')
    switch (preset) {
        case 'today':
            return { from: today.format(FORMAT), to: today.format(FORMAT) }
        case 'yesterday': {
            const day = today.subtract(1, 'day').format(FORMAT)
            return { from: day, to: day }
        }
        case '7d':
            return { from: today.subtract(6, 'day').format(FORMAT), to: today.format(FORMAT) }
        case '30d':
            return { from: today.subtract(29, 'day').format(FORMAT), to: today.format(FORMAT) }
        case 'this_month':
            return { from: today.startOf('month').format(FORMAT), to: today.format(FORMAT) }
        case 'last_month': {
            const month = today.subtract(1, 'month')
            return { from: month.startOf('month').format(FORMAT), to: month.endOf('month').format(FORMAT) }
        }
        default:
            return {}
    }
}

type Props = {
    onChange: (range: AdminDateRange) => void
}

/**
 * Date-range filter for admin list pages: common presets (today, last 7/30
 * days, this/last month) plus a custom range picker. Emits inclusive
 * YYYY-MM-DD bounds; an empty object means "all time".
 */
function AdminDateRangeFilter({ onChange }: Props) {
    const [preset, setPreset] = useState<Preset>('all')
    const [custom, setCustom] = useState<DatePickerRangeValue>([null, null])

    const changePreset = (next: Preset) => {
        setPreset(next)
        if (next !== 'custom') {
            setCustom([null, null])
            onChange(presetRange(next))
        }
    }

    const changeCustom = (value: DatePickerRangeValue) => {
        setCustom(value)
        const [from, to] = value
        if (!from && !to) {
            onChange({})
        } else if (from && to) {
            onChange({ from: dayjs(from).format(FORMAT), to: dayjs(to).format(FORMAT) })
        }
    }

    return (
        <div className="flex flex-col sm:flex-row gap-2">
            <Select
                className="min-w-[160px]"
                isSearchable={false}
                options={presetOptions}
                value={presetOptions.find((option) => option.value === preset)}
                onChange={(option) => option && changePreset(option.value)}
            />
            {preset === 'custom' && (
                <DatePicker.DatePickerRange
                    className="min-w-[240px]"
                    inputFormat="YYYY-MM-DD"
                    maxDate={new Date()}
                    placeholder="Select date range"
                    value={custom}
                    onChange={changeCustom}
                />
            )}
        </div>
    )
}

export default AdminDateRangeFilter
