import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useSWR from 'swr'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import PhoneNumberInput, { type PhoneNumberValue } from '@/components/shared/PhoneNumberInput'
import { apiGetCities } from '@/services/CenterService'
import { apiUpdateAdminAgencyAdditionalInfo } from '@/services/admin/AdminAgenciesService'
import type { AdminAgency } from '@/@types/admin'
import { MapPicker } from '@/views/center/ViewCenter/components/steps/components/MapPicker'
import {
    AdditionalInfoEditor,
    DEFAULT_ADDITIONAL_INFO,
    DEFAULT_SCHEDULE,
    OpeningHoursEditor,
    type AdditionalInfo,
    type WeeklySchedule,
} from '@/views/center/ViewCenter/components/steps/components/WorkingHoursEditor'

const schema = z.object({
    city_id: z.number().nullable(),
    latitude: z.string().refine((value) => value === '' || (Number(value) >= -90 && Number(value) <= 90), 'Latitude must be between -90 and 90.'),
    longitude: z.string().refine((value) => value === '' || (Number(value) >= -180 && Number(value) <= 180), 'Longitude must be between -180 and 180.'),
    phone: z.string().trim().min(1, 'Phone is required.').max(80),
    whatsapp: z.string().max(50),
    website: z.union([z.literal(''), z.string().url('Enter a valid website URL.')]),
    instagram: z.union([z.literal(''), z.string().url('Enter a valid Instagram URL.')]),
    youtube: z.union([z.literal(''), z.string().url('Enter a valid YouTube URL.')]),
    linkedin: z.union([z.literal(''), z.string().url('Enter a valid LinkedIn URL.')]),
    facebook: z.union([z.literal(''), z.string().url('Enter a valid Facebook URL.')]),
})

type Values = z.infer<typeof schema>
const DAY_KEYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const INFO_LABELS: Record<keyof AdditionalInfo, string> = {
    instant_confirmation: 'Instant confirmation',
    kid_friendly: 'Kid friendly',
    parking_available: 'Parking available',
    near_public_transport: 'Near public transport',
    environmentally_friendly: 'Environmentally friendly',
    woman_owned: 'Woman owned',
}

const toSchedule = (agency: AdminAgency): WeeklySchedule => {
    const schedule = Object.fromEntries(
        DAY_KEYS.map((key) => [
            key,
            { ...DEFAULT_SCHEDULE[key], closed: true },
        ]),
    ) as WeeklySchedule
    for (const day of agency.working_hours ?? []) {
        const key = DAY_KEYS[day.day_of_week]
        if (!key) continue
        schedule[key] = {
            closed: false,
            open: day.start_time,
            close: day.end_time,
        }
    }
    return schedule
}

const toAdditionalInfo = (agency: AdminAgency): AdditionalInfo => {
    const info = { ...DEFAULT_ADDITIONAL_INFO }
    for (const item of agency.extra_info ?? []) {
        if (item.key && item.key in info) {
            info[item.key as keyof AdditionalInfo] =
                item.is_active && ['1', 'true', 'on', 'yes'].includes(String(item.value ?? '').toLowerCase())
        }
    }
    return info
}

export default function AgencyAdditionalInformationTab({
    agency,
    onSaved,
}: {
    agency: AdminAgency
    onSaved: () => Promise<unknown>
}) {
    const { data: cityResponse, isLoading: citiesLoading } = useSWR('agency-additional-cities', apiGetCities)
    const [schedule, setSchedule] = useState<WeeklySchedule>(() => toSchedule(agency))
    const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>(() => toAdditionalInfo(agency))
    const [phoneValue, setPhoneValue] = useState<PhoneNumberValue>({
        countryCode: '+968',
        localNumber: (agency.phone ?? '').replace(/^\+?968/, ''),
    })
    const { control, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: {
            city_id: agency.city_id,
            latitude: agency.latitude == null ? '' : String(agency.latitude),
            longitude: agency.longitude == null ? '' : String(agency.longitude),
            phone: agency.phone ?? '',
            whatsapp: agency.whatsapp ?? '',
            website: agency.website ?? '',
            instagram: agency.instagram ?? '',
            youtube: agency.youtube ?? '',
            linkedin: agency.linkedin ?? '',
            facebook: agency.facebook ?? '',
        },
    })
    const latitude = useWatch({ control, name: 'latitude' })
    const longitude = useWatch({ control, name: 'longitude' })
    const cityOptions = useMemo(
        () => (cityResponse?.data ?? []).map((city) => ({ value: city.id, label: city.name })),
        [cityResponse],
    )

    const submit = async (values: Values) => {
        const knownKeys = new Set(Object.keys(additionalInfo))
        const extraInfo = [
            ...(agency.extra_info ?? []).filter((item) => !item.key || !knownKeys.has(item.key)),
            ...Object.entries(additionalInfo).map(([key, enabled], index) => ({
                key,
                label: INFO_LABELS[key as keyof AdditionalInfo],
                value: '1',
                type: 'boolean',
                is_active: enabled,
                order_number: index,
            })),
        ]
        const workingHoursDays = DAY_KEYS.map((key, dayOfWeek) => ({
            day_of_week: dayOfWeek,
            is_closed: schedule[key].closed,
            slots: schedule[key].closed
                ? []
                : [{ start: schedule[key].open, end: schedule[key].close, is_active: true }],
        }))

        try {
            await apiUpdateAdminAgencyAdditionalInfo(agency.slug, {
                ...values,
                city_id: values.city_id || null,
                latitude: values.latitude || null,
                longitude: values.longitude || null,
                extra_info: extraInfo,
                working_hours_days: workingHoursDays,
            })
            await onSaved()
            toast.push(<Notification type="success" title="Saved">Additional information updated.</Notification>)
        } catch (error) {
            const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
            for (const [field, messages] of Object.entries(response?.errors ?? {})) {
                if (field in schema.shape && messages[0]) {
                    setError(field as keyof Values, { type: 'server', message: messages[0] })
                }
            }
            const message = response?.message
            toast.push(<Notification type="danger" title="Failed to save">{message || 'Please review the entered values.'}</Notification>)
        }
    }

    return (
        <Form className="space-y-6" onSubmit={handleSubmit(submit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormItem label="City">
                    <Controller name="city_id" control={control} render={({ field }) => (
                        <Select isClearable isLoading={citiesLoading} options={cityOptions} value={cityOptions.find((option) => option.value === field.value) ?? null} onChange={(option) => field.onChange(option?.value ?? null)} />
                    )} />
                </FormItem>
                <FormItem label="Phone" invalid={Boolean(errors.phone)} errorMessage={errors.phone?.message}>
                    <Controller name="phone" control={control} render={({ field }) => (
                        <PhoneNumberInput value={phoneValue} onChange={(value) => { setPhoneValue(value); const phone = `${value.countryCode}${value.localNumber}`; field.onChange(phone); setValue('phone', phone, { shouldValidate: true }) }} />
                    )} />
                </FormItem>
                {(['latitude', 'longitude', 'whatsapp', 'website', 'instagram', 'youtube', 'linkedin', 'facebook'] as const).map((name) => (
                    <FormItem key={name} label={name.replace('_', ' ')} invalid={Boolean(errors[name])} errorMessage={errors[name]?.message}>
                        <Controller name={name} control={control} render={({ field }) => <Input {...field} />} />
                    </FormItem>
                ))}
            </div>

            <section className="space-y-3">
                <h3 className="text-base font-semibold">Map location</h3>
                <MapPicker
                    lat={latitude === '' ? undefined : Number(latitude)}
                    lng={longitude === '' ? undefined : Number(longitude)}
                    onPick={(lat, lng) => {
                        setValue('latitude', lat.toFixed(7), { shouldDirty: true, shouldValidate: true })
                        setValue('longitude', lng.toFixed(7), { shouldDirty: true, shouldValidate: true })
                    }}
                />
            </section>

            <section className="space-y-3">
                <h3 className="text-base font-semibold">Opening hours</h3>
                <OpeningHoursEditor value={schedule} onChange={setSchedule} />
            </section>
            <section className="space-y-3">
                <h3 className="text-base font-semibold">Additional information</h3>
                <AdditionalInfoEditor value={additionalInfo} onChange={setAdditionalInfo} />
            </section>
            <div className="flex justify-end">
                <Button type="submit" variant="solid" loading={isSubmitting}>Save additional information</Button>
            </div>
        </Form>
    )
}
