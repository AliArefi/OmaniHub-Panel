import { Select } from "@/components/ui"

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayKey =
    | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
    | 'friday' | 'saturday' | 'sunday'

export interface DaySchedule {
    closed: boolean
    open: string
    close: string
}

export type WeeklySchedule = Record<DayKey, DaySchedule>

export type AdditionalInfoKey =
    | 'instant_confirmation' | 'kid_friendly' | 'parking_available'
    | 'near_public_transport' | 'environmentally_friendly' | 'woman_owned'

export type AdditionalInfo = Record<AdditionalInfoKey, boolean>

// ─── Constants ────────────────────────────────────────────────────────────────

export const DAYS: { key: DayKey; label: string }[] = [
    { key: 'monday',    label: 'الإثنين'  },
    { key: 'tuesday',   label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الأربعاء' },
    { key: 'thursday',  label: 'الخميس'   },
    { key: 'friday',    label: 'الجمعة'   },
    { key: 'saturday',  label: 'السبت'    },
    { key: 'sunday',    label: 'الأحد'    },
]

const ADDITIONAL_INFO_ITEMS: { key: AdditionalInfoKey; label: string }[] = [
    { key: 'instant_confirmation',     label: 'تأكيد فوري'               },
    { key: 'kid_friendly',             label: 'مناسب للأطفال'            },
    { key: 'parking_available',        label: 'موقف سيارات متاح'         },
    { key: 'near_public_transport',    label: 'قريب من المواصلات العامة' },
    { key: 'environmentally_friendly', label: 'صديق للبيئة'              },
    { key: 'woman_owned',              label: 'مملوك لامرأة'             },
]

function buildTimeOptions(stepMinutes = 30) {
    const options: { value: string; label: string }[] = []
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += stepMinutes) {
            const hh = String(h).padStart(2, '0')
            const mm = String(m).padStart(2, '0')
            const period = h < 12 ? 'am' : 'pm'
            const displayH = h % 12 === 0 ? 12 : h % 12
            options.push({ value: `${hh}:${mm}`, label: `${displayH}:${mm} ${period}` })
        }
    }
    return options
}

const TIME_OPTIONS = buildTimeOptions(30)

export const DEFAULT_SCHEDULE: WeeklySchedule = {
    monday:    { closed: false, open: '08:00', close: '17:00' },
    tuesday:   { closed: false, open: '08:00', close: '17:00' },
    wednesday: { closed: false, open: '08:00', close: '17:00' },
    thursday:  { closed: false, open: '08:00', close: '17:00' },
    friday:    { closed: false, open: '08:00', close: '17:00' },
    saturday:  { closed: true,  open: '08:00', close: '17:00' },
    sunday:    { closed: true,  open: '08:00', close: '17:00' },
}

export const DEFAULT_ADDITIONAL_INFO: AdditionalInfo = {
    instant_confirmation:     false,
    kid_friendly:             false,
    parking_available:        false,
    near_public_transport:    false,
    environmentally_friendly: false,
    woman_owned:              false,
}

// ─── Components ───────────────────────────────────────────────────────────────

export const OpeningHoursEditor = ({
    value,
    onChange,
}: {
    value: WeeklySchedule
    onChange: (next: WeeklySchedule) => void
}) => {
    const updateDay = (key: DayKey, patch: Partial<DaySchedule>) =>
        onChange({ ...value, [key]: { ...value[key], ...patch } })

    return (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
            {DAYS.map(({ key, label }) => {
                const day = value[key]
                return (
                    <div key={key} className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                        <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{label}</span>
                        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 accent-primary"
                                checked={day.closed}
                                onChange={(e) => updateDay(key, { closed: e.target.checked })}
                            />
                            <span className="text-sm text-gray-500">مغلق</span>
                        </label>
                        {day.closed ? (
                            <span className="text-sm text-gray-400 italic">مغلق</span>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Select
                                    size="sm"
                                    className="w-36"
                                    options={TIME_OPTIONS}
                                    value={TIME_OPTIONS.find((o) => o.value === day.open) ?? null}
                                    onChange={(opt) => updateDay(key, { open: opt?.value ?? day.open })}
                                />
                                <span className="text-gray-400 text-sm">—</span>
                                <Select
                                    size="sm"
                                    className="w-36"
                                    options={TIME_OPTIONS}
                                    value={TIME_OPTIONS.find((o) => o.value === day.close) ?? null}
                                    onChange={(opt) => updateDay(key, { close: opt?.value ?? day.close })}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export const AdditionalInfoEditor = ({
    value,
    onChange,
}: {
    value: AdditionalInfo
    onChange: (next: AdditionalInfo) => void
}) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ADDITIONAL_INFO_ITEMS.map(({ key, label }) => (
            <label
                key={key}
                className={[
                    'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer select-none transition-colors',
                    value[key]
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                ].join(' ')}
            >
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 accent-primary"
                    checked={value[key]}
                    onChange={() => onChange({ ...value, [key]: !value[key] })}
                />
                <span className="text-sm">{label}</span>
            </label>
        ))}
    </div>
)
