import { Card, Spinner, toast } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { TimeLineCreateCenter } from './TimeLineCreateCenter'
import { useEffect, useMemo, useState } from 'react'
import { ProgressCreatingCenter } from './ProgressCreatingCenter'
import { HojraInformation } from './steps/HojraInformations'
import { HojraServices } from './steps/HojraServices'
import {
    CreateStoreProvider,
    type HojraInfo,
    type NewHojraData,
    type ServiceItem,
} from '@/context/createStoreContext'
import { HojraAssignServices } from './steps/HojraAssignServices'
import { HojraSummary } from './steps/HojraSummary'
import {
    apiGetMemberWorkingHours,
    apiGetMyAgency,
    apiGetMyServices,
    apiGetServiceMembers,
} from '@/services/CenterService'
import { useParams } from 'react-router'
import { HojraExtraInformations } from './steps/HojraExtraInformations'
import { HojraGallery } from './steps/HojraGallery'
import { CENTER_WIZARD_STEP } from './centerWizardSteps'
import { htmlToPlainText } from '@/utils/text/htmlToPlainText'
import type {
    DaySchedule,
    ServiceAssignment,
    TeamMember,
} from '@/context/createStoreContext'

export default function CreateStoreWizard() {
    const [step, setStep] = useState<number>(CENTER_WIZARD_STEP.INFORMATION);
    const { agencySlug } = useParams()

    const [isBootstrapping, setIsBootstrapping] = useState(false)
    const [bootstrapError, setBootstrapError] = useState<string | null>(null)
    const [initialHojraInfo, setInitialHojraInfo] = useState<
        Partial<HojraInfo> | undefined
    >(undefined)
    const [initialNewHojraData, setInitialNewHojraData] = useState<
        Partial<NewHojraData> | undefined
    >(undefined)
    const [initialServices, setInitialServices] = useState<
        ServiceItem[] | undefined
    >(undefined)
    const [initialTeamMembers, setInitialTeamMembers] = useState<
        TeamMember[] | undefined
    >(undefined)
    const [initialAssignments, setInitialAssignments] = useState<
        ServiceAssignment[] | undefined
    >(undefined)

    const isEditMode = useMemo(() => {
        return typeof agencySlug === 'string' && agencySlug.trim() !== ''
    }, [agencySlug])

    useEffect(() => {
        if (!isEditMode) return

        let isMounted = true
        setIsBootstrapping(true)
        setBootstrapError(null)

        Promise.resolve()
            .then(async () => {
                const agencyResponse = await apiGetMyAgency(agencySlug as string)
                const agency = agencyResponse.data

                if (!agency || typeof agency !== 'object') {
                    throw new Error('Invalid center response.')
                }

                const hojraInfo: Partial<HojraInfo> = {
                    title: agency.title,
                    service_id: agency.service?.id ?? null,
                    about_text: htmlToPlainText(agency.about_text ?? ''),
                }

                const newHojra: Partial<NewHojraData> = {
                    id: agency.id,
                    slug: agencySlug as string,
                }

                const servicesResp = await apiGetMyServices({
                    agency_id: agency.id,
                    per_page: 200,
                })

                const mappedServices: ServiceItem[] = (servicesResp.data ?? [])
                    .map((s) => {
                        const serviceId = s.service?.id ?? 0
                        return {
                            id: s.id,
                            serviceId,
                            serviceLabel:
                                s.title ||
                                s.service?.name ||
                                s.slug ||
                                String(s.id),
                            duration: Number(s.estimate_time ?? 0),
                            pricingType: s.pricing_type ?? 'fixed',
                            needsCoordination: Boolean(s.needs_coordination),
                            price:
                                typeof s.price === 'number' ? s.price : null,
                            priceMin:
                                typeof s.price_min === 'number'
                                    ? s.price_min
                                    : null,
                            priceMax:
                                typeof s.price_max === 'number'
                                    ? s.price_max
                                    : null,
                            description: s.body ?? '',
                        }
                    })
                    .filter((s) => s.serviceId > 0)

                const baseWeekDays: DaySchedule[] = [
                    {
                        day: 'saturday',
                        dayLabel: 'السبت',
                        isOpen: false,
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                    {
                        day: 'sunday',
                        dayLabel: 'الأحد',
                        isOpen: false,
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                    {
                        day: 'monday',
                        dayLabel: 'الاثنين',
                        isOpen: false,
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                    {
                        day: 'tuesday',
                        dayLabel: 'الثلاثاء',
                        isOpen: false,
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                    {
                        day: 'wednesday',
                        dayLabel: 'الأربعاء',
                        isOpen: false,
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                    {
                        day: 'thursday',
                        dayLabel: 'الخميس',
                        isOpen: false,
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                    {
                        day: 'friday',
                        dayLabel: 'الجمعة',
                        isOpen: false,
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                ]

                const serviceMembersResponses = await Promise.all(
                    mappedServices.map(async (svc) => {
                        try {
                            const resp = await apiGetServiceMembers(svc.id)
                            return { service: svc, members: resp.data ?? [] }
                        } catch {
                            return { service: svc, members: [] }
                        }
                    }),
                )

                const membersById = new Map<number, TeamMember>()
                const assignmentsBoot: ServiceAssignment[] = []

                for (const svcResp of serviceMembersResponses) {
                    for (const member of svcResp.members) {
                        if (!membersById.has(member.id)) {
                            membersById.set(member.id, {
                                id: member.id,
                                name: member.name ?? '',
                                position: member.position ?? '',
                                image: member.image ?? null,
                            })
                        }

                        let weeklySchedule: DaySchedule[] = baseWeekDays.map(
                            (d) => ({ ...d }),
                        )

                        try {
                            const wh = await apiGetMemberWorkingHours(member.id)
                            const byDay = new Map<number, { start: string; end: string }[]>()

                            for (const day of wh.days ?? []) {
                                const slots = (day.slots ?? []).map((s) => ({
                                    start: s.start,
                                    end: s.end,
                                }))
                                byDay.set(day.day_of_week, slots)
                            }

                            weeklySchedule = weeklySchedule.map((d) => {
                                const dayIndex =
                                    d.day === 'saturday'
                                        ? 0
                                        : d.day === 'sunday'
                                            ? 1
                                            : d.day === 'monday'
                                                ? 2
                                                : d.day === 'tuesday'
                                                    ? 3
                                                    : d.day === 'wednesday'
                                                        ? 4
                                                        : d.day === 'thursday'
                                                            ? 5
                                                            : 6

                                const slots = byDay.get(dayIndex) ?? []
                                if (slots.length === 0) {
                                    return { ...d, isOpen: false }
                                }

                                const first = slots[0]
                                return {
                                    ...d,
                                    isOpen: true,
                                    startTime: first.start,
                                    endTime: first.end,
                                }
                            })
                        } catch {
                            // keep defaults
                        }

                        assignmentsBoot.push({
                            id: Number(`${svcResp.service.id}${member.id}`),
                            serviceId: svcResp.service.id,
                            serviceLabel: svcResp.service.serviceLabel,
                            memberId: member.id,
                            memberName: member.name ?? '',
                            weeklySchedule,
                        })
                    }
                }

                if (!isMounted) return
                setInitialHojraInfo(hojraInfo)
                setInitialNewHojraData(newHojra)
                setInitialServices(mappedServices)
                setInitialTeamMembers(Array.from(membersById.values()))
                setInitialAssignments(assignmentsBoot)
            })
            .catch((err: unknown) => {
                if (!isMounted) return
                const message =
                    err instanceof Error
                        ? err.message
                        : 'حدث خطأ أثناء تحميل بيانات المركز'
                setBootstrapError(message)
                toast.push(
                    <Notification type="danger">{message}</Notification>,
                )
            })
            .finally(() => {
                if (!isMounted) return
                setIsBootstrapping(false)
            })

        return () => {
            isMounted = false
        }
    }, [agencySlug, isEditMode])

    if (isEditMode && (isBootstrapping || bootstrapError)) {
        if (bootstrapError) {
            return <div>{bootstrapError}</div>
        }

        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
            </div>
        )
    }

    return (
        <CreateStoreProvider
            initialHojraInfo={initialHojraInfo}
            initialNewHojraData={initialNewHojraData}
            initialServices={initialServices}
            initialTeamMembers={initialTeamMembers}
            initialAssignments={initialAssignments}
        >
            <div className="grid lg:grid-cols-4 gap-4">
                <div>
                    <Card>
                        <TimeLineCreateCenter step={step} />
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    {step === CENTER_WIZARD_STEP.INFORMATION && (
                        <HojraInformation changeState={(state) => setStep(state)} />
                    )}
                    {step === CENTER_WIZARD_STEP.EXTRA_INFORMATION && (
                        <HojraExtraInformations changeState={(state) => setStep(state)} />
                    )}
                    {step === CENTER_WIZARD_STEP.GALLERY && (
                        <HojraGallery changeState={(state) => setStep(state)} />
                    )}
                    {step === CENTER_WIZARD_STEP.SERVICES && (
                        <HojraServices changeState={(state) => setStep(state)} />
                    )}
                    {step === CENTER_WIZARD_STEP.ASSIGN_SERVICES && (
                        <HojraAssignServices changeState={(state) => setStep(state)} />
                    )}
                    {step === CENTER_WIZARD_STEP.SUMMARY && (
                        <HojraSummary changeState={(state) => setStep(state)} />
                    )}
                </div>
                <div className="w-full">
                    <ProgressCreatingCenter step={step} />
                </div>
            </div>
        </CreateStoreProvider>
    );
}
