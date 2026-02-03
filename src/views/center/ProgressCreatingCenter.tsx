import { Alert, Card, Progress } from "@/components/ui";
import { HiFire } from "react-icons/hi";

interface ProgressCreatingCenterProps {
    step: number;
}

const CircleCustomInfo = ({ percent }: { percent: number }) => {
    return (
        <div className="text-center">
            <div className="text-xl"><span className="text-3xl font-bold text-primary-mild">{percent}</span> / 4</div>
            <span>انتهاء</span>
        </div>
    )
}

export function ProgressCreatingCenter({ step }: ProgressCreatingCenterProps) {
    return (
        <div className="w-full">
            <Card
                className="w-full"
                header={{
                    content: 'حالة إنشاء المركز',
                    bordered: false,
                }}>
                <Progress
                    variant="circle"
                    percent={(step / 4) * 100}
                    width={150}
                    className="flex items-center justify-center"
                    customInfo={<CircleCustomInfo percent={step} />}
                />

                <div className="mt-5">
                    {
                        step == 1 && <Alert showIcon className="mb-4" type="info">
                            مع الخطوة الاولى وادخال البيانات الاساسية يتم انشاء حجرتك مباشرة، ثم عبر استكمال تفاصيل مركز خدماتك في قسمي الخدمات واعضاء الفريق وساعات العمل ستتمكن من بناء ملف مهني متكامل يعزز ثقة العملاء ويعرض خدماتك بشكل افضل واحترافي.
                        </Alert>
                    }
                    {
                        step == 2 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            تم إنشاء طلبك لإنشاء المركز وإرساله إلى الخبراء المختصين، وبعد الموافقة ستكون صفحة مركزك متاحة. يرجى استكمال المعلومات لزيادة كفاءة الاستفادة من خدماتك.
                        </Alert>
                    }
                    {
                        step == 3 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            يرجى اختيار أعضاء فريقك واستكمال المعلومات المطلوبة لتمكين خدماتك ورفع جودة استخدامها بشكل أفضل
                        </Alert>
                    }
                    {
                        step == 4 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            يرجى تحديد أوقات العمل واستكمال المعلومات المطلوبة لضمان تنظيم أفضل لخدماتك وتسهيل حجز المواعيد للعملاء.
                        </Alert>
                    }
                </div>

            </Card>
        </div>
    )

}