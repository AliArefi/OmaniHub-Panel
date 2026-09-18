import React from 'react'
import {
    Card,
    Button,
    Avatar,
    Progress,
    Badge,
} from '@/components/ui'
import { HiOutlineStar, HiOutlineUser, HiOutlineHeart, HiOutlineCog, HiPlus, HiChevronLeft, HiChevronRight, HiOutlineOfficeBuilding } from 'react-icons/hi'
import { useAuth } from '@/auth'
import useTranslation from '@/utils/hooks/useTranslation'
import { useNavigate } from 'react-router'

// ─── types ────────────────────────────────────────────────────────────────────
interface UserProfile {
    id: number
    name: string
    email: string
    mobile: string
    avatar: string
    bio: string | null
    has_active_agency: boolean
    has_active_store: boolean
}

interface NoStorePageProps { }

// ─── quick-link card ──────────────────────────────────────────────────────────
interface QuickLinkProps {
    icon: React.ReactNode
    iconBg: string
    title: string
    description: string
    href?: string
    onClick?: () => void
}

const QuickLink: React.FC<QuickLinkProps> = ({
    icon,
    iconBg,
    title,
    description,
    onClick,
}) => (
    <Card
        clickable
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
    >
        <div className='flex-row gap-4 flex w-full items-center justify-between '>
            <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
            >
                {icon}
            </div>
            <div className="flex-1 text-start">
                <div className="font-semibold text-gray-800 dark:text-gray-100">
                    {title}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {description}
                </p>
            </div>
        </div>
    </Card>
)

const WithoutCenterDashborad: React.FC<NoStorePageProps> = ({ }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const firstName = user?.name ? user.name.split(' ')[0] : t('dashboardLegacy.userFallback')
    const profileCompletion = 70;
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen p-4 md:p-8"
        >
            <div className="container mx-auto space-y-5">

                {/* ── 1. Welcome banner ───────────────────────────────────── */}
                <Card className="overflow-hidden bg-white">
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6">

                        <div className="hidden sm:flex w-40 h-24 flex-shrink-0 rounded-xl opacity-45 items-center justify-center">
                            <img src='./img/others/uptosell.png' alt='uptosell' />
                        </div>


                        {/* greeting – center */}
                        <div className="flex-1 text-center space-y-1.5">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {t('dashboardLegacy.welcome', `Welcome, ${firstName} 👋`).replace('{{name}}', firstName)}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('dashboardLegacy.subtitle')}
                            </p>
                        </div>

                        {/* profile completion – left on RTL = visual left */}
                        <div className="w-full sm:w-62 flex-shrink-0 border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    {t('dashboardLegacy.completeProfile')}
                                </span>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {profileCompletion}%
                                </p>
                            </div>

                            <Progress
                                percent={profileCompletion}
                                showInfo={false}
                                className="[&_.progress-inner]:bg-primary/20"
                            />
                            <button
                                onClick={() => navigate('/profile')}
                                className="text-xs text-primary dark:text-primary-400 flex items-center gap-1 hover:underline"
                            >
                                {t('dashboardLegacy.completeInformation')}
                                <HiChevronLeft className="text-sm" />
                            </button>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-primary/5 border-primary">
                    <div className="flex  flex-col sm:flex-row items-center gap-6">

                        <div className="flex-1 text-start space-y-1">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('dashboardLegacy.callToActionTitle')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('dashboardLegacy.callToActionSubtitle')}
                            </p>
                        </div>

                        <Button
                            variant="solid"
                            className="bg-primary hover:bg-primary/90 text-white gap-1.5"
                            icon={<HiPlus />}
                            onClick={() => navigate('/new-center')}
                        >
                            {t('dashboardLegacy.createCenter')}
                        </Button>
                    </div>
                </Card>
                {/* ── 3. My stores – empty state ───────────────────────────── */}
                <Card>
                    {/* header row */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                            {t('dashboardLegacy.myCenters')}
                        </h3>
                        <Button onClick={() => navigate('/centers')} size='xs' variant="plain">
                            {t('dashboardLegacy.viewAll')}
                        </Button>

                    </div>

                    {/* empty state */}
                    <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-indigo-900/30 flex items-center justify-center">
                            <HiOutlineOfficeBuilding className="text-4xl text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-gray-700 dark:text-gray-200">
                                {t('dashboardLegacy.noCenters')}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {t('dashboardLegacy.noCentersDescription')}
                            </p>
                        </div>
                        <Button
                            variant="default"
                            className="border border-primary text-primary hover:bg-primary-10 dark:hover:bg-primary/20"
                            onClick={() => navigate('/new-center')}
                        >
                            {t('dashboardLegacy.createCenter')}
                        </Button>
                    </div>
                </Card>

                {/* ── 4. Quick links ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <QuickLink
                        icon={<HiOutlineCog className="text-xl text-orange-500" />}
                        iconBg="bg-orange-50 dark:bg-orange-900/30"
                        title={t('dashboardLegacy.settings')}
                        description={t('dashboardLegacy.settingsDescription')}
                        onClick={() => navigate('/profile')}
                    />
                    <QuickLink
                        icon={<HiOutlineHeart className="text-xl text-rose-500" />}
                        iconBg="bg-rose-50 dark:bg-rose-900/30"
                        title={t('dashboardLegacy.favorite')}
                        description={t('dashboardLegacy.favoriteDescription')}
                        onClick={() => navigate('/favorite')}
                    />

                    <QuickLink
                        icon={<HiOutlineUser className="text-xl text-indigo-500" />}
                        iconBg="bg-indigo-50 dark:bg-indigo-900/30"
                        title={t('dashboardLegacy.myProfiles')}
                        description={t('dashboardLegacy.myProfilesDescription')}
                        onClick={() => navigate('/profile')}
                    />
                </div>

            </div>
        </div>
    )
}

export default WithoutCenterDashborad
