import Checkbox from '@/components/ui/Checkbox'
import Radio from '@/components/ui/Radio'
import Switcher from '@/components/ui/Switcher'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import { TbMessageCircleCheck } from 'react-icons/tb'
import type { GetSettingsNotificationResponse } from '../types'
import { apiGetSettingsNotification } from '@/services/AccontsService'
import useTranslation from '@/utils/hooks/useTranslation'

type EmailNotificationFields =
    | 'newsAndUpdate'
    | 'tipsAndTutorial'
    | 'offerAndPromotion'
    | 'followUpReminder'

const emailNotificationOption: {
    labelKey: string
    value: EmailNotificationFields
    descKey: string
}[] = [{
    labelKey: 'profile.notifications.news',
    value: 'newsAndUpdate',
    descKey: 'profile.notifications.newsHint',
},
{
    labelKey: 'profile.notifications.tips',
    value: 'tipsAndTutorial',
    descKey: 'profile.notifications.tipsHint',
},
{
    labelKey: 'profile.notifications.offers',
    value: 'offerAndPromotion',
    descKey: 'profile.notifications.offersHint',
},
{
    labelKey: 'profile.notifications.followUp',
    value: 'followUpReminder',
    descKey: 'profile.notifications.followUpHint',
}
    ]

const notifyMeOption: {
    labelKey: string
    value: string
    descKey: string
}[] = [
        {
            labelKey: 'profile.notifications.allMessages',
            value: 'allNewMessage',
            descKey: 'profile.notifications.allMessagesHint',
        },
        {
            labelKey: 'profile.notifications.mentions',
            value: 'mentionsOnly',
            descKey: 'profile.notifications.mentionsHint',
        },
        {
            labelKey: 'profile.notifications.nothing',
            value: 'nothing',
            descKey: 'profile.notifications.nothingHint',
        }
    ]

const SettingsNotification = () => {
    const { t } = useTranslation()
    const {
        data = {
            email: [],
            desktop: false,
            unreadMessageBadge: false,
            notifymeAbout: '',
        },
        mutate,
    } = useSWR(
        '/api/settings/notification/',
        () => apiGetSettingsNotification<GetSettingsNotificationResponse>(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const handleEmailNotificationOptionChange = (values: string[]) => {
        const newData = cloneDeep(data)
        newData.email = values
        mutate(newData, false)
    }

    const handleEmailNotificationOptionCheckAll = (value: boolean) => {
        const newData = cloneDeep(data)
        if (value) {
            newData.email = [
                'newsAndUpdate',
                'tipsAndTutorial',
                'offerAndPromotion',
                'followUpReminder',
            ]
        } else {
            newData.email = []
        }

        mutate(newData, false)
    }

    const handleDesktopNotificationCheck = (value: boolean) => {
        const newData = cloneDeep(data)
        newData.desktop = value
        mutate(newData, false)
    }

    const handleUnreadMessagebadgeCheck = (value: boolean) => {
        const newData = cloneDeep(data)
        newData.unreadMessageBadge = value
        mutate(newData, false)
    }

    const handleNotifyMeChange = (value: string) => {
        const newData = cloneDeep(data)
        newData.notifymeAbout = value
        mutate(newData, false)
    }

    return (
        <div>
            <h4>{t('profile.notifications.title')}</h4>
            <div className="mt-2">
                <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-600">
                    <div>
                        <h5>{t('profile.notifications.desktop')}</h5>
                        <p>{t('profile.notifications.desktopHint')}</p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.desktop}
                            onChange={handleDesktopNotificationCheck}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-600">
                    <div>
                        <h5>{t('profile.notifications.unread')}</h5>
                        <p>{t('profile.notifications.unreadHint')}</p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.unreadMessageBadge}
                            onChange={handleUnreadMessagebadgeCheck}
                        />
                    </div>
                </div>
                <div className="py-6 border-b border-gray-200 dark:border-gray-600">
                    <h5>{t('profile.notifications.notifyAbout')}</h5>
                    <div className="mt-4">
                        <Radio.Group
                            vertical
                            className="flex flex-col gap-6"
                            value={data.notifymeAbout}
                            onChange={handleNotifyMeChange}
                        >
                            {notifyMeOption.map((option) => (
                                <div key={option.value} className="flex gap-4">
                                    <div className="mt-1.5">
                                        <Radio value={option.value} />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="mt-1">
                                            <TbMessageCircleCheck className="text-lg" />
                                        </div>
                                        <div>
                                            <h6>{t(option.labelKey)}</h6>
                                            <p>{t(option.descKey)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Radio.Group>
                    </div>
                </div>
                <div className="flex items-center justify-between py-6">
                    <div>
                        <h5>{t('profile.notifications.email')}</h5>
                        <p>{t('profile.notifications.emailHint')}</p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.email.length > 0}
                            onChange={handleEmailNotificationOptionCheckAll}
                        />
                    </div>
                </div>
                <Checkbox.Group
                    vertical
                    className="flex flex-col gap-6"
                    value={data.email}
                    onChange={handleEmailNotificationOptionChange}
                >
                    {emailNotificationOption.map((option) => (
                        <div key={option.value} className="flex gap-4">
                            <div className="mt-1.5">
                                <Checkbox value={option.value} />
                            </div>
                            <div>
                                <h6>{t(option.labelKey)}</h6>
                                <p>{t(option.descKey)}</p>
                            </div>
                        </div>
                    ))}
                </Checkbox.Group>
            </div>
        </div>
    )
}

export default SettingsNotification
