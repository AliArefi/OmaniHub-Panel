// steps/HojraServices.tsx
import { Button, Card, FormItem, Input, Select, toast } from "@/components/ui";
import Notification from "@/components/ui/Notification";
import { ServiceItem, useCreateStore } from "@/context/createStoreContext";
import { useState } from "react";
import { apiCreateAgencyService } from "@/services/CenterService";

interface HojraServicesProps {
    changeState: (value: number) => void;
}

const servicesData = [
    {
        value: 1,
        label: "عناية بالوجه",
        options: [
            { value: 11, label: "تنظيف الوجه" },
            { value: 12, label: "علاج حب الشباب" },
        ],
    },
    {
        value: 2,
        label: "عناية بالشعر",
        options: [
            { value: 21, label: "تصفيف الشعر" },
            { value: 22, label: "صبغ الشعر" },
        ],
    },
    {
        value: 3,
        label: "عناية بالأظافر",
        options: [
            { value: 31, label: "مانيكير" },
            { value: 32, label: "باديكير" },
        ],
    },
    {
        value: 4,
        label: "إزالة الشعر",
        options: [
            { value: 41, label: "إزالة الشعر بالشمع" },
            { value: 42, label: "إزالة الشعر بالليزر" },
        ],
    },
    {
        value: 5,
        label: "التدليك",
        options: [
            { value: 51, label: "التدليك السويدي" },
            { value: 52, label: "التدليك بالزيوت" },
        ],
    },
    {
        value: 6,
        label: "المكياج",
        options: [
            { value: 61, label: "مكياج العروس" },
            { value: 62, label: "مكياج يومي" },
        ],
    },
    {
        value: 7,
        label: "العناية بالحواجب",
        options: [
            { value: 71, label: "تشذيب الحواجب" },
            { value: 72, label: "تلوين الحواجب" },
        ],
    },
    {
        value: 8,
        label: "الليزر",
        options: [
            { value: 81, label: "ليزر الوجه" },
            { value: 82, label: "ليزر الجسم" },
        ],
    },
    {
        value: 9,
        label: "استشارة جمالية",
        options: [
            { value: 91, label: "استشارة للبشرة" },
            { value: 92, label: "استشارة للشعر" },
        ],
    },
];

export const HojraServices = ({ changeState }: HojraServicesProps) => {
    const { services, addService, removeService, newHojraData, hojraInfo } =
        useCreateStore();

    const [selectedMainService, setSelectedMainService] = useState<number | null>(null);
    const [selectedSubService, setSelectedSubService] = useState<number | null>(null);
    const [duration, setDuration] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    const subOptions =
        servicesData.find((s) => s.value === selectedMainService)?.options || [];

    const mainOptions = servicesData.map((s) => ({
        value: s.value,
        label: s.label,
    }));

    const isDuplicate = (subServiceValue: number): boolean => {
        return services.some(
            (service) => service.subServiceValue === subServiceValue
        );
    };

    const isFormComplete = (): boolean => {
        return (
            selectedMainService !== null &&
            selectedSubService !== null &&
            duration.trim() !== "" &&
            Number(duration) > 0 &&
            price.trim() !== "" &&
            Number(price) > 0 &&
            description.trim() !== "" &&
            !isDuplicate(selectedSubService)
        );
    };

    const handleAddService = async () => {
        if (
            isSaving ||
            !isFormComplete() ||
            selectedSubService === null ||
            selectedMainService === null
        )
            return;

        if (!newHojraData?.id) {
            toast.push(
                <Notification type="danger">
                    لم يتم إنشاء المركز بعد. ارجع للخطوة السابقة وأنشئ المركز أولاً.
                </Notification>
            );
            return;
        }

        const mainService = servicesData.find(
            (s) => s.value === selectedMainService
        );
        const subService = subOptions.find(
            (s) => s.value === selectedSubService
        );

        if (!mainService || !subService) return;

        setIsSaving(true);
        try {
            const resp = await apiCreateAgencyService({
                agency_id: newHojraData.id,
                service_id: hojraInfo.service_id ?? undefined,
                agency_service_category_id: selectedSubService,
                title: `${mainService.label} - ${subService.label}`,
                sub_title: description.trim().slice(0, 191),
                estimate_time: Number(duration),
                price: Number(price),
                body: description.trim(),
            });

            if (!resp?.success) {
                throw new Error(resp?.message || "تعذر حفظ الخدمة");
            }

            const newService: ServiceItem = {
                id: resp.data.id,
                subServiceValue: selectedSubService,
                subServiceLabel: subService.label,
                mainServiceValue: selectedMainService,
                mainServiceLabel: mainService.label,
                duration: Number(duration),
                price: Number(price),
                description: description.trim(),
            };

            addService(newService);
        } catch (err: unknown) {
            const apiMessage = (() => {
                if (typeof err !== "object" || err === null) return undefined;
                const response = (err as { response?: unknown }).response;
                if (typeof response !== "object" || response === null)
                    return undefined;
                const data = (response as { data?: unknown }).data;
                if (typeof data !== "object" || data === null) return undefined;
                const message = (data as { message?: unknown }).message;
                return typeof message === "string" && message.trim()
                    ? message
                    : undefined;
            })();

            const message = err instanceof Error ? err.message : undefined;

            toast.push(
                <Notification type="danger">
                    {apiMessage || message || "حدث خطأ أثناء حفظ الخدمة"}
                </Notification>
            );
            return;
        } finally {
            setIsSaving(false);
        }

        setSelectedMainService(null);
        setSelectedSubService(null);
        setDuration("");
        setPrice("");
        setDescription("");
    };

    return (
        <Card
            header={{
                content: "تعريف الخدمات",
                bordered: false,
            }}
        >
            <div className="space-y-4">
                <FormItem label="نوع الخدمة الرئيسية">
                    <Select
                        placeholder="اختر نوع الخدمة"
                        options={mainOptions}
                        value={
                            mainOptions.find(
                                (s) => s.value === selectedMainService
                            ) || null
                        }
                        onChange={(opt) => {
                            setSelectedMainService(opt?.value ?? null);
                            setSelectedSubService(null);
                        }}
                    />
                </FormItem>

                <FormItem label="الخدمة الفرعية">
                    <Select
                        placeholder="اختر الخدمة الفرعية"
                        options={subOptions}
                        isDisabled={!selectedMainService}
                        value={
                            subOptions.find(
                                (s) => s.value === selectedSubService
                            ) || null
                        }
                        onChange={(opt) =>
                            setSelectedSubService(opt?.value ?? null)
                        }
                    />
                </FormItem>

                {selectedSubService && isDuplicate(selectedSubService) && (
                    <div className="text-red-500 text-sm">
                        هذه الخدمة موجودة بالفعل في القائمة
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormItem
                        label="مدة الخدمة"
                        extra={
                            <div className="text-xs text-gray-400 mx-1">
                                دقائق
                            </div>
                        }
                    >
                        <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="مدة الخدمة"
                            min="1"
                        />
                    </FormItem>

                    <FormItem
                        label="سعر الخدمة"
                        extra={
                            <div className="text-xs text-gray-400 mx-1">
                                ريال
                            </div>
                        }
                    >
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="سعر الخدمة"
                            min="1"
                        />
                    </FormItem>
                </div>

                <FormItem label="وصف موجز للخدمة">
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="وصف موجز للخدمة"
                    />
                </FormItem>

                <FormItem>
                    <Button
                        variant="default"
                        type="button"
                        block
                        loading={isSaving}
                        disabled={isSaving || !isFormComplete()}
                        onClick={handleAddService}
                    >
                        إضافة خدمة
                    </Button>
                </FormItem>

                {/* لیست خدمات اضافه شده */}
                {services.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-lg font-semibold">
                            الخدمات المضافة ({services.length})
                        </h3>
                        {services.map((service) => (
                            <Card key={service.id}>
                                <div className="flex justify-between items-center flex-row">
                                    <div className="flex-1">
                                        <div className="font-semibold text-primary-deep text-base mb-1">
                                            {service.mainServiceLabel} -{" "}
                                            {service.subServiceLabel}
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1 flex gap-4">
                                            <span>
                                                المدة: {service.duration} دقيقة
                                            </span>
                                            <span>
                                                السعر: {service.price} ريال
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {service.description}
                                        </div>
                                    </div>
                                    <div>
                                        <Button
                                            variant="solid"
                                            shape="circle"
                                            size="xs"
                                            className="bg-red-300 hover:bg-red-400 transition-all"
                                            onClick={() =>
                                                removeService(service.id)
                                            }
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* نویگیشن */}
                <div>
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => changeState(1)}
                        >
                            خلف
                        </Button>
                        {services.length > 0 && (
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => changeState(3)}
                            >
                                التالي: تعيين الفريق
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
