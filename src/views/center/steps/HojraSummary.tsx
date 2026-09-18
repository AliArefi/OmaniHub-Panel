// steps/HojraSummary.tsx
import { Button, Card, toast } from "@/components/ui";
import { useState } from "react";
import { useNavigate } from "react-router";
import Notification from "@/components/ui/Notification";
import { useCreateStore } from "@/context/createStoreContext";
import { getPricingTypeLabel, getServicePricingLabel } from '@/utils/pricing'
import useTranslation from '@/utils/hooks/useTranslation'

interface HojraSummaryProps {
    changeState: (value: number) => void;
}

export const HojraSummary = ({ changeState }: HojraSummaryProps) => {
    const { hojraInfo, services, teamMembers, assignments } = useCreateStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation()

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);

        try {
            // اینجا payload نهایی رو بساز و بفرست به API
            const payload = {
                title: hojraInfo.title,
                service_id: hojraInfo.service_id,
                about_text: hojraInfo.about_text,
                services: services.map((s) => ({
                    service_id: s.serviceId,
                    duration: s.duration,
                    pricing_type: s.pricingType,
                    price: s.price,
                    description: s.description,
                })),
                team_members: teamMembers.map((m) => ({
                    name: m.name,
                    position: m.position,
                    image: m.image,
                })),
                assignments: assignments.map((a) => ({
                    service_id: a.serviceId,
                    member_id: a.memberId,
                    weekly_schedule: (a.weeklySchedule ?? []).map((sch) => ({
                        day: sch.day,
                        is_open: sch.isOpen,
                        slots: (sch.slots ?? []).map((slot) => ({
                            start_time: slot.startTime,
                            end_time: slot.endTime,
                        })),
                    })),
                })),
            };

            console.log("Final Payload:", payload);

            // TODO: ارسال به API
            // const resp = await apiCreateFullAgency(payload);

            await new Promise((r) => setTimeout(r, 1000)); // شبیه‌سازی API

            toast.push(
                <Notification type="success">
                    {t('centerCreation.summary.created')}
                </Notification>
            );

            navigate("/centers");
        } catch (err: unknown) {
            toast.push(
                <Notification type="danger">
                    {t('centerCreation.summary.submitError')}
                </Notification>
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card
            header={{
                content: t('centerCreation.summary.title'),
                bordered: false,
            }}
        >
            <div className="space-y-6">
                {/* معلومات الحجرة */}
                <div>
                    <h3 className="text-base font-semibold mb-2 text-primary-deep">
                        {t('centerCreation.summary.centerInformation')}
                    </h3>
                    <Card>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    {t('centerCreation.summary.centerName')}:
                                </span>
                                <span className="font-medium">
                                    {hojraInfo.title}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                    <span className="text-gray-500">{t('centerCreation.form.description')}:</span>
                                <span className="font-medium">
                                    {hojraInfo.about_text}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* الخدمات */}
                <div>
                    <h3 className="text-base font-semibold mb-2 text-primary-deep">
                        {t('centerCreation.summary.services', { count: services.length })}
                    </h3>
                    <div className="space-y-2">
                        {services.map((service) => (
                            <Card key={service.id}>
                                <div className="text-sm space-y-1">
                                    <div className="font-semibold">
                                        {service.serviceLabel}
                                    </div>
                                    <div className="flex gap-4 text-gray-600">
                                        <span>
                                            {t('centerCreation.summary.duration')}: {service.durationLabel}
                                        </span>
                                        <span>
                                            {t('centerCreation.summary.pricingType')}: {getPricingTypeLabel(service.pricingType)}
                                        </span>
                                        <span>
                                            {t('centerCreation.summary.price')}: {getServicePricingLabel(service)}
                                        </span>
                                    </div>
                                    <div className="text-gray-700">
                                        {service.description}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* أعضاء الفريق */}
                <div>
                    <h3 className="text-base font-semibold mb-2 text-primary-deep">
                        {t('centerCreation.summary.teamMembers', { count: teamMembers.length })}
                    </h3>
                    <div className="space-y-2">
                        {teamMembers.map((member) => {
                            const memberAssignments = assignments.filter(
                                (a) => a.memberId === member.id
                            );

                            return (
                                <Card key={member.id}>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            {member.image && (
                                                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                                    <img
                                                        src={member.image}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {member.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {member.position}
                                                </div>
                                            </div>
                                        </div>

                                        {/* خدمات این عضو */}
                                        {memberAssignments.length > 0 && (
                                            <div className="mr-4 space-y-2">
                                                {memberAssignments.map(
                                                    (assign) => (
                                                        <div
                                                            key={assign.id}
                                                            className="bg-gray-50 rounded-lg p-2"
                                                        >
                                                            <div className="text-xs font-medium text-primary-deep mb-1">
                                                                {
                                                                    assign.serviceLabel
                                                                }
                                                            </div>
                                                            {(assign.weeklySchedule ?? [])
                                                                .filter(
                                                                    (sch) =>
                                                                        Boolean(
                                                                            sch.isOpen,
                                                                        ),
                                                                )
                                                                .map((sch) =>
                                                                    (sch.slots ?? []).map((slot, slotIndex) => (
                                                                        <div
                                                                            key={`${assign.id}-${sch.day}-${slotIndex}`}
                                                                            className="text-xs text-gray-600 flex items-center gap-1"
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="w-3 h-3"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                                />
                                                                            </svg>
                                                                            {sch.dayLabel}{' '}
                                                                            |{' '}
                                                                            {slot.startTime}{' '}
                                                                            -{' '}
                                                                            {slot.endTime}
                                                                        </div>
                                                                    )),
                                                                )}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* دکمه‌های نهایی */}
                <div className="border-t pt-4">
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => changeState(5)}
                        >
                            {t('centerCreation.summary.back')}
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            loading={isSubmitting}
                            onClick={handleFinalSubmit}
                        >
                            {t('centerCreation.summary.confirm')}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
