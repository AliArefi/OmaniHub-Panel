import { useState } from 'react'
import { useCreateStore, type DaySchedule } from '@/context/createStoreContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi'
import Switcher from '@/components/ui/Switcher'
import {
    apiCreateMemberAgency,
    apiDeleteServiceMember,
    apiMemberWorkingHours,
    apiUpdateServiceMember,
} from '@/services/CenterService'

type SelectOption = { value: number; label: string }

const WEEK_DAYS: DaySchedule[] = [
    { day: 'saturday', dayLabel: 'السبت', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'sunday', dayLabel: 'الأحد', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'monday', dayLabel: 'الاثنين', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'tuesday', dayLabel: 'الثلاثاء', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'wednesday', dayLabel: 'الأربعاء', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'thursday', dayLabel: 'الخميس', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'friday', dayLabel: 'الجمعة', isOpen: false, startTime: '09:00', endTime: '17:00' },
]

const generateTimeOptions = () => {
    const options: { value: string; label: string }[] = []
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0')
            const minute = m.toString().padStart(2, '0')
            options.push({ value: `${hour}:${minute}`, label: `${hour}:${minute}` })
        }
    }
    return options
}

export const HojraAssignServices = ({ changeState }: { changeState: (step: number) => void }) => {
    const {
        services,
        teamMembers,
        assignments,
        setTeamMembers,
        setAssignments,
        addTeamMember,
        removeTeamMember,
        addAssignment,
        removeAssignment,
        updateAssignmentSchedule,
    } = useCreateStore()

    const [showNewMemberForm, setShowNewMemberForm] = useState(false)
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberPosition, setNewMemberPosition] = useState('')
    const [newMemberImageFile, setNewMemberImageFile] = useState<File | null>(null)
    const [newMemberImagePreview, setNewMemberImagePreview] = useState<string | null>(null)
    const [newMemberServiceId, setNewMemberServiceId] = useState<number | null>(null)
    const [isCreatingMember, setIsCreatingMember] = useState(false)

    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
    const [editingScheduleForAssignment, setEditingScheduleForAssignment] = useState<number | null>(null)
    const [isSavingSchedules, setIsSavingSchedules] = useState(false)
    const [isDeletingMemberId, setIsDeletingMemberId] = useState<number | null>(null)

    const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
    const [editMemberName, setEditMemberName] = useState('')
    const [editMemberPosition, setEditMemberPosition] = useState('')
    const [editMemberImageFile, setEditMemberImageFile] = useState<File | null>(null)
    const [editMemberImagePreview, setEditMemberImagePreview] = useState<string | null>(null)
    const [isUpdatingMember, setIsUpdatingMember] = useState(false)

    const getMemberAgencyServiceId = (memberId: number): number | null => {
        const assignment = assignments.find((a) => a.memberId === memberId)
        return assignment ? assignment.serviceId : null
    }

    const handleDeleteMember = async (memberId: number) => {
        const agencyServiceId = getMemberAgencyServiceId(memberId)
        if (!agencyServiceId) {
            removeTeamMember(memberId)
            return
        }

        setIsDeletingMemberId(memberId)
        try {
            await apiDeleteServiceMember(agencyServiceId, memberId)
            removeTeamMember(memberId)
            toast.push(
                <Notification type="success" title="ظ†ط¬ط§ط­">
                    طھظ… ط­ط°ظپ ط¹ط¶ظˆ ط§ظ„ظپط±ظٹظ‚
                </Notification>,
            )
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : null
            toast.push(
                <Notification type="danger" title="خطأ">
                    {message || 'فشل حذف العضو'}
                </Notification>,
            )
        } finally {
            setIsDeletingMemberId(null)
        }
    }

    const beginEditMember = (memberId: number) => {
        const member = teamMembers.find((m) => m.id === memberId)
        if (!member) return

        setEditingMemberId(memberId)
        setEditMemberName(member.name ?? '')
        setEditMemberPosition(member.position ?? '')
        setEditMemberImageFile(null)
        setEditMemberImagePreview(member.image ?? null)
    }

    const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setEditMemberImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setEditMemberImagePreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const saveMemberEdits = async () => {
        if (!editingMemberId) return
        const agencyServiceId = getMemberAgencyServiceId(editingMemberId)
        if (!agencyServiceId) return

        const payload: { name?: string; position?: string; image?: File } = {}
        if (editMemberName.trim()) payload.name = editMemberName.trim()
        payload.position = editMemberPosition
        if (editMemberImageFile) payload.image = editMemberImageFile

        setIsUpdatingMember(true)
        try {
            await apiUpdateServiceMember(agencyServiceId, editingMemberId, payload)

            setTeamMembers((prev) =>
                prev.map((m) =>
                    m.id === editingMemberId
                        ? {
                              ...m,
                              name: payload.name ?? m.name,
                              position:
                                  typeof payload.position === 'string'
                                      ? payload.position
                                      : m.position,
                              image: editMemberImagePreview ?? m.image,
                          }
                        : m,
                ),
            )

            setAssignments((prev) =>
                prev.map((a) =>
                    a.memberId === editingMemberId
                        ? { ...a, memberName: payload.name ?? a.memberName }
                        : a,
                ),
            )

            toast.push(
                <Notification type="success" title="نجاح">
                    تم تحديث العضو بنجاح
                </Notification>,
            )
            setEditingMemberId(null)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : null
            toast.push(
                <Notification type="danger" title="خطأ">
                    {message || 'فشل تحديث العضو'}
                </Notification>,
            )
        } finally {
            setIsUpdatingMember(false)
        }
    }

    const timeOptions = generateTimeOptions()

    const serviceOptions: SelectOption[] = services.map((s) => ({
        value: s.id,
        label: s.serviceLabel,
    }))

    const memberOptions: SelectOption[] = teamMembers.map((m) => ({
        value: m.id,
        label: m.name,
    }))

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setNewMemberImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setNewMemberImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleCreateMember = async () => {
        if (!newMemberName.trim()) {
            toast.push(
                <Notification type="warning" title="تحذير">
                    الرجاء إدخال اسم العضو
                </Notification>,
            )
            return
        }

        if (!newMemberServiceId) {
            toast.push(
                <Notification type="warning" title="تحذير">
                    الرجاء اختيار الخدمة
                </Notification>,
            )
            return
        }

        if (!newMemberImageFile) {
            toast.push(
                <Notification type="warning" title="تحذير">
                    الرجاء اختيار صورة للعضو
                </Notification>,
            )
            return
        }

        setIsCreatingMember(true)

        try {
            const response = await apiCreateMemberAgency(
                {
                    name: newMemberName.trim(),
                    position: newMemberPosition,
                    image: newMemberImageFile,
                },
                newMemberServiceId,
            )

            if (response.data) {
                const newMember = {
                    id: response.data.id,
                    name: newMemberName,
                    position: newMemberPosition || 'عضو الفريق',
                    image: newMemberImagePreview,
                }

                addTeamMember(newMember)

                const selectedService = services.find((s) => s.id === newMemberServiceId)
                if (selectedService) {
                    addAssignment({
                        id: Date.now(),
                        serviceId: selectedService.id,
                        serviceLabel: selectedService.serviceLabel,
                        memberId: newMember.id,
                        memberName: newMember.name,
                        weeklySchedule: [...WEEK_DAYS],
                    })
                }

                setNewMemberName('')
                setNewMemberPosition('')
                setNewMemberImageFile(null)
                setNewMemberImagePreview(null)
                setNewMemberServiceId(null)
                setShowNewMemberForm(false)

                toast.push(
                    <Notification type="success" title="نجاح">
                        تمت إضافة العضو الجديد بنجاح
                    </Notification>,
                )
            }
        } catch (error: any) {
            toast.push(
                <Notification type="danger" title="خطأ">
                    {error?.response?.data?.message || 'حدث خطأ أثناء إنشاء العضو'}
                </Notification>,
            )
        } finally {
            setIsCreatingMember(false)
        }
    }

    const handleAssignService = () => {
        if (!selectedMemberId || !selectedServiceId) {
            toast.push(
                <Notification type="warning" title="تحذير">
                    الرجاء اختيار العضو والخدمة
                </Notification>,
            )
            return
        }

        const alreadyAssigned = assignments.some(
            (a) => a.memberId === selectedMemberId && a.serviceId === selectedServiceId,
        )

        if (alreadyAssigned) {
            toast.push(
                <Notification type="warning" title="تحذير">
                    هذه الخدمة مخصصة بالفعل لهذا العضو
                </Notification>,
            )
            return
        }

        const member = teamMembers.find((m) => m.id === selectedMemberId)
        const service = services.find((s) => s.id === selectedServiceId)

        if (member && service) {
            addAssignment({
                id: Date.now(),
                serviceId: service.id,
                serviceLabel: service.serviceLabel,
                memberId: member.id,
                memberName: member.name,
                weeklySchedule: [...WEEK_DAYS],
            })
            setSelectedMemberId(null)
            setSelectedServiceId(null)

            toast.push(
                <Notification type="success" title="نجاح">
                    تم تخصيص الخدمة بنجاح
                </Notification>,
            )
        }
    }

    const handleScheduleChange = (
        assignmentId: number,
        dayIndex: number,
        field: 'isOpen' | 'startTime' | 'endTime',
        value: boolean | string,
    ) => {
        const assignment = assignments.find((a) => a.id === assignmentId)
        if (!assignment) return

        const updatedSchedule = [...assignment.weeklySchedule]
        updatedSchedule[dayIndex] = { ...updatedSchedule[dayIndex], [field]: value }

        updateAssignmentSchedule(assignmentId, updatedSchedule)
    }

    const dayOfWeekFromKey = (day: DaySchedule['day']): number => {
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

    const mergeMemberSchedules = (): Map<number, DaySchedule[]> => {
        const byMember = new Map<number, DaySchedule[]>()

        for (const assignment of assignments) {
            const current = byMember.get(assignment.memberId) ?? [...WEEK_DAYS]
            const next = current.map((d) => ({ ...d }))
            const incoming = assignment.weeklySchedule ?? []

            for (const inc of incoming) {
                const idx = next.findIndex((d) => d.day === inc.day)
                if (idx === -1) continue
                if (!inc.isOpen) continue

                const existing = next[idx]
                next[idx] = {
                    ...existing,
                    isOpen: true,
                    startTime: existing.isOpen
                        ? inc.startTime < existing.startTime
                            ? inc.startTime
                            : existing.startTime
                        : inc.startTime,
                    endTime: existing.isOpen
                        ? inc.endTime > existing.endTime
                            ? inc.endTime
                            : existing.endTime
                        : inc.endTime,
                }
            }

            byMember.set(assignment.memberId, next)
        }

        return byMember
    }

    const persistSchedules = async () => {
        const schedulesByMember = mergeMemberSchedules()

        const requests = Array.from(schedulesByMember.entries()).map(
            async ([memberId, weeklySchedule]) => {
                const days = weeklySchedule.map((d) => {
                    if (!d.isOpen) {
                        return {
                            day_of_week: dayOfWeekFromKey(d.day),
                            is_closed: true,
                            slots: [],
                        }
                    }

                    return {
                        day_of_week: dayOfWeekFromKey(d.day),
                        is_closed: false,
                        slots: [
                            {
                                start: d.startTime,
                                end: d.endTime,
                                is_active: true,
                            },
                        ],
                    }
                })

                await apiMemberWorkingHours({ days }, memberId)
            },
        )

        await Promise.all(requests)
    }

    const hasAnySchedule = assignments.some((a) => a.weeklySchedule.some((day) => day.isOpen))

    const handleNext = async () => {
        if (!hasAnySchedule) {
            changeState(6)
        } else {
            toast.push(
                <Notification type="warning" title="تحذير">
                    الرجاء تحديد جدول زمني واحد على الأقل
                </Notification>,
            )
        }
    }

    const handleNextFixed = async () => {
        if (!hasAnySchedule) {
            toast.push(
                <Notification type="warning" title="طھط­ط°ظٹط±">
                    ط§ظ„ط±ط¬ط§ط، طھط­ط¯ظٹط¯ ط¬ط¯ظˆظ„ ط²ظ…ظ†ظٹ ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„
                </Notification>,
            )
            return
        }

        setIsSavingSchedules(true)
        try {
            await persistSchedules()
            toast.push(
                <Notification type="success" title="ظ†ط¬ط§ط­">
                    طھظ… ط­ظپط¸ ط¬ط¯ظˆظ„ ط§ظ„ط¹ظ…ظ„ ط¨ظ†ط¬ط§ط­
                </Notification>,
            )
            changeState(6)
        } catch (err: unknown) {
            const message = (() => {
                if (err instanceof Error && err.message.trim()) return err.message
                if (typeof err !== 'object' || err === null) return null
                const response = (err as { response?: unknown }).response
                if (typeof response !== 'object' || response === null) return null
                const data = (response as { data?: unknown }).data
                if (typeof data !== 'object' || data === null) return null
                const apiMessage = (data as { message?: unknown }).message
                return typeof apiMessage === 'string' && apiMessage.trim()
                    ? apiMessage
                    : null
            })()

            toast.push(
                <Notification type="danger" title="خطأ">
                    {message || 'فشل حفظ جدول العمل'}
                </Notification>,
            )
        } finally {
            setIsSavingSchedules(false)
        }
    }

    const handleNextSafe = async () => {
        if (!hasAnySchedule) {
            toast.push(
                <Notification type="warning" title="تحذير">
                    الرجاء تحديد جدول زمني واحد على الأقل
                </Notification>,
            )
            return
        }

        setIsSavingSchedules(true)
        try {
            await persistSchedules()
            toast.push(
                <Notification type="success" title="نجاح">
                    تم حفظ جدول العمل بنجاح
                </Notification>,
            )
            changeState(6)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : null
            toast.push(
                <Notification type="danger" title="خطأ">
                    {message || 'فشل حفظ جدول العمل'}
                </Notification>,
            )
        } finally {
            setIsSavingSchedules(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4">إدارة أعضاء الفريق</h3>

                {!showNewMemberForm && (
                    <Button
                        variant="solid"
                        icon={<HiOutlinePlus />}
                        onClick={() => setShowNewMemberForm(true)}
                    >
                        إضافة عضو جديد
                    </Button>
                )}

                {showNewMemberForm && (
                    <div className="mt-4 p-4 border rounded-lg space-y-4">
                        <FormItem label="اسم العضو">
                            <Input
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                placeholder="أدخل اسم العضو"
                            />
                        </FormItem>

                        <FormItem label="المنصب">
                            <Input
                                value={newMemberPosition}
                                onChange={(e) => setNewMemberPosition(e.target.value)}
                                placeholder="أدخل منصب العضو"
                            />
                        </FormItem>

                        <FormItem label="الصورة">
                            <Input type="file" accept="image/*" onChange={handleImageUpload} />
                            {newMemberImagePreview && (
                                <img
                                    src={newMemberImagePreview}
                                    alt="معاينة"
                                    className="mt-2 w-20 h-20 object-cover rounded"
                                />
                            )}
                        </FormItem>

                        <FormItem label="الخدمة">
                            <Select<SelectOption>
                                value={
                                    newMemberServiceId
                                        ? serviceOptions.find((s) => s.value === newMemberServiceId) ?? null
                                        : null
                                }
                                options={serviceOptions}
                                onChange={(option) => setNewMemberServiceId(option?.value ?? null)}
                                placeholder="اختر الخدمة"
                            />
                        </FormItem>

                        <div className="flex gap-2">
                            <Button variant="solid" onClick={handleCreateMember} loading={isCreatingMember}>
                                حفظ العضو
                            </Button>
                            <Button
                                variant="plain"
                                onClick={() => {
                                    setShowNewMemberForm(false)
                                    setNewMemberName('')
                                    setNewMemberPosition('')
                                    setNewMemberImageFile(null)
                                    setNewMemberImagePreview(null)
                                    setNewMemberServiceId(null)
                                }}
                            >
                                إلغاء
                            </Button>
                        </div>
                    </div>
                )}

                {teamMembers.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h4 className="font-medium">أعضاء الفريق:</h4>
                        {teamMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 border rounded"
                            >
                                <div className="flex items-center gap-3">
                                    {member.image && (
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-sm text-gray-500">{member.position}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        icon={<HiOutlinePencil />}
                                        onClick={() => beginEditMember(member.id)}
                                        disabled={isDeletingMemberId === member.id}
                                    />
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        icon={<HiOutlineTrash />}
                                        loading={isDeletingMemberId === member.id}
                                        onClick={() => handleDeleteMember(member.id)}
                                        disabled={isUpdatingMember && editingMemberId === member.id}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {editingMemberId && (
                    <div className="mt-6 p-4 border rounded-lg space-y-4">
                        <h4 className="font-medium">تعديل العضو</h4>
                        <FormItem label="اسم العضو">
                            <Input
                                value={editMemberName}
                                onChange={(e) => setEditMemberName(e.target.value)}
                            />
                        </FormItem>
                        <FormItem label="المنصب">
                            <Input
                                value={editMemberPosition}
                                onChange={(e) => setEditMemberPosition(e.target.value)}
                            />
                        </FormItem>
                        <FormItem label="الصورة">
                            <Input type="file" accept="image/*" onChange={handleEditImageUpload} />
                            {editMemberImagePreview && (
                                <img
                                    src={editMemberImagePreview}
                                    alt="معاينة"
                                    className="mt-2 w-20 h-20 object-cover rounded"
                                />
                            )}
                        </FormItem>
                        <div className="flex gap-2">
                            <Button variant="solid" onClick={saveMemberEdits} loading={isUpdatingMember}>
                                حفظ التعديلات
                            </Button>
                            <Button
                                variant="plain"
                                onClick={() => {
                                    setEditingMemberId(null)
                                    setEditMemberName('')
                                    setEditMemberPosition('')
                                    setEditMemberImageFile(null)
                                    setEditMemberImagePreview(null)
                                }}
                                disabled={isUpdatingMember}
                            >
                                إلغاء
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {teamMembers.length > 0 && services.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">تخصيص الخدمة للأعضاء</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormItem label="اختيار العضو">
                            <Select<SelectOption>
                                value={
                                    selectedMemberId
                                        ? memberOptions.find((m) => m.value === selectedMemberId) ?? null
                                        : null
                                }
                                options={memberOptions}
                                onChange={(option) => setSelectedMemberId(option?.value ?? null)}
                                placeholder="اختر العضو"
                            />
                        </FormItem>

                        <FormItem label="اختيار الخدمة">
                            <Select<SelectOption>
                                value={
                                    selectedServiceId
                                        ? serviceOptions.find((s) => s.value === selectedServiceId) ?? null
                                        : null
                                }
                                options={serviceOptions}
                                onChange={(option) => setSelectedServiceId(option?.value ?? null)}
                                placeholder="اختر الخدمة"
                            />
                        </FormItem>
                    </div>

                    <Button variant="solid" onClick={handleAssignService}>
                        تخصيص الخدمة
                    </Button>

                    {assignments.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <h4 className="font-medium">الخدمات المخصصة:</h4>
                            {assignments.map((assignment) => (
                                <div key={assignment.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="font-medium">{assignment.memberName}</div>
                                            <div className="text-sm text-gray-500">
                                                {assignment.serviceLabel}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                onClick={() =>
                                                    setEditingScheduleForAssignment(
                                                        editingScheduleForAssignment === assignment.id
                                                            ? null
                                                            : assignment.id,
                                                    )
                                                }
                                            >
                                                {editingScheduleForAssignment === assignment.id
                                                    ? 'إغلاق الجدول'
                                                    : 'ضبط الجدول'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                icon={<HiOutlineTrash />}
                                                onClick={() => handleDeleteMember(assignment.memberId)}
                                            />
                                        </div>
                                    </div>

                                    {editingScheduleForAssignment === assignment.id && (
                                        <div className="space-y-3 mt-4 pt-4 border-t">
                                            <h5 className="font-medium text-sm mb-3">الجدول الأسبوعي:</h5>
                                            {assignment.weeklySchedule.map((daySchedule, dayIndex) => (
                                                <div
                                                    key={daySchedule.day}
                                                    className="flex items-center gap-4 p-3 bg-gray-50 rounded"
                                                >
                                                    <div className="w-24 font-medium">
                                                        {daySchedule.dayLabel}
                                                    </div>
                                                    <Switcher
                                                        checked={daySchedule.isOpen}
                                                        onChange={(checked) =>
                                                            handleScheduleChange(
                                                                assignment.id,
                                                                dayIndex,
                                                                'isOpen',
                                                                checked,
                                                            )
                                                        }
                                                    />
                                                    {daySchedule.isOpen && (
                                                        <>
                                                            <Select<{ value: string; label: string }>
                                                                size="sm"
                                                                className="w-32"
                                                                value={
                                                                    timeOptions.find(
                                                                        (t) => t.value === daySchedule.startTime,
                                                                    ) ?? null
                                                                }
                                                                options={timeOptions}
                                                                onChange={(option) =>
                                                                    handleScheduleChange(
                                                                        assignment.id,
                                                                        dayIndex,
                                                                        'startTime',
                                                                        option?.value ?? '09:00',
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-gray-500">إلى</span>
                                                            <Select<{ value: string; label: string }>
                                                                size="sm"
                                                                className="w-32"
                                                                value={
                                                                    timeOptions.find(
                                                                        (t) => t.value === daySchedule.endTime,
                                                                    ) ?? null
                                                                }
                                                                options={timeOptions}
                                                                onChange={(option) =>
                                                                    handleScheduleChange(
                                                                        assignment.id,
                                                                        dayIndex,
                                                                        'endTime',
                                                                        option?.value ?? '17:00',
                                                                    )
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            <div className="flex justify-between">
                <Button variant="plain" onClick={() => changeState(4)}>
                    رجوع
                </Button>
                <Button variant="solid" onClick={handleNextSafe} loading={isSavingSchedules}>
                    المرحلة التالية
                </Button>
            </div>
        </div>
    )
}
