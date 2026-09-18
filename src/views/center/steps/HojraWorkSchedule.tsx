import { Button, Card, FormItem, Select } from "@/components/ui";
import { useState } from "react";
import useTranslation from '@/utils/hooks/useTranslation'

interface HojraWorkScheduleProps {
    changeState: (value: number) => void;
}

interface WorkSchedule {
    id: number;
    date: string;
    dateLabel: string;
    startTime: string;
    endTime: string;
}

interface SelectOption {
    value: string;
    label: string;
}

const generateNext30Days = (locale: string): SelectOption[] => {
    const days: SelectOption[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayName = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        days.push({
            value: `${year}-${month}-${day}`,
            label: `${dayName} ${day}/${month}/${year}`,
        });
    }

    return days;
};

const generateTimeOptions = (): SelectOption[] => {
    const times: SelectOption[] = [];
    for (let h = 6; h < 23; h++) {
        ["00", "30"].forEach((m) => {
            const time = `${h.toString().padStart(2, "0")}:${m}`;
            times.push({ value: time, label: time });
        });
    }
    return times;
};

export const HojraWorkSchedule = ({ changeState }: HojraWorkScheduleProps) => {
    const { t, i18n } = useTranslation()
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);

    const DATES = generateNext30Days(i18n.language);
    const TIME_OPTIONS = generateTimeOptions();

    const isDuplicateDate = (value: string) =>
        schedules.some((item) => item.date === value);

    const isFormComplete = () =>
        selectedDate !== "" && startTime !== "" && endTime !== "";

    const handleAdd = () => {
        if (!isFormComplete()) return;

        const dateLabel =
            DATES.find((d) => d.value === selectedDate)?.label || "";

        setSchedules((prev) => [
            ...prev,
            {
                id: Date.now(),
                date: selectedDate,
                dateLabel,
                startTime,
                endTime,
            },
        ]);

        setSelectedDate("");
        setStartTime("");
        setEndTime("");
    };

    const handleDelete = (id: number) => {
        setSchedules((prev) => prev.filter((item) => item.id !== id));
    };

    const availableDates = DATES.filter((d) => !isDuplicateDate(d.value));

    return (
        <Card header={{ content: t('centerCreationSchedule.title'), bordered: false }}>
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                    {t('centerCreationSchedule.hint')}
                </div>

                <FormItem label={t('centerCreationSchedule.date')}>
                    <Select
                        placeholder={t('centerCreationSchedule.chooseDate')}
                        value={selectedDate}
                        options={availableDates as any}
                        onChange={(val: any) => setSelectedDate(val?.value ?? "")}
                    />
                </FormItem>

                <div className="grid grid-cols-2 gap-3">
                    <FormItem label={t('centerCreationSchedule.from')}>
                        <Select
                            placeholder="--:--"
                            value={startTime}
                            options={TIME_OPTIONS as any}
                            onChange={(val: any) => setStartTime(val?.value ?? "")}
                        />
                    </FormItem>

                    <FormItem label={t('centerCreationSchedule.to')}>
                        <Select
                            placeholder="--:--"
                            value={endTime}
                            options={TIME_OPTIONS as any}
                            onChange={(val: any) => setEndTime(val?.value ?? "")}
                        />
                    </FormItem>
                </div>

                <FormItem>
                    <Button block disabled={!isFormComplete()} onClick={handleAdd}>
                        {t('centerCreationSchedule.add')}
                    </Button>
                </FormItem>

                {schedules.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">{t('centerCreationSchedule.added')}</h3>

                        {schedules.map((item) => (
                            <Card key={item.id}>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="font-semibold text-primary-deep">
                                            {item.dateLabel}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            <span className="inline-flex items-center gap-1">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                {item.startTime} - {item.endTime}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="solid"
                                        shape="circle"
                                        size="xs"
                                        className="bg-red-300 hover:bg-red-400"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        {t('centerCreationSchedule.delete')}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <Button size="md" variant="default" onClick={() => changeState(3)}>
                        {t('centerCreationSchedule.back')}
                    </Button>

                    {schedules.length > 0 && (
                        <Button size="md" variant="solid" >
                            {t('centerCreationSchedule.finish')}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
