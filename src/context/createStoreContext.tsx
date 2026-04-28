import { createContext, useContext, useState, ReactNode } from 'react'

export interface ServiceItem {
    id: number
    serviceId: number
    serviceLabel: string
    duration: number
    price: number
    description: string
}

export interface TeamMember {
    id: number
    name: string
    position: string
    image: string | null
}

export interface DaySchedule {
    day: 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
    dayLabel: string
    isOpen: boolean
    startTime: string
    endTime: string
}

export interface ServiceAssignment {
    id: number
    serviceId: number
    serviceLabel: string
    memberId: number
    memberName: string
    weeklySchedule: DaySchedule[]
}

export interface HojraInfo {
    title: string
    service_id: number | null
    about_text: string
    about_us: string
}

export interface NewHojraData {
    id: number
    slug: string
}

export type ExtraInformationDraftValues = {
    logo: File | null
    banner: File | null
    latitude: string
    longitude: string
    city_id?: number | null
    phone: string
    website: string
    address: string
    instagram: string
    youtube: string
    linkedin: string
    facebook: string
    h1: string
    meta_description: string
}

export interface ExtraInformationDraft {
    values: Partial<ExtraInformationDraftValues>
    logoPreview: string | null
    bannerPreview: string | null
}

interface CreateStoreContextType {
    hojraInfo: HojraInfo
    setHojraInfo: (info: HojraInfo) => void

    setNewHojraData: (data: NewHojraData) => void
    newHojraData: NewHojraData

    services: ServiceItem[]
    setServices: (services: ServiceItem[]) => void
    addService: (service: ServiceItem) => void
    removeService: (id: number) => void

    teamMembers: TeamMember[]
    setTeamMembers: (members: TeamMember[]) => void
    addTeamMember: (member: TeamMember) => void
    removeTeamMember: (id: number) => void

    assignments: ServiceAssignment[]
    setAssignments: (assignments: ServiceAssignment[]) => void
    addAssignment: (assignment: ServiceAssignment) => void
    removeAssignment: (id: number) => void
    updateAssignmentSchedule: (
        assignmentId: number,
        weeklySchedule: DaySchedule[],
    ) => void

    extraInformationDraft: ExtraInformationDraft
    setExtraInformationDraft: (draft: ExtraInformationDraft) => void
    updateExtraInformationDraft: (draft: Partial<ExtraInformationDraft>) => void
}

const CreateStoreContext = createContext<CreateStoreContextType | null>(null)

export const useCreateStore = () => {
    const ctx = useContext(CreateStoreContext)
    if (!ctx)
        throw new Error('useCreateStore must be inside CreateStoreProvider')
    return ctx
}

export const CreateStoreProvider = ({
    children,
    initialHojraInfo,
    initialNewHojraData,
    initialServices,
    initialTeamMembers,
    initialAssignments,
}: {
    children: ReactNode
    initialHojraInfo?: Partial<HojraInfo>
    initialNewHojraData?: Partial<NewHojraData>
    initialServices?: ServiceItem[]
    initialTeamMembers?: TeamMember[]
    initialAssignments?: ServiceAssignment[]
}) => {
    const [hojraInfo, setHojraInfo] = useState<HojraInfo>({
        title: initialHojraInfo?.title ?? '',
        service_id: initialHojraInfo?.service_id ?? null,
        about_text: initialHojraInfo?.about_text ?? '',
        about_us: initialHojraInfo?.about_us ?? '',
    })

    const [newHojraData, setNewHojraData] = useState<NewHojraData>({
        id: initialNewHojraData?.id ?? 0,
        slug: initialNewHojraData?.slug ?? '',
    })

    const [services, setServices] = useState<ServiceItem[]>(initialServices ?? [])
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
        initialTeamMembers ?? [],
    )
    const [assignments, setAssignments] = useState<ServiceAssignment[]>(
        initialAssignments ?? [],
    )
    const [extraInformationDraft, setExtraInformationDraft] =
        useState<ExtraInformationDraft>({
            values: {},
            logoPreview: null,
            bannerPreview: null,
        })

    const addService = (service: ServiceItem) => {
        setServices((prev) => [...prev, service])
    }

    const removeService = (id: number) => {
        setServices((prev) => prev.filter((s) => s.id !== id))
        setAssignments((prev) => prev.filter((a) => a.serviceId !== id))
    }

    const addTeamMember = (member: TeamMember) => {
        setTeamMembers((prev) => [...prev, member])
    }

    const removeTeamMember = (id: number) => {
        setTeamMembers((prev) => prev.filter((m) => m.id !== id))
        setAssignments((prev) => prev.filter((a) => a.memberId !== id))
    }

    const addAssignment = (assignment: ServiceAssignment) => {
        setAssignments((prev) => [...prev, assignment])
    }

    const removeAssignment = (id: number) => {
        setAssignments((prev) => prev.filter((a) => a.id !== id))
    }

    const updateAssignmentSchedule = (
        assignmentId: number,
        weeklySchedule: DaySchedule[],
    ) => {
        setAssignments((prev) =>
            prev.map((a) =>
                a.id === assignmentId
                    ? { ...a, weeklySchedule }
                    : a,
            ),
        )
    }

    const updateExtraInformationDraft = (draft: Partial<ExtraInformationDraft>) => {
        setExtraInformationDraft((prev) => ({
            ...prev,
            ...draft,
            values: {
                ...(prev.values ?? {}),
                ...(draft.values ?? {}),
            },
        }))
    }

    return (
        <CreateStoreContext.Provider
            value={{
                hojraInfo,
                setHojraInfo,
                newHojraData,
                setNewHojraData,
                services,
                setServices,
                addService,
                removeService,
                teamMembers,
                setTeamMembers,
                addTeamMember,
                removeTeamMember,
                assignments,
                setAssignments,
                addAssignment,
                removeAssignment,
                updateAssignmentSchedule,
                extraInformationDraft,
                setExtraInformationDraft,
                updateExtraInformationDraft,
            }}
        >
            {children}
        </CreateStoreContext.Provider>
    )
}
