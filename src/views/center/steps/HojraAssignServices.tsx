import { Button, Card, FormItem, Input, Select, toast } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import {
    ServiceAssignment,
    TeamMember,
    useCreateStore,
    WorkScheduleEntry,
} from '@/context/createStoreContext'
import { apiCreateMemberAgency } from '@/services/CenterService'
import { useEffect, useRef, useState } from 'react'

interface HojraAssignServicesProps {
    changeState: (value: number) => void
}

type ServiceSelectOption = { value: number; label: string }
type MemberSelectOption = { value: number; label: string }
type DateSelectOption = { value: string; label: string }
type TimeSelectOption = { value: string; label: string }

const generateNext30Days = (): DateSelectOption[] => {
    const days: DateSelectOption[] = []
    const today = new Date()
    const dayNames = [
        'الأحد',
        'الإثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
        'الجمعة',
        'السبت',
    ]

    for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dayName = dayNames[date.getDay()]
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        days.push({
            value: `${year}-${month}-${day}`,
            label: `${dayName} ${day}/${month}/${year}`,
        })
    }
    return days
}

const generateTimeOptions = (): TimeSelectOption[] => {
    const times: TimeSelectOption[] = []
    for (let h = 6; h < 23; h++) {
        ;['00', '30'].forEach((m) => {
            const time = `${h.toString().padStart(2, '0')}:${m}`
            times.push({ value: time, label: time })
        })
    }
    return times
}

const DATES = generateNext30Days()
const TIME_OPTIONS = generateTimeOptions()

export const HojraAssignServices = ({
    changeState,
}: HojraAssignServicesProps) => {
    const {
        services,
        teamMembers,
        addTeamMember,
        removeTeamMember,
        assignments,
        addAssignment,
        removeAssignment,
        addScheduleToAssignment,
        removeScheduleFromAssignment,
    } = useCreateStore()

    const [showNewMemberForm, setShowNewMemberForm] = useState(false)
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberRole, setNewMemberRole] = useState('')
    const [newMemberImage, setNewMemberImage] = useState<string | null>(null)
    const [newMemberImageFile, setNewMemberImageFile] = useState<File | null>(
        null,
    )
    const [newMemberServiceId, setNewMemberServiceId] = useState<number | null>(
        services[0]?.id ?? null,
    )
    const [isCreatingMember, setIsCreatingMember] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
        null,
    )
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(
        null,
    )

    const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(
        null,
    )
    const [scheduleDate, setScheduleDate] = useState<string>('')
    const [scheduleStartTime, setScheduleStartTime] = useState<string>('')
    const [scheduleEndTime, setScheduleEndTime] = useState<string>('')

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        setNewMemberImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setNewMemberImage(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleRemoveImage = () => {
        setNewMemberImage(null)
        setNewMemberImageFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const isNewMemberFormComplete = (): boolean => {
        return (
            newMemberName.trim() !== '' &&
            newMemberRole.trim() !== '' &&
            newMemberImage !== null &&
            newMemberImageFile !== null &&
            newMemberServiceId !== null
        )
    }

    const handleCreateMember = async () => {
        if (isCreatingMember || !isNewMemberFormComplete()) return
        if (!newMemberServiceId || !newMemberImageFile || !newMemberImage) {
            return
        }

        setIsCreatingMember(true)
        try {
            const resp = await apiCreateMemberAgency(
                {
                    name: newMemberName.trim(),
                    position: newMemberRole.trim(),
                    image: newMemberImageFile,
                },
                newMemberServiceId,
            )

            if (!resp?.success) {
                throw new Error(resp?.message || 'تعذر حفظ العضو')
            }

            const newMember: TeamMember = {
                id: resp.data.id,
                name: newMemberName.trim(),
                position: newMemberRole.trim(),
                image: newMemberImage,
            }

            addTeamMember(newMember)
        } catch (err: unknown) {
            const apiMessage = (() => {
                if (typeof err !== 'object' || err === null) return undefined
                const response = (err as { response?: unknown }).response
                if (typeof response !== 'object' || response === null)
                    return undefined
                const data = (response as { data?: unknown }).data
                if (typeof data !== 'object' || data === null) return undefined
                const message = (data as { message?: unknown }).message
                return typeof message === 'string' && message.trim()
                    ? message
                    : undefined
            })()

            const message = err instanceof Error ? err.message : undefined

            toast.push(
                <Notification type="danger">
                    {apiMessage || message || 'حدث خطأ أثناء إضافة العضو'}
                </Notification>,
            )
            return
        } finally {
            setIsCreatingMember(false)
        }

        setNewMemberName('')
        setNewMemberRole('')
        setNewMemberImage(null)
        setNewMemberImageFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setShowNewMemberForm(false)
    }

    useEffect(() => {
        if (services.length === 0) {
            setNewMemberServiceId(null)
            return
        }

        if (newMemberServiceId === null) {
            setNewMemberServiceId(services[0].id)
        }
    }, [services, newMemberServiceId])

    const serviceOptions: ServiceSelectOption[] = services.map((s) => ({
        value: s.id,
        label: s.serviceLabel,
    }))

    const memberOptions: MemberSelectOption[] = teamMembers.map((m) => ({
        value: m.id,
        label: m.name,
    }))

    const isAssignmentDuplicate = (): boolean => {
        if (!selectedServiceId || !selectedMemberId) return false
        return assignments.some(
            (a) =>
                a.serviceId === selectedServiceId &&
                a.memberId === selectedMemberId,
        )
    }

    const canAssign = (): boolean => {
        return (
            selectedServiceId !== null &&
            selectedMemberId !== null &&
            !isAssignmentDuplicate()
        )
    }

    const handleAssign = () => {
        if (!canAssign() || !selectedServiceId || !selectedMemberId) return

        const service = services.find((s) => s.id === selectedServiceId)
        const member = teamMembers.find((m) => m.id === selectedMemberId)

        if (!service || !member) return

        const newAssignment: ServiceAssignment = {
            id: Date.now(),
            serviceId: service.id,
            serviceLabel: service.serviceLabel,
            memberId: member.id,
            memberName: member.name,
            schedules: [],
        }

        addAssignment(newAssignment)
        setSelectedServiceId(null)
        setSelectedMemberId(null)
    }

    const canAddSchedule = (): boolean => {
        return (
            activeAssignmentId !== null &&
            scheduleDate !== '' &&
            scheduleStartTime !== '' &&
            scheduleEndTime !== '' &&
            scheduleStartTime < scheduleEndTime
        )
    }

    const handleAddSchedule = () => {
        if (!canAddSchedule() || !activeAssignmentId) return

        const dateLabel =
            DATES.find((d) => d.value === scheduleDate)?.label || ''

        const newSchedule: WorkScheduleEntry = {
            id: Date.now(),
            date: scheduleDate,
            dateLabel,
            startTime: scheduleStartTime,
            endTime: scheduleEndTime,
        }

        addScheduleToAssignment(activeAssignmentId, newSchedule)
        setScheduleDate('')
        setScheduleStartTime('')
        setScheduleEndTime('')
    }

    const allAssignmentsHaveSchedules = (): boolean => {
        return (
            assignments.length > 0 &&
            assignments.every((a) => a.schedules.length > 0)
        )
    }

    return (
        <Card
            header={{
                content: 'تعيين الخدمات للفريق',
                bordered: false,
            }}
        >
            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold">
                            أعضاء الفريق ({teamMembers.length})
                        </h3>
                        <Button
                            size="xs"
                            variant={showNewMemberForm ? 'default' : 'solid'}
                            onClick={() =>
                                setShowNewMemberForm(!showNewMemberForm)
                            }
                        >
                            {showNewMemberForm ? 'إلغاء' : '+ عضو جديد'}
                        </Button>
                    </div>

                    {showNewMemberForm && (
                        <Card className="mb-4">
                            <div className="space-y-3">
                                <FormItem label="Member service">
                                    <Select<ServiceSelectOption>
                                        size="sm"
                                        placeholder="Select a service"
                                        options={serviceOptions}
                                        value={
                                            serviceOptions.find(
                                                (opt) =>
                                                    opt.value ===
                                                    newMemberServiceId,
                                            ) || null
                                        }
                                        onChange={(opt) =>
                                            setNewMemberServiceId(
                                                opt?.value ?? null,
                                            )
                                        }
                                    />
                                </FormItem>
                                <FormItem label="صورة العضو">
                                    <div className="flex flex-col gap-3">
                                        {!newMemberImage ? (
                                            <div
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary-deep hover:bg-gray-50 transition-all"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-7 h-7 text-gray-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <span className="text-sm text-gray-500">
                                                    اضغط لإضافة صورة
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                                                    <img
                                                        src={newMemberImage}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        variant="default"
                                                        size="xs"
                                                        type="button"
                                                        onClick={() =>
                                                            fileInputRef.current?.click()
                                                        }
                                                    >
                                                        تغيير
                                                    </Button>
                                                    <Button
                                                        variant="solid"
                                                        size="xs"
                                                        type="button"
                                                        className="bg-red-300 hover:bg-red-400"
                                                        onClick={
                                                            handleRemoveImage
                                                        }
                                                    >
                                                        حذف
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </FormItem>

                                <FormItem label="اسم العضو">
                                    <Input
                                        value={newMemberName}
                                        onChange={(e) =>
                                            setNewMemberName(e.target.value)
                                        }
                                        placeholder="اسم العضو"
                                    />
                                </FormItem>

                                <FormItem label="التخصص / الدور">
                                    <Input
                                        value={newMemberRole}
                                        onChange={(e) =>
                                            setNewMemberRole(e.target.value)
                                        }
                                        placeholder="مثلاً: مختصة في العناية بالبشرة"
                                    />
                                </FormItem>

                                <Button
                                    variant="solid"
                                    size="sm"
                                    block
                                    loading={isCreatingMember}
                                    disabled={
                                        isCreatingMember ||
                                        !isNewMemberFormComplete()
                                    }
                                    onClick={handleCreateMember}
                                >
                                    إنشاء العضو
                                </Button>
                            </div>
                        </Card>
                    )}

                    {teamMembers.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {teamMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-2 border rounded-lg"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                        {member.image && (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate">
                                            {member.name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {member.position}
                                        </div>
                                    </div>
                                    <Button
                                        variant="plain"
                                        size="xs"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() =>
                                            removeTeamMember(member.id)
                                        }
                                    >
                                        حذف
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {teamMembers.length > 0 && services.length > 0 && (
                    <div>
                        <h3 className="text-base font-semibold mb-3">
                            تعيين خدمة لعضو
                        </h3>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-4">
                            اختر خدمة وعضوًا لتعيين الخدمة له، ثم حدد أوقات
                            العمل
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <FormItem label="الخدمة">
                                <Select
                                    placeholder="اختر الخدمة"
                                    options={serviceOptions}
                                    value={
                                        serviceOptions.find(
                                            (s) =>
                                                s.value === selectedServiceId,
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setSelectedServiceId(opt?.value ?? null)
                                    }
                                />
                            </FormItem>

                            <FormItem label="العضو">
                                <Select
                                    placeholder="اختر العضو"
                                    options={memberOptions}
                                    value={
                                        memberOptions.find(
                                            (m) => m.value === selectedMemberId,
                                        ) || null
                                    }
                                    onChange={(opt) =>
                                        setSelectedMemberId(opt?.value ?? null)
                                    }
                                />
                            </FormItem>
                        </div>

                        {isAssignmentDuplicate() && (
                            <div className="text-red-500 text-sm mb-3">
                                هذا التعيين موجود بالفعل
                            </div>
                        )}

                        <Button
                            variant="default"
                            size="sm"
                            block
                            disabled={!canAssign()}
                            onClick={handleAssign}
                        >
                            تعيين الخدمة للعضو
                        </Button>
                    </div>
                )}

                {assignments.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold">
                            التعيينات ({assignments.length})
                        </h3>

                        {assignments.map((assignment) => {
                            const isActive =
                                activeAssignmentId === assignment.id
                            const member = teamMembers.find(
                                (m) => m.id === assignment.memberId,
                            )

                            return (
                                <Card
                                    key={assignment.id}
                                    className={`border-2 transition-all ${
                                        isActive
                                            ? 'border-primary-deep'
                                            : 'border-transparent'
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                {member?.image && (
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                                        <img
                                                            src={member.image}
                                                            alt={member.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-primary-deep text-sm">
                                                        {assignment.memberName}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        {
                                                            assignment.serviceLabel
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant={
                                                        isActive
                                                            ? 'solid'
                                                            : 'default'
                                                    }
                                                    size="xs"
                                                    onClick={() =>
                                                        setActiveAssignmentId(
                                                            isActive
                                                                ? null
                                                                : assignment.id,
                                                        )
                                                    }
                                                >
                                                    {isActive
                                                        ? 'إغلاق'
                                                        : 'أوقات العمل'}
                                                </Button>
                                                <Button
                                                    variant="solid"
                                                    size="xs"
                                                    className="bg-red-300 hover:bg-red-400"
                                                    onClick={() =>
                                                        removeAssignment(
                                                            assignment.id,
                                                        )
                                                    }
                                                >
                                                    حذف
                                                </Button>
                                            </div>
                                        </div>

                                        {assignment.schedules.length > 0 && (
                                            <div className="space-y-1">
                                                {assignment.schedules.map(
                                                    (sch) => (
                                                        <div
                                                            key={sch.id}
                                                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="w-4 h-4 text-gray-400"
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
                                                                <span className="font-medium">
                                                                    {
                                                                        sch.dateLabel
                                                                    }
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    {
                                                                        sch.startTime
                                                                    }{' '}
                                                                    -{' '}
                                                                    {
                                                                        sch.endTime
                                                                    }
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="plain"
                                                                size="xs"
                                                                className="text-red-500 hover:text-red-700"
                                                                onClick={() =>
                                                                    removeScheduleFromAssignment(
                                                                        assignment.id,
                                                                        sch.id,
                                                                    )
                                                                }
                                                            >
                                                                ✕
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {assignment.schedules.length === 0 && (
                                            <div className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2">
                                                ⚠ لم يتم تحديد أوقات عمل بعد
                                            </div>
                                        )}

                                        {isActive && (
                                            <div className="border-t pt-3 space-y-3">
                                                <div className="text-sm font-medium text-gray-700">
                                                    إضافة وقت عمل
                                                </div>

                                                <FormItem label="التاريخ">
                                                    <Select
                                                        placeholder="اختر التاريخ"
                                                        options={DATES}
                                                        value={
                                                            DATES.find(
                                                                (d) =>
                                                                    d.value ===
                                                                    scheduleDate,
                                                            ) || null
                                                        }
                                                        onChange={(val) =>
                                                            setScheduleDate(
                                                                val?.value ??
                                                                    '',
                                                            )
                                                        }
                                                    />
                                                </FormItem>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <FormItem label="من الساعة">
                                                        <Select
                                                            placeholder="--:--"
                                                            options={TIME_OPTIONS}
                                                            value={
                                                                (
                                                                    TIME_OPTIONS
                                                                ).find(
                                                                    (t) =>
                                                                        t.value ===
                                                                        scheduleStartTime,
                                                                ) || null
                                                            }
                                                            onChange={(val) =>
                                                                setScheduleStartTime(
                                                                    val?.value ??
                                                                        '',
                                                                )
                                                            }
                                                        />
                                                    </FormItem>

                                                    <FormItem label="إلى الساعة">
                                                        <Select
                                                            placeholder="--:--"
                                                            options={TIME_OPTIONS}
                                                            value={
                                                                (
                                                                    TIME_OPTIONS
                                                                ).find(
                                                                    (t) =>
                                                                        t.value ===
                                                                        scheduleEndTime,
                                                                ) || null
                                                            }
                                                            onChange={(val) =>
                                                                setScheduleEndTime(
                                                                    val?.value ??
                                                                        '',
                                                                )
                                                            }
                                                        />
                                                    </FormItem>
                                                </div>

                                                {scheduleStartTime &&
                                                    scheduleEndTime &&
                                                    scheduleStartTime >=
                                                        scheduleEndTime && (
                                                        <div className="text-red-500 text-xs">
                                                            وقت البداية يجب أن
                                                            يكون قبل وقت النهاية
                                                        </div>
                                                    )}

                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    block
                                                    disabled={!canAddSchedule()}
                                                    onClick={handleAddSchedule}
                                                >
                                                    إضافة وقت عمل
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {teamMembers.length === 0 && !showNewMemberForm && (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-lg mb-2">لا يوجد أعضاء بعد</div>
                        <div className="text-sm">
                            أنشئ عضوًا جديدًا للبدء في تعيين الخدمات
                        </div>
                    </div>
                )}

                <div className="border-t pt-4">
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => changeState(2)}
                        >
                            خلف
                        </Button>
                        {allAssignmentsHaveSchedules() && (
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={() => changeState(4)}
                            >
                                التالي: المراجعة والتسجيل
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    )
}
