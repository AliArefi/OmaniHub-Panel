import { Card } from '@/components/ui'
import { HiOutlineEye, HiOutlinePencil, HiOutlineCube, HiChevronLeft } from 'react-icons/hi'
import { useNavigate } from 'react-router'

const StoreStatusBox = () => {
    const links = [
        { icon: <HiOutlineEye className="w-5 h-5" />, label: 'عرض الحجرة', url: '/centers' },
        { icon: <HiOutlinePencil className="w-5 h-5" />, label: 'تعديل معلومات الحجرة', url: '/centers' },
        { icon: <HiOutlineCube className="w-5 h-5" />, label: 'إدارة الخدمات', url: '/centers' },
    ]

    const progress = 78
    const navigate = useNavigate();

    return (
        <Card className="p-5 space-y-5 h-full" >
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    حالة حجرتك
                </h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    منشورة
                </span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4 h-30">
                {/* Circular progress */}
                <div className="relative flex-shrink-0 w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle
                            cx="32" cy="32" r="26"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-gray-100 dark:text-gray-700"
                        />
                        <circle
                            cx="32" cy="32" r="26"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 26}`}
                            strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                            className="text-primary transition-all duration-500"
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800 dark:text-gray-100">
                        {progress}٪
                    </span>
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        اكتمال الملف الشخصي
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                        أكمل معلومات حجرتك للحصول على زيارات أكثر
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700 mb-5" />

            {/* Quick links */}
            <ul className="space-y-3">
                {links.map((link) => (
                    <li key={link.label}>
                        <button onClick={() => navigate(link.url)} className="w-full flex items-center justify-between px-1 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="text-primary/70 group-hover:text-primary transition-colors">
                                    {link.icon}
                                </span>
                                {link.label}
                            </div>
                            <HiChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                        </button>
                    </li>
                ))}
            </ul>
        </Card>
    )
}

export default StoreStatusBox
