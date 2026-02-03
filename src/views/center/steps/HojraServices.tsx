import { Button, Card, FormItem, Input, Select } from "@/components/ui";
import { useState } from "react";

interface HojraInformationProps {
    changeState: (value: number) => void;
}

interface Service {
    id: number;
    subServiceValue: number;
    subServiceLabel: string;
    mainServiceLabel: string;
    duration: number;
    price: number;
    description: string;
}

const services = [
    {
        value: 1,
        label: 'عناية بالوجه',
        group: 'العناية بالبشرة',
        options: [
            { value: 11, label: 'تنظيف الوجه' },
            { value: 12, label: 'علاج حب الشباب' }
        ]
    },
    {
        value: 2,
        label: 'عناية بالشعر',
        group: 'العناية بالشعر',
        options: [
            { value: 21, label: 'تصفيف الشعر' },
            { value: 22, label: 'صبغ الشعر' }
        ]
    },
    {
        value: 3,
        label: 'عناية بالأظافر',
        group: 'العناية بالأظافر',
        options: [
            { value: 31, label: 'مانيكير' },
            { value: 32, label: 'باديكير' }
        ]
    },
    {
        value: 4,
        label: 'إزالة الشعر',
        group: 'إزالة الشعر',
        options: [
            { value: 41, label: 'إزالة الشعر بالشمع' },
            { value: 42, label: 'إزالة الشعر بالليزر' }
        ]
    },
    {
        value: 5,
        label: 'التدليك',
        group: 'التدليك',
        options: [
            { value: 51, label: 'التدليك السويدي' },
            { value: 52, label: 'التدليك بالزيوت' }
        ]
    },
    {
        value: 6,
        label: 'المكياج',
        group: 'المكياج',
        options: [
            { value: 61, label: 'مكياج العروس' },
            { value: 62, label: 'مكياج يومي' }
        ]
    },
    {
        value: 7,
        label: 'العناية بالحواجب',
        group: 'العناية بالحواجب',
        options: [
            { value: 71, label: 'تشذيب الحواجب' },
            { value: 72, label: 'تلوين الحواجب' }
        ]
    },
    {
        value: 8,
        label: 'الليزر',
        group: 'الليزر',
        options: [
            { value: 81, label: 'ليزر الوجه' },
            { value: 82, label: 'ليزر الجسم' }
        ]
    },
    {
        value: 9,
        label: 'استشارة جمالية',
        group: 'الاستشارات',
        options: [
            { value: 91, label: 'استشارة للبشرة' },
            { value: 92, label: 'استشارة للشعر' }
        ]
    }
];

export const HojraServices = ({ changeState }: HojraInformationProps) => {
    const [selectedService, setSelectedService] = useState<number | null>(null);
    const [selectedSubService, setSelectedSubService] = useState<number | null>(null);
    const [duration, setDuration] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [addedServices, setAddedServices] = useState<Service[]>([]);

    const subOptions =
        services.find(s => s.value === selectedService)?.options || [];

    const mainOptions = services.map(s => ({
        value: s.value,
        label: s.label
    }));

    const isDuplicate = (subServiceValue: number): boolean => {
        return addedServices.some(service => service.subServiceValue === subServiceValue);
    };

    const isFormComplete = (): boolean => {
        return (
            selectedService !== null &&
            selectedSubService !== null &&
            duration.trim() !== '' &&
            Number(duration) > 0 &&
            price.trim() !== '' &&
            Number(price) > 0 &&
            description.trim() !== '' &&
            !isDuplicate(selectedSubService)
        );
    };

    const handleAddService = () => {
        if (!isFormComplete() || selectedSubService === null) return;

        const mainService = services.find(s => s.value === selectedService);
        const subService = subOptions.find(s => s.value === selectedSubService);

        if (!mainService || !subService) return;

        const newService: Service = {
            id: Date.now(),
            subServiceValue: selectedSubService,
            subServiceLabel: subService.label,
            mainServiceLabel: mainService.label,
            duration: Number(duration),
            price: Number(price),
            description: description.trim()
        };

        setAddedServices([...addedServices, newService]);

        setSelectedService(null);
        setSelectedSubService(null);
        setDuration('');
        setPrice('');
        setDescription('');
    };

    const handleDeleteService = (id: number) => {
        setAddedServices(addedServices.filter(service => service.id !== id));
    };

    return (
        <Card
            header={{
                content: 'الخدمات وأعضاء الفريق',
                bordered: false,
            }}
        >
            <div className="space-y-4">
                <FormItem label="الخدمات التي تقدمها">
                    <Select
                        placeholder="اختر نوع الخدمة"
                        options={mainOptions}
                        value={mainOptions.find(s => s.value === selectedService) || null}
                        onChange={(opt) => {
                            setSelectedService(opt?.value ?? null);
                            setSelectedSubService(null);
                        }}
                    />
                </FormItem>

                <FormItem label="الخدمة الفرعية">
                    <Select
                        placeholder="اختر الخدمة الفرعية"
                        options={subOptions}
                        isDisabled={!selectedService}
                        value={subOptions.find(s => s.value === selectedSubService) || null}
                        onChange={(opt) => setSelectedSubService(opt?.value ?? null)}
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
                        extra={<div className="text-xs text-gray-400 mx-1">دقائق</div>}
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
                        extra={<div className="text-xs text-gray-400 mx-1">ريال</div>}
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
                        disabled={!isFormComplete()}
                        onClick={handleAddService}
                    >
                        إضافة خدمات
                    </Button>
                </FormItem>

                {addedServices.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-lg font-semibold">الخدمات المضافة</h3>
                        {addedServices.map((service) => (
                            <Card key={service.id}>
                                <div className="flex justify-between items-center flex-row">
                                    <div className="flex-1">
                                        <div className="font-semibold text-primary-deep text-base mb-1">
                                            {service.mainServiceLabel} - {service.subServiceLabel}
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1 flex gap-4">
                                            <span>المدة: {service.duration} دقيقة</span>
                                            <span>السعر: {service.price} ريال</span>
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
                                            onClick={() => handleDeleteService(service.id)}
                                        >
                                            حذف
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-end gap-3">
                        <Button size="sm" variant="default" onClick={() => changeState(1)}>
                            خلف
                        </Button>
                        {addedServices.length > 0 && (
                            <Button size="sm" variant="solid" onClick={() => changeState(3)}>
                                سجل وأضف فريقًا
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
