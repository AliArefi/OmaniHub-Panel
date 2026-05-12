export type DurationUnit = 'minute' | 'hour' | 'day' | 'week' | 'month'

export const durationUnitOptions: Array<{ value: DurationUnit; label: string }> = [
    { value: 'minute', label: 'Minute' },
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
]

export const formatDurationLabel = (
    value: number,
    unit: DurationUnit,
): string => {
    const option = durationUnitOptions.find((item) => item.value === unit)
    const baseLabel = option?.label.toLowerCase() ?? 'minute'

    return `${value} ${baseLabel}${value === 1 ? '' : 's'}`
}

export const durationToMinutes = (
    value: number,
    unit: DurationUnit,
): number => {
    const safeValue = Math.max(1, value)

    switch (unit) {
        case 'hour':
            return safeValue * 60
        case 'day':
            return safeValue * 60 * 24
        case 'week':
            return safeValue * 60 * 24 * 7
        case 'month':
            return safeValue * 60 * 24 * 30
        default:
            return safeValue
    }
}
