import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import GrowShrinkValue from '@/components/shared/GrowShrinkValue'
import { CSVLink } from 'react-csv'
import type { TopPageData } from '../types'
import useTranslation from '@/utils/hooks/useTranslation'

type TopPerformingPagesProps = {
    data: TopPageData[]
}

const { Tr, Td, TBody, THead, Th } = Table

const TopPerformingPages = ({ data }: TopPerformingPagesProps) => {
    const { t } = useTranslation()
    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>{t('dashboard.analytics.topPerformingPages')}</h4>
                <CSVLink
                    filename="top-page.csv"
                    data={data.map((row) => {
                        return {
                            pageUrl: row.pageUrl,
                            views: row.views.amount,
                            [t('dashboard.analytics.views')]: row.views.amount,
                            [`${t('dashboard.analytics.views')} growth`]: `${row.views.growth}%`,
                            [t('dashboard.analytics.uniqueVisitors')]: row.uniqueVisitor.amount,
                            [`${t('dashboard.analytics.uniqueVisitors')} growth`]: `${row.uniqueVisitor.growth}%`,
                        }
                    })}
                >
                    <Button size="sm">{t('dashboard.analytics.exportData')}</Button>
                </CSVLink>
            </div>
            <div className="mt-6">
                <Table hoverable={false}>
                    <THead>
                        <Tr>
                            <Th className="!px-0">{t('dashboard.analytics.pageUrl')}</Th>
                            <Th className="!text-right max-w-[100px]">{t('dashboard.analytics.views')}</Th>
                            <Th className="!px-0 !text-right max-w-[100px]">
                                {t('dashboard.analytics.uniqueVisitors')}
                            </Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {data.map((row) => {
                            return (
                                <Tr key={row.pageUrl}>
                                    <Td className="!px-0">
                                        <div className="heading-text font-bold">
                                            {row.pageUrl}
                                        </div>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center justify-end gap-2">
                                            <span>{row.views.amount}</span>
                                            <GrowShrinkValue
                                                className="font-bold"
                                                value={row.views.growth}
                                                suffix="%"
                                                positiveIcon="+"
                                                negativeIcon=""
                                            />
                                        </div>
                                    </Td>
                                    <Td className="!px-0">
                                        <div className="flex items-center justify-end gap-2">                                            
                                            <span>
                                                {row.uniqueVisitor.amount}
                                            </span>
                                            <GrowShrinkValue
                                                className="font-bold"
                                                value={row.uniqueVisitor.growth}
                                                suffix="%"
                                                positiveIcon="+"
                                                negativeIcon=""
                                            />
                                        </div>
                                    </Td>
                                </Tr>
                            )
                        })}
                    </TBody>
                </Table>
            </div>
        </Card>
    )
}

export default TopPerformingPages
