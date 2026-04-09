import { useState } from 'react'
import Loading from '@/components/shared/Loading'
import AnalyticHeader from './components/AnalyticHeader'
import Metrics from './components/Metrics'
import WebAnalytic from './components/AnalyticChart'
import Traffic from './components/Traffic'
import TopChannel from './components/TopChannel'
import DeviceSession from './components/DeviceSession'
import TopPerformingPages from './components/TopPerformingPages'
import { apiGetAnalyticDashboard } from '@/services/DashboardService'
import useSWR from 'swr'
import type { GetAnalyticDashboardResponse, Period } from './types'
import { AbbreviateNumber, IconText } from "@/components/shared";
import { Button, Card, Progress } from "@/components/ui";
import { MdOutlineElectricBolt } from "react-icons/md";
import { useNavigate } from 'react-router'


const AnalyticDashboard = () => {
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisMonth')

    const { data, isLoading } = useSWR(
        ['/api/dashboard/analytic'],
        () => apiGetAnalyticDashboard<GetAnalyticDashboardResponse>(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )
    const navigate = useNavigate()
    const handleCreate = () => {
        navigate('/create-center')
    }
    return (
        <Loading loading={isLoading}>

            {data && (
                <div className="flex flex-col gap-4">
                    <AnalyticHeader
                        selectedPeriod={selectedPeriod}
                        onSelectedPeriodChange={setSelectedPeriod}
                    />
                    <div className="grid lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-3" >
                            <Card className='h-full'>

                                <IconText
                                    className="text-xl text-primary-deep font-semibold"
                                    icon={<MdOutlineElectricBolt className="text-xl" />}
                                >
                                    أنشئ حجرتك واربح أكثر
                                </IconText>
                                <p className="text-base mt-3 mr-2">
                                    خدماتنا الإعلانية الشاملة تصنع حضورك الرقمی وتضاعف وصولك إلى جمهورك المستهدف.
                                    نحو إبداعٍ مؤثر، نتائج قابلة للقیاس، ونموٍ مستدام لعلامتك التجارية.
                                </p>
                                <div className="mt-2 flex items-center justify-end">
                                    <Button size="sm" onClick={handleCreate} variant="solid">إنشاء مركز خدمة</Button>
                                </div>
                            </Card>
                        </div>

                        <div>
                            <Card>
                                <div className="flex items-center justify-between mb-4">
                                    <h4>إكمال الملف الشخصي</h4>
                                    <Button variant="plain" size="xs">أكمل حسابك</Button>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex flex-col">
                                        <h2>
                                            <AbbreviateNumber
                                                value={10}
                                            />
                                            <span className="opacity-60 text-base font-bold">
                                                {' / '}
                                                <AbbreviateNumber
                                                    value={100}
                                                />{' '}
                                                %
                                            </span>
                                        </h2>
                                        <div className="mt-1">
                                            يرجى إكمال ملفك الشخصي لتحسين الأداء
                                        </div>
                                    </div>
                                    <div>
                                        <Progress
                                            percent={10}
                                            width={80}
                                            variant="circle"
                                            strokeWidth={8}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>


                    <div className="flex flex-col 2xl:grid grid-cols-4 gap-4">
                        <div className="col-span-4 2xl:col-span-3">
                            <WebAnalytic
                                data={data[selectedPeriod].webAnalytic}
                            />
                        </div>
                        <div className="2xl:col-span-1">
                            <Metrics
                                data={data[selectedPeriod].metrics}
                                selectedPeriod={selectedPeriod}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-6 xl:col-span-4">
                            <TopPerformingPages
                                data={data[selectedPeriod].topPages}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6 xl:col-span-4">
                            <DeviceSession
                                data={data[selectedPeriod].deviceSession}
                            />
                        </div>
                        <div className="col-span-12 xl:col-span-4">
                            <TopChannel
                                data={data[selectedPeriod].topChannel}
                            />
                        </div>
                        <div className="col-span-12">
                            <Traffic data={data[selectedPeriod].traffic} />
                        </div>
                    </div>
                </div>
            )}
        </Loading>
    )
}

export default AnalyticDashboard
