interface TabViewCenterProps {
    step: number;
    changeState: (value: number) => void
}


const Steps = [
    {
        id: 1,
        title: 'معلومات الحجرة',
    },
    {
        id: 2,
        title: 'المعلومات الإضافية',
    },
    {
        id: 3,
        title: 'معرض الصور',
    },
    {
        id: 4,
        title: 'الخدمات',
    },
    {
        id: 5,
        title: 'تعيين الخدمات',
    }
];

const getTextColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return 'text-primary-deep';
    } else {
        return 'text-gray-400';
    }
};

const getTabColor = (itemId: number, step: number) => {
    if (itemId === step) {
        return 'border-b-2 border-primary-deep';
    } else {
        return '';
    }
};

export function TabViewCenter({ step, changeState }: TabViewCenterProps) {
    return (
        <div className="flex items-center justify-around">
            {
                Steps.map((item) => {
                    return (
                        <div key={item.id} className={`hover:bg-primary/5 cursor-pointer flex-1 py-4 ${getTabColor(item.id, step)}`} onClick={() => changeState(item.id)} >
                            <p className="text-center">
                                <span className={`dark:text-gray-100 font-bold text-[10px] lg:text-sm text-center  ${getTextColor(item.id, step)}`}>
                                    {item.title}
                                </span>
                            </p>
                        </div>
                    );
                })
            }
        </div>
    );
}