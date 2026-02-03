import { Avatar, Timeline } from "@/components/ui";
import type { AvatarProps } from '@/components/ui/Avatar'

type TimelineAvatarProps = AvatarProps;

interface TimeLineCreateCenterProps {
    step: number;
}

const TimelineAvatar = ({ children, ...rest }: TimelineAvatarProps) => {
    return (
        <Avatar {...rest} size={25} shape="circle">
            {children}
        </Avatar>
    );
};

const Steps = [
    {
        id: 1,
        title: 'معلومات الحجرة',
    },
    {
        id: 2,
        title: 'الخدمات',
    },
    {
        id: 3,
        title: 'أعضاء الفريق',
    },
    {
        id: 4,
        title: 'أوقات العمل',
    },
];

const getBackgroundColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return 'bg-primary-deep';
    } else if (itemId < step) {
        return 'bg-primary-deep';
    } else {
        return 'bg-gray-400';
    }
};

const getTextColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return 'text-primary-deep';
    } else if (itemId < step) {
        return 'text-primary-deep';
    } else {
        return 'text-gray-400';
    }
};

export function TimeLineCreateCenter({ step }: TimeLineCreateCenterProps) {
    return (
        <Timeline>
            {
                Steps.map((item, index) => {
                    return (
                        <Timeline.Item
                            key={item.id}
                            media={
                                <TimelineAvatar className={getBackgroundColor(item.id, step)}>
                                    {item.id}
                                </TimelineAvatar>
                            }
                        >
                            <p className="my-1 flex items-center">
                                <span className={`dark:text-gray-100  ${getTextColor(item.id, step)}`}>
                                    {item.title}
                                </span>
                            </p>
                        </Timeline.Item>
                    );
                })
            }
        </Timeline>
    );
}
