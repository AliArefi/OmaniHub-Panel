import { useMemo, useState, type ChangeEvent } from 'react'
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
import { prepareValidatedFile } from '../utils/fileUpload'
import {
    createDefaultWeekSchedule,
    createEmptyTimeSlot,
    dayOfWeekFromKey,
    mergeDaySlots,
    normalizeDaySchedule,
} from '../utils/schedule'

type SelectOption = { value: number; label: string }

const generateTimeOptions = () => {
    const options: { value: string; label: string }[] = []
    for (let hour = 0; hour < 24; hour += 1) {
        for (let minute = 0; minute < 60; minute += 30) {
            const nextHour = hour.toString().padStart(2, '0')
            const nextMinute = minute.toString().padStart(2, '0')
            options.push({
                value: `${nextHour}:${nextMinute}`,
                label: `${nextHour}:${nextMinute}`,
            })
        }
    }
    return options
}

export const HojraAssignServices = ({
    changeState,
}: {
    changeState: (step: number) => void
}) => {
    const { t } = useTranslation()
    const {
        services,
        teamMembers,
        assignments,
        setTeamMembers,
        setAssignments,
        addTeamMember,
        removeTeamMember,
        updateAssignmentSchedule,
    } = useCreateStore()

    const timeOptions = useMemo(() => generateTimeOptions(), [])
    const serviceOptions: SelectOption[] = services.map((service) => ({
        value: service.id,
        label: service.serviceLabel,
    }))

    const [showNewMemberForm, setShowNewMemberForm] = useState(false)
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberPosition, setNewMemberPosition] = useState('')
    const [newMemberImageFile, setNewMemberImageFile] = useState<File | null>(null)
    const [newMemberImagePreview, setNewMemberImagePreview] = useState<string | null>(null)
    const [newMemberServiceId, setNewMemberServiceId] = useState<number | null>(null)
    const [isCreatingMember, setIsCreatingMember] = useState(false)

    const [editingScheduleForAssignment, setEditingScheduleForAssignment] = useState<number | null>(null)
    const [isSavingSchedules, setIsSavingSchedules] = useState(false)
    const [isDeletingMemberId, setIsDeletingMemberId] = useState<number | null>(null)

    const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
    const [editMemberName, setEditMemberName] = useState('')
    const [editMemberPosition, setEditMemberPosition] = useState('')
    const [editMemberImageFile, setEditMemberImageFile] = useState<File | null>(null)
    const [editMemberImagePreview, setEditMemberImagePreview] = useState<string | null>(null)
    const [isUpdatingMember, setIsUpdatingMember] = useState(false)

    const showFileError = (message: string) => {
        toast.push(<Notification type="danger">{message}</Notification>)
    }

    const getMemberAgencyServiceId = (memberId: number): number | null => {
        const assignment = assignments.find((item) => item.memberId === memberId)
        return assignment ? assignment.serviceId : null
    }

    const getAssignmentByMemberId = (memberId: number) =>
        assignments.find((item) => item.memberId === memberId) ?? null

    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const inputFile = event.target.files?.[0]
        if (!inputFile) return

        const { file, error } = prepareValidatedFile(inputFile, {
            category: 'image',
        })
        if (error || !file) {
            showFileError(error || t('center.errors.uploadFailed'))
            event.target.value = ''
            return
        }

        setNewMemberImageFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setNewMemberImagePreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleEditImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const inputFile = event.target.files?.[0]
        if (!inputFile) return

        const { file, error } = prepareValidatedFile(inputFile, {
            category: 'image',
        })
        if (error || !file) {
            showFileError(error || t('center.errors.uploadFailed'))
            event.target.value = ''
            return
        }

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

            const selectedService = services.find((service) => service.id === newMemberServiceId)
            if (selectedService) {
                setAssignments((currentAssignments) => [
                    ...currentAssignments,
                    {
                        id: Number(`${selectedService.id}${createdMember.id}`),
                        serviceId: selectedService.id,
                        serviceLabel: selectedService.serviceLabel,
                        memberId: createdMember.id,
                        memberName: createdMember.name,
                        weeklySchedule: createDefaultWeekSchedule(),
                    },
                ])
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
        const member = teamMembers.find((item) => item.id === memberId)
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

            setTeamMembers((currentMembers) =>
                currentMembers.map((member) =>
                    member.id === editingMemberId
                        ? {
                              ...member,
                              name: payload.name ?? member.name,
                              position: payload.position ?? member.position,
                              image: editMemberImagePreview ?? member.image,
                          }
                        : member,
                ),
            )

            setAssignments((currentAssignments) =>
                currentAssignments.map((assignment) =>
                    assignment.memberId === editingMemberId
                        ? {
                              ...assignment,
                              memberName: payload.name ?? assignment.memberName,
                          }
                        : assignment,
                ),
            )

            toast.push(<Notification type="success">{t('center.members.saveChanges')}</Notification>)
            setEditingMemberId(null)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('center.errors.updateMemberFailed')
            toast.push(<Notification type="danger">{message}</Notification>)
        } finally {
            setIsUpdatingMember(false)
        }
    }

    const updateSchedule = (
        assignmentId: number,
        updater: (weeklySchedule: DaySchedule[]) => DaySchedule[],
    ) => {
        const assignment = assignments.find((item) => item.id === assignmentId)
        if (!assignment) return

        const nextSchedule = updater(assignment.weeklySchedule.map(normalizeDaySchedule)).map(mergeDaySlots)
        updateAssignmentSchedule(assignmentId, nextSchedule)
    }

    const handleDayToggle = (assignmentId: number, dayIndex: number, checked: boolean) => {
        updateSchedule(assignmentId, (weeklySchedule) => {
            const nextSchedule = [...weeklySchedule]
            const currentDay = nextSchedule[dayIndex]
            nextSchedule[dayIndex] = normalizeDaySchedule({
                ...currentDay,
                isOpen: checked,
                slots:
                    checked && currentDay.slots.length === 0
                        ? [createEmptyTimeSlot()]
                        : currentDay.slots,
            })
            return nextSchedule
        })
    }

    const handleSlotChange = (
        assignmentId: number,
        dayIndex: number,
        slotIndex: number,
        field: 'startTime' | 'endTime',
        value: string,
    ) => {
        updateSchedule(assignmentId, (weeklySchedule) => {
            const nextSchedule = [...weeklySchedule]
            const currentDay = nextSchedule[dayIndex]
            const nextSlots = [...currentDay.slots]
            nextSlots[slotIndex] = {
                ...nextSlots[slotIndex],
                [field]: value,
            }
            nextSchedule[dayIndex] = normalizeDaySchedule({
                ...currentDay,
                slots: nextSlots,
            })
            return nextSchedule
        })
    }

    const addSlot = (assignmentId: number, dayIndex: number) => {
        updateSchedule(assignmentId, (weeklySchedule) => {
            const nextSchedule = [...weeklySchedule]
            const currentDay = nextSchedule[dayIndex]
            nextSchedule[dayIndex] = normalizeDaySchedule({
                ...currentDay,
                isOpen: true,
                slots: [...currentDay.slots, createEmptyTimeSlot()],
            })
            return nextSchedule
        })
    }

    const removeSlot = (assignmentId: number, dayIndex: number, slotIndex: number) => {
        updateSchedule(assignmentId, (weeklySchedule) => {
            const nextSchedule = [...weeklySchedule]
            const currentDay = nextSchedule[dayIndex]
            const nextSlots = currentDay.slots.filter((_, index) => index !== slotIndex)

            nextSchedule[dayIndex] = normalizeDaySchedule({
                ...currentDay,
                isOpen: nextSlots.length > 0,
                slots: nextSlots.length > 0 ? nextSlots : [createEmptyTimeSlot()],
            })

            if (nextSlots.length === 0) {
                nextSchedule[dayIndex].isOpen = false
            }

            return nextSchedule
        })
    }

    const persistSchedules = async () => {
        const requests = assignments.map(async (assignment) => {
            const days = assignment.weeklySchedule.map((daySchedule) => {
                const normalizedDay = mergeDaySlots(normalizeDaySchedule(daySchedule))

                if (!normalizedDay.isOpen) {
                    return {
                        day_of_week: dayOfWeekFromKey(normalizedDay.day),
                        is_closed: true,
                        slots: [],
                    }
                }

                return {
                    day_of_week: dayOfWeekFromKey(normalizedDay.day),
                    is_closed: false,
                    slots: normalizedDay.slots.map((slot) => ({
                        start: slot.startTime,
                        end: slot.endTime,
                        is_active: true,
                    })),
                }
            })

            await apiMemberWorkingHours({ days }, assignment.memberId)
        })

        await Promise.all(requests)
    }

    const hasAnySchedule = assignments.some((assignment) =>
        assignment.weeklySchedule.some(
            (daySchedule) => daySchedule.isOpen && (daySchedule.slots?.length ?? 0) > 0,
        ),
    )

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
                            <Input value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.position')}>
                            <Input value={newMemberPosition} onChange={(event) => setNewMemberPosition(event.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.image')}>
                            <Input type="file" accept="image/*" onChange={handleImageUpload} />
                            {newMemberImagePreview && (
                                <img src={newMemberImagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
                            )}
                        </FormItem>

                        <FormItem label={t('center.members.service')}>
                            <Select<SelectOption>
                                value={newMemberServiceId ? serviceOptions.find((service) => service.value === newMemberServiceId) ?? null : null}
                                options={serviceOptions}
                                placeholder={t('center.members.service')}
                                onChange={(option) => setNewMemberServiceId(option?.value ?? null)}
                            />
                        </FormItem>

                        <div className="flex gap-2">
                            <Button variant="solid" loading={isCreatingMember} onClick={handleCreateMember}>
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
                        {teamMembers.map((member) => {
                            const assignment = getAssignmentByMemberId(member.id)

                            return (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                                    <div className="flex items-center gap-3">
                                        {member.image && (
                                            <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                        )}
                                        <div>
                                            <div className="font-medium">{member.name}</div>
                                            <div className="text-sm text-gray-500">{member.position}</div>
                                            {assignment && (
                                                <div className="text-xs text-gray-500">{assignment.serviceLabel}</div>
                                            )}
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
                            )
                        })}
                    </div>
                )}

                {editingMemberId && (
                    <div className="mt-6 p-4 border rounded-lg space-y-4">
                        <h4 className="font-medium">{t('center.members.editTitle')}</h4>

                        <FormItem label={t('center.members.name')}>
                            <Input value={editMemberName} onChange={(event) => setEditMemberName(event.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.position')}>
                            <Input value={editMemberPosition} onChange={(event) => setEditMemberPosition(event.target.value)} />
                        </FormItem>

                        <FormItem label={t('center.members.image')}>
                            <Input type="file" accept="image/*" onChange={handleEditImageUpload} />
                            {editMemberImagePreview && (
                                <img src={editMemberImagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />
                            )}
                        </FormItem>

                        <div className="flex gap-2">
                            <Button variant="solid" loading={isUpdatingMember} onClick={saveMemberEdits}>
                                {t('center.members.saveChanges')}
                            </Button>
                            <Button
                                variant="plain"
                                disabled={isUpdatingMember}
                                onClick={() => {
                                    setEditingMemberId(null)
                                    setEditMemberName('')
                                    setEditMemberPosition('')
                                    setEditMemberImageFile(null)
                                    setEditMemberImagePreview(null)
                                }}
                            >
                                {t('center.members.cancel')}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {assignments.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold mb-4">{t('center.assignments.weeklySchedule')}</h3>

                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="font-medium">{assignment.memberName}</div>
                                        <div className="text-sm text-gray-500">{assignment.serviceLabel}</div>
                                    </div>
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
                                </div>

                                {editingScheduleForAssignment === assignment.id && (
                                    <div className="space-y-4 mt-4 pt-4 border-t">
                                        {assignment.weeklySchedule.map((daySchedule, dayIndex) => (
                                            <div key={daySchedule.day} className="rounded-lg border p-3 space-y-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-sm font-medium">{daySchedule.dayLabel}</div>
                                                    <Switcher
                                                        checked={daySchedule.isOpen}
                                                        onChange={(checked) =>
                                                            handleDayToggle(assignment.id, dayIndex, checked)
                                                        }
                                                    />
                                                </div>

                                                {daySchedule.isOpen && (
                                                    <div className="space-y-3">
                                                        {daySchedule.slots.map((slot, slotIndex) => (
                                                            <div
                                                                key={`${daySchedule.day}-${slotIndex}`}
                                                                className="flex flex-wrap items-center gap-2"
                                                            >
                                                                <Select<{ value: string; label: string }>
                                                                    size="sm"
                                                                    className="w-32"
                                                                    value={timeOptions.find((timeOption) => timeOption.value === slot.startTime) ?? null}
                                                                    options={timeOptions}
                                                                    onChange={(option) =>
                                                                        handleSlotChange(
                                                                            assignment.id,
                                                                            dayIndex,
                                                                            slotIndex,
                                                                            'startTime',
                                                                            option?.value ?? '09:00',
                                                                        )
                                                                    }
                                                                />
                                                                <span className="text-gray-500">{t('center.assignments.to')}</span>
                                                                <Select<{ value: string; label: string }>
                                                                    size="sm"
                                                                    className="w-32"
                                                                    value={timeOptions.find((timeOption) => timeOption.value === slot.endTime) ?? null}
                                                                    options={timeOptions}
                                                                    onChange={(option) =>
                                                                        handleSlotChange(
                                                                            assignment.id,
                                                                            dayIndex,
                                                                            slotIndex,
                                                                            'endTime',
                                                                            option?.value ?? '17:00',
                                                                        )
                                                                    }
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant="plain"
                                                                    icon={<HiOutlineTrash />}
                                                                    onClick={() =>
                                                                        removeSlot(assignment.id, dayIndex, slotIndex)
                                                                    }
                                                                />
                                                            </div>
                                                        ))}

                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            icon={<HiOutlinePlus />}
                                                            onClick={() => addSlot(assignment.id, dayIndex)}
                                                        >
                                                            إضافة فترة
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="flex justify-between">
                <Button variant="plain" onClick={() => changeState(4)}>
                    {t('center.wizard.back')}
                </Button>
                <Button variant="solid" loading={isSavingSchedules} onClick={handleNext}>
                    {t('center.wizard.next')}
                </Button>
            </div>
        </div>
    )
}


