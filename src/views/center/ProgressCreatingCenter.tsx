import { Alert, Card, Progress } from "@/components/ui";
import { HiFire } from "react-icons/hi";

interface ProgressCreatingCenterProps {
    step: number;
}

const CircleCustomInfo = ({ percent }: { percent: number }) => {
    return (
        <div className="text-center">
            <div className="text-xl"><span className="text-3xl font-bold text-primary-mild">{percent}</span> / 6</div>
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
                    percent={(step / 6) * 100}
                    width={150}
                    className="flex items-center justify-center"
                    customInfo={<CircleCustomInfo percent={step} />}
                />

                <div className="mt-5">
                    {
                        step == 1 && <Alert showIcon className="mb-4" type="info">
                            مع الخطوة الاولى وادخال البيانات الاساسية يتم انشاء حجرتك مباشرة، ثم عبر استكمال التفاصيل ستتمكن من بناء ملف مهني متكامل.
                        </Alert>
                    }
                    {
                        step == 2 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            يرجى استكمال المعلومات الإضافية مثل الشعار، البنر، الموقع الجغرافي ومعلومات التواصل لزيادة ظهور مركزك.
                        </Alert>
                    }
                    {
                        step == 3 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            أضف صور المعرض لعرض خدماتك بشكل احترافي وبناء ثقة العملاء.
                        </Alert>
                    }
                    {
                        step == 4 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            أضف الخدمات الأساسية مع تفاصيل السعر والمدة والوصف لضمان وضوح خدماتك.
                        </Alert>
                    }
                    {
                        step == 5 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            قم بتعيين الخدمات للموظفين المناسبين لضمان توزيع العمل بشكل صحيح.
                        </Alert>
                    }
                    {
                        step == 6 && <Alert showIcon type="success" customIcon={<HiFire />}>
                            راجع جميع البيانات قبل الحفظ النهائي والتأكيد.
                        </Alert>
                    }
                </div>

            </Card>
        </div>
    )

}
