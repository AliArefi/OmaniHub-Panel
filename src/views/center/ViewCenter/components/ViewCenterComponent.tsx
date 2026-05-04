import { Card, Spinner, toast } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { useEffect, useMemo, useState } from 'react'
import {
    CreateStoreProvider,
    type HojraInfo,
    type NewHojraData,
    type ServiceItem,
} from '@/context/createStoreContext'

import {
    apiGetMemberWorkingHours,
    apiGetMyAgency,
    apiGetMyServices,
    apiGetServiceMembers,
} from '@/services/CenterService'
import { useParams } from 'react-router'
import type {
    DaySchedule,
    ServiceAssignment,
    TeamMember,
} from '@/context/createStoreContext'
import {
    createDefaultWeekSchedule,
    normalizeDaySchedule,
} from './utils/schedule'
import { TabViewCenter } from './TabViewCenter'
import { VIEW_CENTER_TAB_STEP } from './ViewCenterTab'
import { ViewCenterTabInformation } from './steps/ViewCenterTabInformation'
import { ViewCenterTabExtraInformations } from './steps/ViewCenterTabExtraInformations'
import { ViewCenterTabGallery } from './steps/ViewCenterTabGallery'
import { ViewCenterTabServices } from './steps/ViewCenterTabServices'
import { ViewCenterTabAssignServices } from './steps/ViewCenterTabAssignServices'

export default function ViewCenterComponent() {
    const [step, setStep] = useState<number>(VIEW_CENTER_TAB_STEP.INFORMATION)
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
                const agencyResponse = await apiGetMyAgency(
                    agencySlug as string,
                )
                const agency = agencyResponse.data

                if (!agency || typeof agency !== 'object') {
                    throw new Error('Invalid center response.')
                }

                const hojraInfo: Partial<HojraInfo> = {
                    title: agency.title,
                    service_id: agency.service?.id ?? null,
                    about_text: agency.about_text ?? '',
                    about_us: agency.about_us ?? '',
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
                    .map((service) => {
                        const serviceId = service.service?.id ?? 0
                        return {
                            id: service.id,
                            serviceId,
                            serviceLabel:
                                service.title ||
                                service.service?.name ||
                                service.slug ||
                                String(service.id),
                            duration: Number(service.estimate_time ?? 0),
                            pricingType: service.pricing_type ?? 'fixed',
                            needsCoordination: Boolean(
                                service.needs_coordination,
                            ),
                            price:
                                typeof service.price === 'number'
                                    ? service.price
                                    : null,
                            priceMin:
                                typeof service.price_min === 'number'
                                    ? service.price_min
                                    : null,
                            priceMax:
                                typeof service.price_max === 'number'
                                    ? service.price_max
                                    : null,
                            description: service.body ?? '',
                        }
                    })
                    .filter((service) => service.serviceId > 0)

                const baseWeekDays: DaySchedule[] = createDefaultWeekSchedule()

                const serviceMembersResponses = await Promise.all(
                    mappedServices.map(async (service) => {
                        try {
                            const response = await apiGetServiceMembers(
                                service.id,
                            )
                            return { service, members: response.data ?? [] }
                        } catch {
                            return { service, members: [] }
                        }
                    }),
                )

                const membersById = new Map<number, TeamMember>()
                const assignmentsBoot: ServiceAssignment[] = []

                for (const serviceResponse of serviceMembersResponses) {
                    for (const member of serviceResponse.members) {
                        if (!membersById.has(member.id)) {
                            membersById.set(member.id, {
                                id: member.id,
                                name: member.name ?? '',
                                position: member.position ?? '',
                                image: member.image ?? null,
                            })
                        }

                        let weeklySchedule: DaySchedule[] =
                            baseWeekDays.map(normalizeDaySchedule)

                        try {
                            const workingHours = await apiGetMemberWorkingHours(
                                member.id,
                            )
                            const slotsByDay = new Map<
                                number,
                                Array<{ start: string; end: string }>
                            >()

                            for (const day of workingHours.days ?? []) {
                                const slots = (day.slots ?? []).map((slot) => ({
                                    start: slot.start,
                                    end: slot.end,
                                }))
                                slotsByDay.set(day.day_of_week, slots)
                            }

                            weeklySchedule = weeklySchedule.map(
                                (daySchedule) => {
                                    const dayIndex =
                                        daySchedule.day === 'saturday'
                                            ? 0
                                            : daySchedule.day === 'sunday'
                                              ? 1
                                              : daySchedule.day === 'monday'
                                                ? 2
                                                : daySchedule.day === 'tuesday'
                                                  ? 3
                                                  : daySchedule.day ===
                                                      'wednesday'
                                                    ? 4
                                                    : daySchedule.day ===
                                                        'thursday'
                                                      ? 5
                                                      : 6

                                    const slots = slotsByDay.get(dayIndex) ?? []
                                    if (slots.length === 0) {
                                        return normalizeDaySchedule({
                                            ...daySchedule,
                                            isOpen: false,
                                        })
                                    }

                                    return normalizeDaySchedule({
                                        ...daySchedule,
                                        isOpen: true,
                                        slots: slots.map((slot) => ({
                                            startTime: slot.start,
                                            endTime: slot.end,
                                        })),
                                    })
                                },
                            )
                        } catch {
                            // keep defaults
                        }

                        assignmentsBoot.push({
                            id: Number(
                                `${serviceResponse.service.id}${member.id}`,
                            ),
                            serviceId: serviceResponse.service.id,
                            serviceLabel: serviceResponse.service.serviceLabel,
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
                toast.push(<Notification type="danger">{message}</Notification>)
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
            <div className="grid gap-4">
                <div>
                    <Card bodyClass="p-0" className="p-0 overflow-hidden">
                        <TabViewCenter
                            changeState={(state) => setStep(state)}
                            step={step}
                        />
                    </Card>
                </div>
                <div className="">
                    {step === VIEW_CENTER_TAB_STEP.INFORMATION && (
                        <ViewCenterTabInformation />
                    )}
                    {step === VIEW_CENTER_TAB_STEP.EXTRA_INFORMATION && (
                        <ViewCenterTabExtraInformations />
                    )}
                    {step === VIEW_CENTER_TAB_STEP.GALLERY && (
                        <ViewCenterTabGallery />
                    )}
                    {step === VIEW_CENTER_TAB_STEP.SERVICES && (
                        <ViewCenterTabServices />
                    )}
                    {step === VIEW_CENTER_TAB_STEP.ASSIGN_SERVICES && (
                        <ViewCenterTabAssignServices />
                    )}
                </div>
            </div>
        </CreateStoreProvider>
    )
}
