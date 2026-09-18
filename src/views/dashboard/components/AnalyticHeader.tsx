/* eslint-disable react-refresh/only-export-components */
import Select from '@/components/ui/Select'
import type { Period } from '../types'
import useTranslation from '@/utils/hooks/useTranslation'

type AnalyticHeaderProps = {
    selectedPeriod: Period
    onSelectedPeriodChange: (value: Period) => void
}

export const options: { value: Period; labelKey: string }[] = [
    { value: 'thisMonth', labelKey: 'dashboard.analytics.periodMonth' },
    { value: 'thisWeek', labelKey: 'dashboard.analytics.periodWeek' },
    { value: 'thisYear', labelKey: 'dashboard.analytics.periodYear' },
]


const AnalyticHeader = ({
    selectedPeriod,
    onSelectedPeriodChange,
}: AnalyticHeaderProps) => {
    const { t } = useTranslation()
    const localizedOptions = options.map((option) => ({
        ...option,
        label: t(option.labelKey),
    }))

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
            <div>
                <h4 className="mb-1">{t('dashboard.analytics.title')}</h4>
                <p>{t('dashboard.analytics.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
                <span>{t('dashboard.analytics.viewBy')}</span>
                <Select
                    className="w-[150px]"
                    size="sm"
                    placeholder={t('dashboard.analytics.selectPeriod')}
                    value={localizedOptions.filter(
                        (option) => option.value === selectedPeriod,
                    )}
                    options={localizedOptions}
                    isSearchable={false}
                    onChange={(option) => {
                        if (option?.value) {
                            onSelectedPeriodChange(option?.value)
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default AnalyticHeader
