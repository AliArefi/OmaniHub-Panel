import Checkbox from '@/components/ui/Checkbox'
import Radio from '@/components/ui/Radio'
import Switcher from '@/components/ui/Switcher'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import { TbMessageCircleCheck } from 'react-icons/tb'
import type { GetSettingsNotificationResponse } from '../types'
import { apiGetSettingsNotification } from '@/services/AccontsService'

type EmailNotificationFields =
    | 'newsAndUpdate'
    | 'tipsAndTutorial'
    | 'offerAndPromotion'
    | 'followUpReminder'

const emailNotificationOption: {
    label: string
    value: EmailNotificationFields
    desc: string
}[] = [{
    label: 'الأخبار والتحديثات',
    value: 'newsAndUpdate',
    desc: 'أخبار جديدة حول المنتج وتحديثات الميزات',
},
{
    label: 'النصائح والدروس التعليمية',
    value: 'tipsAndTutorial',
    desc: 'نصائح وحيل لزيادة الكفاءة والإنتاجية',
},
{
    label: 'العروض والتخفيضات',
    value: 'offerAndPromotion',
    desc: 'إشعارات حول أسعار المنتجات وأحدث التخفيضات',
},
{
    label: 'تذكير المتابعة',
    value: 'followUpReminder',
    desc: 'استلام إشعارات لجميع التذكيرات التي تم إنشاؤها',
}
    ]

const notifyMeOption: {
    label: string
    value: string
    desc: string
}[] = [
        {
            label: 'جميع الرسائل الجديدة',
            value: 'allNewMessage',
            desc: 'إرسال إشعار إلى القناة لكل رسالة جديدة',
        },
        {
            label: 'الإشارات فقط',
            value: 'mentionsOnly',
            desc: 'التنبيه في القناة فقط عندما يقوم شخص ما بالإشارة إليّ في رسالة',
        },
        {
            label: 'لا شيء',
            value: 'nothing',
            desc: 'لا ترسل لي أي إشعارات',
        }
    ]

const SettingsNotification = () => {
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
            <h4>الإشعارات</h4>
            <div className="mt-2">
                <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-600">
                    <div>
                        <h5>تفعيل إشعارات سطح المكتب</h5>
                        <p>حدد ما إذا كنت ترغب في استلام إشعارات للرسائل والتحديثات الجديدة</p>
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
                        <h5>تفعيل شارة الرسائل غير المقروءة</h5>
                        <p>عرض مؤشر أحمر على أيقونة الإشعارات عند وجود رسائل غير مقروءة</p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.unreadMessageBadge}
                            onChange={handleUnreadMessagebadgeCheck}
                        />
                    </div>
                </div>
                <div className="py-6 border-b border-gray-200 dark:border-gray-600">
                    <h5>أعلمني عن</h5>
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
                                            <h6>{option.label}</h6>
                                            <p>{option.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Radio.Group>
                    </div>
                </div>
                <div className="flex items-center justify-between py-6">
                    <div>
                        <h5>إشعارات البريد الإلكتروني</h5>
                        <p>يمكن لـ Substance إرسال بريد إلكتروني إليك لكل رسالة مباشرة جديدة</p>
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
                                <h6>{option.label}</h6>
                                <p>{option.desc}</p>
                            </div>
                        </div>
                    ))}
                </Checkbox.Group>
            </div>
        </div>
    )
}

export default SettingsNotification
