export const TEXT_CONSTANT = {
    loading: {
        EN: 'Loading',
        AR: 'تلقي المعلومات'
    },
    myAgenciesTitle: {
        EN: 'My Agencies',
        AR: 'وكالاتي'
    },
    myAgenciesSubtitle: {
        EN: 'Manage and view all your registered agencies in one place',
        AR: 'إدارة وعرض جميع وكالاتك المسجلة في مكان واحد'
    },
    myAgenciesHojra: {
        EN: 'Center',
        AR: 'اسم الغرفة'
    },
    status: {
        EN: 'Status',
        AR: 'حالة'
    },
    operation: {
        EN: 'Operation',
        AR: 'حالة'
    }
} as const

export type Language = keyof typeof TEXT_CONSTANT.loading 