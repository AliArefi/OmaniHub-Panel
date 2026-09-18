import { Avatar, Timeline } from "@/components/ui";
import type { AvatarProps } from "@/components/ui/Avatar";
import useTranslation from '@/utils/hooks/useTranslation';

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

const steps = [
    { id: 1, titleKey: 'centerCreation.stepInformation' },
    { id: 2, titleKey: 'centerCreation.stepExtraInformation' },
    { id: 3, titleKey: 'centerCreation.stepGallery' },
    { id: 4, titleKey: 'centerCreation.stepServices' },
    { id: 5, titleKey: 'centerCreation.stepAssignServices' },
    { id: 6, titleKey: 'centerCreation.stepSummary' },
];

const getBackgroundColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return "bg-primary-deep";
    } else if (itemId < step) {
        return "bg-primary-deep";
    } else {
        return "bg-gray-400";
    }
};

const getTextColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return "text-primary-deep";
    } else if (itemId < step) {
        return "text-primary-deep";
    } else {
        return "text-gray-400";
    }
};

export function TimeLineCreateCenter({ step }: TimeLineCreateCenterProps) {
    const { t } = useTranslation()

    return (
        <Timeline>
            {steps.map((item) => {
                return (
                    <Timeline.Item
                        key={item.id}
                        media={
                            <TimelineAvatar
                                className={getBackgroundColor(item.id, step)}
                            >
                                {item.id}
                            </TimelineAvatar>
                        }
                    >
                        <p className="my-1 flex items-center">
                            <span
                                className={`dark:text-gray-100  ${getTextColor(item.id, step)}`}
                            >
                                {t(item.titleKey)}
                            </span>
                        </p>
                    </Timeline.Item>
                );
            })}
        </Timeline>
    );
}
