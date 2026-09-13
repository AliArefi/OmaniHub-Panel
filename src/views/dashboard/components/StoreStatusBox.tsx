import { memo } from 'react'
import { Card } from '@/components/ui'
import {
    HiOutlineEye,
    HiOutlinePencil,
    HiOutlineCube,
    HiChevronLeft,
} from 'react-icons/hi'
import { useNavigate } from 'react-router'

const CIRCUMFERENCE = 2 * Math.PI * 26 // ≈ 163.36

const links = [
    { icon: <HiOutlineEye className="w-5 h-5" />, label: 'عرض الحجرة', url: '/centers' },
    { icon: <HiOutlinePencil className="w-5 h-5" />, label: 'تعديل معلومات الحجرة', url: '/centers' },
    { icon: <HiOutlineCube className="w-5 h-5" />, label: 'إدارة الخدمات', url: '/centers' },
] as const

// Moved outside component — stable reference, no re-creation per render
const PROGRESS = 78

const StoreStatusBox = memo(() => {
    const navigate = useNavigate()

    return (
        <Card className="flex flex-col gap-5 p-5 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">حالة حجرتك</h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    منشورة
                </span>
            </div>

            {/* Profile completion */}
            <div className="flex items-center gap-4">
                {/* SVG ring — fixed viewBox, no layout thrash */}
                <div
                    className="relative flex-shrink-0 w-[72px] h-[72px]"
                    role="img"
                    aria-label={`${PROGRESS}% اكتمال الملف الشخصي`}
                >
                    <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 64 64"
                        aria-hidden="true"
                    >
                        <circle
                            cx="32" cy="32" r="26"
                            fill="none"
                            strokeWidth="6"
                            className="stroke-gray-100 dark:stroke-gray-700"
                        />
                        <circle
                            cx="32" cy="32" r="26"
                            fill="none"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={CIRCUMFERENCE * (1 - PROGRESS / 100)}
                            className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {PROGRESS}٪
                    </span>
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-medium">اكتمال الملف الشخصي</p>
                    <p className="text-xs opacity-50 mt-0.5 leading-relaxed">
                        أكمل معلومات حجرتك للحصول على زيارات أكثر
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* Quick links */}
            <ul className="space-y-1" role="list">
                {links.map((link) => (
                    <li key={link.label}>
                        <button
                            type="button"
                            onClick={() => navigate(link.url)}
                            className="w-full flex items-center justify-between px-2 py-3 rounded-lg text-sm text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors group min-h-[44px]"
                        >
                            <span className="flex items-center gap-3">
                                <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                                    {link.icon}
                                </span>
                                {link.label}
                            </span>
                            <HiChevronLeft className="w-4 h-4 opacity-30 group-hover:opacity-70 transition-opacity flex-shrink-0" />
                        </button>
                    </li>
                ))}
            </ul>
        </Card>
    )
})

StoreStatusBox.displayName = 'StoreStatusBox'

export default StoreStatusBox
