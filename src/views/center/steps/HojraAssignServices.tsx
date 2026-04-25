import { useMemo, useState } from 'react'
import { useCreateStore, type DaySchedule } from '@/context/createStoreContext'
import { useTranslation } from 'react-i18next'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import Switcher from '@/components/ui/Switcher'
import {
    apiCreateMemberAgency,
    apiDeleteServiceMember,
    apiMemberWorkingHours,
    apiUpdateServiceMember,
} from '@/services/CenterService'

type SelectOption = { value: number; label: string }

const DEFAULT_WEEK_DAYS: DaySchedule[] = [
    { day: 'saturday', dayLabel: 'Saturday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'sunday', dayLabel: 'Sunday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'monday', dayLabel: 'Monday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'tuesday', dayLabel: 'Tuesday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'wednesday', dayLabel: 'Wednesday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'thursday', dayLabel: 'Thursday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { day: 'friday', dayLabel: 'Friday', isOpen: false, startTime: '09:00', endTime: '17:00' },
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

export const HojraAssignServices = ({ changeState }: { changeState: (step: number) => void }) => {
    const { t } = useTranslation()
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

    const timeOptions = useMemo(() => generateTimeOptions(), [])

    const serviceOptions: SelectOption[] = services.map((s) => ({
        value: s.id,
        label: s.serviceLabel,
    }))

    const memberOptions: SelectOption[] = teamMembers.map((m) => ({
        value: m.id,
        label: m.name,
    }))

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setNewMemberImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setNewMemberImagePreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setEditMemberImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setEditMemberImagePreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleCreateMember = async () => {
        if (!newMemberName.trim()) {
            toast.push(<Notification type="warning">{t('center.validation.enterMemberName')}</Notification>)
            return
        }
        if (!newMemberServiceId) {
            toast.push(<Notification type="warning">{t('center.validation.selectService')}</Notification>)
            return
        }
        if (!newMemberImageFile) {
            toast.push(<Notification type="warning">{t('center.validation.selectImage')}</Notification>)
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

            if (!response?.data?.id) {
                throw new Error(t('center.errors.createMemberFailed'))
            }

            const createdMember = {
                id: response.data.id,
                name: newMemberName.trim(),
                position: newMemberPosition || 'Team Member',
                image: newMemberImagePreview,
            }

            addTeamMember(createdMember)

            const selectedService = services.find((s) => s.id === newMemberServiceId)
            if (selectedService) {
                addAssignment({
                    id: Date.now(),
                    serviceId: selectedService.id,
                    serviceLabel: selectedService.serviceLabel,
                    memberId: createdMember.id,
                    memberName: createdMember.name,
                    weeklySchedule: DEFAULT_WEEK_DAYS.map((d) => ({ ...d })),
                })
            }

            setNewMemberName('')
            setNewMemberPosition('')
            setNewMemberImageFile(null)
            setNewMemberImagePreview(null)
            setNewMemberServiceId(null)
            setShowNewMemberForm(false)

            toast.push(<Notification type="success">{t('center.success.memberCreated')}</Notification>)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('center.errors.createMemberFailed')
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setIsCreatingMember(false)
        }
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
            toast.push(<Notification type="success">{t('center.success.memberDeleted')}</Notification>)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('center.errors.deleteMemberFailed')
            toast.push(<Notification type="danger">{message}</Notification>)
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

    const saveMemberEdits = async () => {
        if (!editingMemberId) return
        const agencyServiceId = getMemberAgencyServiceId(editingMemberId)
        if (!agencyServiceId) return

        if (!editMemberName.trim()) {
            toast.push(<Notification type="warning">{t('center.validation.memberNameRequired')}</Notification>)
            return
        }

        const payload: { name?: string; position?: string; image?: File } = {
            name: editMemberName.trim(),
            position: editMemberPosition,
        }
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
                              position: payload.position ?? m.position,
                              image: editMemberImagePreview ?? m.image,
                          }
                        : m,
                ),
            )

            setAssignments((prev) =>
                prev.map((a) =>
                    a.memberId === editingMemberId ? { ...a, memberName: payload.name ?? a.memberName } : a,
                ),
            )

            toast.push(<Notification type="success">Member updated.</Notification>)
            setEditingMemberId(null)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('center.errors.updateMemberFailed')
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setIsUpdatingMember(false)
        }
    }

    const handleAssignService = () => {
        if (!selectedMemberId || !selectedServiceId) {
            toast.push(<Notification type="warning">{t('center.validation.selectMemberAndService')}</Notification>)
            return
        }

        const alreadyAssigned = assignments.some(
            (a) => a.memberId === selectedMemberId && a.serviceId === selectedServiceId,
        )
        if (alreadyAssigned) {
            toast.push(<Notification type="warning">{t('center.validation.alreadyAssigned')}</Notification>)
            return
        }

        const member = teamMembers.find((m) => m.id === selectedMemberId)
        const service = services.find((s) => s.id === selectedServiceId)
        if (!member || !service) return

        addAssignment({
            id: Date.now(),
            serviceId: service.id,
            serviceLabel: service.serviceLabel,
            memberId: member.id,
            memberName: member.name,
            weeklySchedule: DEFAULT_WEEK_DAYS.map((d) => ({ ...d })),
        })

        setSelectedMemberId(null)
        setSelectedServiceId(null)
        toast.push(<Notification type="success">{t('center.success.serviceAssigned')}</Notification>)
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

    const mergeMemberSchedules = (): Map<number, DaySchedule[]> => {
        const byMember = new Map<number, DaySchedule[]>()

        for (const assignment of assignments) {
            const current = byMember.get(assignment.memberId) ?? DEFAULT_WEEK_DAYS.map((d) => ({ ...d }))
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
                    startTime: existing.isOpen ? (inc.startTime < existing.startTime ? inc.startTime : existing.startTime) : inc.startTime,
                    endTime: existing.isOpen ? (inc.endTime > existing.endTime ? inc.endTime : existing.endTime) : inc.endTime,
                }
            }

            byMember.set(assignment.memberId, next)
        }

        return byMember
    }

    const persistSchedules = async () => {
        const schedulesByMember = mergeMemberSchedules()
        const requests = Array.from(schedulesByMember.entries()).map(async ([memberId, weeklySchedule]) => {
            const days = weeklySchedule.map((d) => {
                if (!d.isOpen) {
                    return { day_of_week: dayOfWeekFromKey(d.day), is_closed: true, slots: [] }
                }

                return {
                    day_of_week: dayOfWeekFromKey(d.day),
                    is_closed: false,
                    slots: [{ start: d.startTime, end: d.endTime, is_active: true }],
                }
            })
            await apiMemberWorkingHours({ days }, memberId)
        })

        await Promise.all(requests)
    }

    const hasAnySchedule = assignments.some((a) => a.weeklySchedule.some((day) => day.isOpen))

    const handleNext = async () => {
        if (!hasAnySchedule) {
            toast.push(<Notification type="warning">{t('center.validation.enableWorkingDay')}</Notification>)
            return
        }

        setIsSavingSchedules(true)
        try {
            await persistSchedules()
            toast.push(<Notification type="success">{t('center.success.schedulesSaved')}</Notification>)
            changeState(6)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('center.errors.saveSchedulesFailed')
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setIsSavingSchedules(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4">{t('center.members.title')}</h3>

                {!showNewMemberForm && (
                    <Button variant="solid" icon={<HiOutlinePlus />} onClick={() => setShowNewMemberForm(true)}>
                        {t('center.members.add')}
                    </Button>
                )}

                {showNewMemberForm && (
                    <div className="mt-4 p-4 border rounded-lg space-y-4">
                        <FormItem label={t('center.members.name')}>
                            <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.position')}>
                            <Input value={newMemberPosition} onChange={(e) => setNewMemberPosition(e.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.image')}>
                            <Input type="file" accept="image/*" onChange={handleImageUpload} />
                            {newMemberImagePreview && (
                                <img src={newMemberImagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
                            )}
                        </FormItem>

                        <FormItem label={t('center.members.service')}>
                            <Select<SelectOption>
                                value={newMemberServiceId ? serviceOptions.find((s) => s.value === newMemberServiceId) ?? null : null}
                                options={serviceOptions}
                                onChange={(option) => setNewMemberServiceId(option?.value ?? null)}
                                placeholder={t('center.members.service')}
                            />
                        </FormItem>

                        <div className="flex gap-2">
                            <Button variant="solid" onClick={handleCreateMember} loading={isCreatingMember}>
                                {t('center.members.save')}
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
                                {t('center.members.cancel')}
                            </Button>
                        </div>
                    </div>
                )}

                {teamMembers.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h4 className="font-medium">{t('center.members.title')}</h4>
                        {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                                <div className="flex items-center gap-3">
                                    {member.image && (
                                        <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                    )}
                                    <div>
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-sm text-gray-500">{member.position}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="plain" icon={<HiOutlinePencil />} onClick={() => beginEditMember(member.id)} />
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        icon={<HiOutlineTrash />}
                                        loading={isDeletingMemberId === member.id}
                                        onClick={() => handleDeleteMember(member.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {editingMemberId && (
                    <div className="mt-6 p-4 border rounded-lg space-y-4">
                        <h4 className="font-medium">{t('center.members.editTitle')}</h4>

                        <FormItem label={t('center.members.name')}>
                            <Input value={editMemberName} onChange={(e) => setEditMemberName(e.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.position')}>
                            <Input value={editMemberPosition} onChange={(e) => setEditMemberPosition(e.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.image')}>
                            <Input type="file" accept="image/*" onChange={handleEditImageUpload} />
                            {editMemberImagePreview && (
                                <img src={editMemberImagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
                            )}
                        </FormItem>

                        <div className="flex gap-2">
                            <Button variant="solid" onClick={saveMemberEdits} loading={isUpdatingMember}>
                                {t('center.members.saveChanges')}
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
                                {t('center.members.cancel')}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {teamMembers.length > 0 && services.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">{t('center.assignments.title')}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormItem label={t('center.assignments.member')}>
                            <Select<SelectOption>
                                value={selectedMemberId ? memberOptions.find((m) => m.value === selectedMemberId) ?? null : null}
                                options={memberOptions}
                                onChange={(option) => setSelectedMemberId(option?.value ?? null)}
                                placeholder={t('center.assignments.member')}
                            />
                        </FormItem>

                        <FormItem label={t('center.assignments.service')}>
                            <Select<SelectOption>
                                value={selectedServiceId ? serviceOptions.find((s) => s.value === selectedServiceId) ?? null : null}
                                options={serviceOptions}
                                onChange={(option) => setSelectedServiceId(option?.value ?? null)}
                                placeholder={t('center.assignments.service')}
                            />
                        </FormItem>
                    </div>

                    <Button variant="solid" onClick={handleAssignService}>
                        {t('center.assignments.assign')}
                    </Button>

                    {assignments.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <h4 className="font-medium">{t('center.assignments.listTitle')}</h4>
                            {assignments.map((assignment) => (
                                <div key={assignment.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="font-medium">{assignment.memberName}</div>
                                            <div className="text-sm text-gray-500">{assignment.serviceLabel}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="solid"
                                                onClick={() =>
                                                    setEditingScheduleForAssignment(
                                                        editingScheduleForAssignment === assignment.id ? null : assignment.id,
                                                    )
                                                }
                                            >
                                                {editingScheduleForAssignment === assignment.id
                                                    ? t('center.assignments.closeSchedule')
                                                    : t('center.assignments.editSchedule')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                icon={<HiOutlineTrash />}
                                                onClick={() => {
                                                    removeAssignment(assignment.id)
                                                    if (!assignments.some((a) => a.memberId === assignment.memberId && a.id !== assignment.id)) {
                                                        // keep member in list; only remove assignment
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {editingScheduleForAssignment === assignment.id && (
                                        <div className="space-y-3 mt-4 pt-4 border-t">
                                            <h5 className="font-medium text-sm mb-3">{t('center.assignments.weeklySchedule')}</h5>
                                            {assignment.weeklySchedule.map((daySchedule, dayIndex) => (
                                                <div key={daySchedule.day} className="flex items-center gap-3">
                                                    <div className="w-28 text-sm">{daySchedule.dayLabel}</div>
                                                    <Switcher
                                                        checked={daySchedule.isOpen}
                                                        onChange={(checked) =>
                                                            handleScheduleChange(assignment.id, dayIndex, 'isOpen', checked)
                                                        }
                                                    />
                                                    {daySchedule.isOpen && (
                                                        <>
                                                            <Select<{ value: string; label: string }>
                                                                size="sm"
                                                                className="w-32"
                                                                value={timeOptions.find((t) => t.value === daySchedule.startTime) ?? null}
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
                                                            <span className="text-gray-500">{t('center.assignments.to')}</span>
                                                            <Select<{ value: string; label: string }>
                                                                size="sm"
                                                                className="w-32"
                                                                value={timeOptions.find((t) => t.value === daySchedule.endTime) ?? null}
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
                    {t('center.wizard.back')}
                </Button>
                <Button variant="solid" onClick={handleNext} loading={isSavingSchedules}>
                    {t('center.wizard.next')}
                </Button>
            </div>
        </div>
    )
}
