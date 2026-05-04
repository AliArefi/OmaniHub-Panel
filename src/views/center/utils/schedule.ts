import type { DaySchedule, TimeSlot } from '@/context/createStoreContext'

export const OMAN_WEEK_DAYS: Array<{
    day: DaySchedule['day']
    label: string
}> = [
    { day: 'sunday', label: 'الأحد (Sunday)' },
    { day: 'monday', label: 'الاثنين (Monday)' },
    { day: 'tuesday', label: 'الثلاثاء (Tuesday)' },
    { day: 'wednesday', label: 'الأربعاء (Wednesday)' },
    { day: 'thursday', label: 'الخميس (Thursday)' },
    { day: 'friday', label: 'الجمعة (Friday)' },
    { day: 'saturday', label: 'السبت (Saturday)' },
]

export const DEFAULT_TIME_SLOT: TimeSlot = {
    startTime: '09:00',
    endTime: '17:00',
}

export const createEmptyTimeSlot = (): TimeSlot => ({
    ...DEFAULT_TIME_SLOT,
})

export const createDefaultWeekSchedule = (): DaySchedule[] =>
    OMAN_WEEK_DAYS.map(({ day, label }) => ({
        day,
        dayLabel: label,
        isOpen: false,
        startTime: DEFAULT_TIME_SLOT.startTime,
        endTime: DEFAULT_TIME_SLOT.endTime,
        slots: [createEmptyTimeSlot()],
    }))

export const normalizeDaySchedule = (
    schedule: Partial<DaySchedule> & Pick<DaySchedule, 'day' | 'dayLabel'>,
): DaySchedule => {
    const slots =
        schedule.slots && schedule.slots.length > 0
            ? schedule.slots.map((slot) => ({
                  startTime: slot.startTime,
                  endTime: slot.endTime,
              }))
            : [
                  {
                      startTime: schedule.startTime || DEFAULT_TIME_SLOT.startTime,
                      endTime: schedule.endTime || DEFAULT_TIME_SLOT.endTime,
                  },
              ]

    return {
        day: schedule.day,
        dayLabel: schedule.dayLabel,
        isOpen: Boolean(schedule.isOpen),
        startTime: slots[0]?.startTime || DEFAULT_TIME_SLOT.startTime,
        endTime: slots[slots.length - 1]?.endTime || DEFAULT_TIME_SLOT.endTime,
        slots,
    }
}

export const mergeDaySlots = (schedule: DaySchedule): DaySchedule => {
    const sortedSlots = [...schedule.slots].sort((left, right) =>
        left.startTime.localeCompare(right.startTime),
    )

    return {
        ...schedule,
        startTime: sortedSlots[0]?.startTime || DEFAULT_TIME_SLOT.startTime,
        endTime:
            sortedSlots[sortedSlots.length - 1]?.endTime ||
            DEFAULT_TIME_SLOT.endTime,
        slots: sortedSlots,
    }
}

export const dayOfWeekFromKey = (day: DaySchedule['day']): number => {
    switch (day) {
        case 'saturday':
            return 0
        case 'sunday':
            return 1
        case 'monday':
            return 2
        case 'tuesday':
            return 3
        case 'wednesday':
            return 4
        case 'thursday':
            return 5
        case 'friday':
            return 6
    }
}
