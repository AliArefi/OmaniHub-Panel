'use client'

import { useState, useRef, useEffect } from 'react'
import { HiOutlineCalendar, HiChevronDown, HiRefresh, HiX } from 'react-icons/hi'
import { Button, Input } from '@/components/ui'
import useTranslation from '@/utils/hooks/useTranslation'

interface DashboardHeaderProps {
    firstName: string
    from: string
    to: string
    secondsToRefresh: number
    isValidating: boolean
    onFromChange: (val: string) => void
    onToChange: (val: string) => void
    onRefresh: () => void
}

export default function DashboardHeader({
    firstName,
    from,
    to,
    secondsToRefresh,
    isValidating,
    onFromChange,
    onToChange,
    onRefresh,
}: DashboardHeaderProps) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open])

    const dateLabel = from && to ? `${from} → ${to}` : t('dashboardLegacy.selectRange')

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Title */}
            <div>
                <h3 className="mb-1">{t('dashboardLegacy.welcome', `Welcome, ${firstName} 👋`).replace('{{name}}', firstName)}</h3>
                <p className="text-sm opacity-60">{t('dashboardLegacy.analyticsSubtitle')}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                {/* Auto-refresh badge — hidden on smallest breakpoint to save space */}
                <span className="hidden xs:inline-flex text-xs opacity-60 whitespace-nowrap">
                    {t('dashboardLegacy.autoRefreshIn')} {secondsToRefresh}{t('dashboardLegacy.secondsShort')}
                </span>

                {/* Date range — dropdown on mobile, inline on sm+ */}
                <>
                    {/* Mobile: single button that opens dropdown */}
                    <div className="relative flex-1 sm:hidden" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-haspopup="true"
                            aria-expanded={open}
                            className="flex items-center w-full justify-between gap-1.5 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[44px]"
                        >
                            <HiOutlineCalendar className="w-4 h-4 opacity-60 flex-shrink-0" />
                            <span className=" truncate opacity-80">{dateLabel}</span>
                            <HiChevronDown
                                className={`w-3.5 h-3.5 opacity-50 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {open && (
                            <div
                                role="dialog"
                                aria-label={t('dashboardLegacy.selectRange')}
                                className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col gap-3"
                            >
                                {/* Close button */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium opacity-60">{t('dashboardLegacy.selectRange')}</span>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        aria-label="Close"
                                    >
                                        <HiX className="w-4 h-4 opacity-50" />
                                    </button>
                                </div>

                                {/* From */}
                                <div>
                                    <label className="block text-xs opacity-70 mb-1">{t('dashboardLegacy.from')}</label>
                                    <Input
                                        type="date"
                                        value={from}
                                        onChange={(e) => onFromChange(e.target.value)}
                                    />
                                </div>

                                {/* To */}
                                <div>
                                    <label className="block text-xs opacity-70 mb-1">{t('dashboardLegacy.to')}</label>
                                    <Input
                                        type="date"
                                        value={to}
                                        onChange={(e) => onToChange(e.target.value)}
                                    />
                                </div>

                                {/* Countdown inside dropdown on mobile */}
                                <p className="text-xs opacity-50 text-center">
                                    {t('dashboardLegacy.autoRefreshIn')} {secondsToRefresh}{t('dashboardLegacy.secondsShort')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Desktop: plain inline inputs */}
                    <div className="hidden sm:flex sm:items-end sm:gap-3">
                        <div>
                            <label className="block text-xs opacity-70 mb-1">{t('dashboardLegacy.from')}</label>
                            <Input
                                type="date"
                                value={from}
                                onChange={(e) => onFromChange(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs opacity-70 mb-1">{t('dashboardLegacy.to')}</label>
                            <Input
                                type="date"
                                value={to}
                                onChange={(e) => onToChange(e.target.value)}
                            />
                        </div>
                    </div>
                </>

                {/* Refresh */}
                <Button
                    size="xs"
                    variant="solid"
                    loading={isValidating}
                    icon={!isValidating ? <HiRefresh /> : undefined}
                    onClick={onRefresh}
                >
                    <span className="hidden xs:inline">{t('dashboardLegacy.refresh')}</span>
                </Button>
            </div>
        </div>
    )
}
