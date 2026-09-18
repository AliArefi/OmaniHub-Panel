import useTranslation from '@/utils/hooks/useTranslation'

interface TabViewCenterProps {
    step: number
    changeState: (value: number) => void
}

const steps = [
    {
        id: 1,
        titleKey: 'viewCenterTabs.information',
    },
    {
        id: 2,
        titleKey: 'viewCenterTabs.extraInformation',
    },
    {
        id: 3,
        titleKey: 'viewCenterTabs.gallery',
    },
    {
        id: 5,
        titleKey: 'viewCenterTabs.teamAndSchedule',
    },
    {
        id: 4,
        titleKey: 'viewCenterTabs.services',
    },
]

const getTextColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return 'text-primary-deep'
    } else {
        return 'text-gray-400'
    }
}

const getTabColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return 'border-b-2 border-primary-deep'
    } else {
        return ''
    }
}

export function TabViewCenter({ step, changeState }: TabViewCenterProps) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center justify-around">
            {steps.map((item) => {
                return (
                    <div
                        key={item.id}
                        className={`hover:bg-primary/5 cursor-pointer flex-1 py-4 ${getTabColor(item.id, step)}`}
                        onClick={() => changeState(item.id)}
                    >
                        <p className="text-center">
                            <span
                                className={`dark:text-gray-100 font-bold text-[10px] lg:text-sm text-center  ${getTextColor(item.id, step)}`}
                            >
                                {t(item.titleKey)}
                            </span>
                        </p>
                    </div>
                )
            })}
        </div>
    )
}
