import { AbbreviateNumber, IconText } from "@/components/shared";
import { Button, Card, Progress } from "@/components/ui";
import { MdOutlineElectricBolt } from "react-icons/md";
import { useNavigate } from 'react-router'

export default function Home() {
    const navigate = useNavigate()
    const handleCreate = () => {
        navigate('/create-center')
    }
    return (
        <div className="grid lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3" >
                <Card>

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
    );
}