export const TEXT_CONSTANT = {
    loading: {
        EN: 'Loading',
        AR: 'جارٍ تحميل المعلومات',
    },
    businessAnalyticsTitle: {
        EN: 'Business Analytics',
        AR: 'تحليلات الأعمال',
    },
    businessAnalyticsSubtitle: {
        EN: 'Unique-daily views with owner-scoped KPIs',
        AR: 'مشاهدات يومية فريدة مع مؤشرات أداء خاصة بالمالك',
    },
    autoRefreshIn: {
        EN: 'Auto refresh in',
        AR: 'تحديث تلقائي خلال',
    },
    secondsShort: {
        EN: 's',
        AR: 'ث',
    },
    refresh: {
        EN: 'Refresh',
        AR: 'تحديث',
    },
    preset: {
        EN: 'Preset',
        AR: 'الفترة',
    },
    last7Days: {
        EN: 'Last 7 days',
        AR: 'آخر 7 أيام',
    },
    last30Days: {
        EN: 'Last 30 days',
        AR: 'آخر 30 يومًا',
    },
    last90Days: {
        EN: 'Last 90 days',
        AR: 'آخر 90 يومًا',
    },
    from: {
        EN: 'From',
        AR: 'من',
    },
    to: {
        EN: 'To',
        AR: 'إلى',
    },
    timezone: {
        EN: 'Timezone',
        AR: 'المنطقة الزمنية',
    },
    pageviews: {
        EN: 'Pageviews',
        AR: 'مشاهدات الصفحة',
    },
    uniqueVisitors: {
        EN: 'Unique Visitors',
        AR: 'زوار فريدون',
    },
    reservations: {
        EN: 'Reservations',
        AR: 'الحجوزات',
    },
    whatsappClicks: {
        EN: 'WhatsApp Clicks',
        AR: 'نقرات واتساب',
    },
    ordersRevenue: {
        EN: 'Orders (Revenue)',
        AR: 'الطلبات (الإيراد)',
    },
    orders: {
        EN: 'Orders',
        AR: 'الطلبات',
    },
    dailyTrends: {
        EN: 'Daily Trends',
        AR: 'الاتجاهات اليومية',
    },
    topAgencies: {
        EN: 'Top Agencies',
        AR: 'أفضل الوكالات',
    },
    topStores: {
        EN: 'Top Stores',
        AR: 'أفضل المتاجر',
    },
    title: {
        EN: 'Title',
        AR: 'العنوان',
    },
    unique: {
        EN: 'Unique',
        AR: 'فريد',
    },
    views: {
        EN: 'Views',
        AR: 'مشاهدات',
    },
    noData: {
        EN: 'No data',
        AR: 'لا توجد بيانات',
    },
    myAgenciesTitle: {
        EN: 'My Agencies',
        AR: 'وكالاتي',
    },
    myAgenciesSubtitle: {
        EN: 'Manage and view all your registered agencies in one place',
        AR: 'إدارة وعرض جميع وكالاتك المسجلة في مكان واحد',
    },
    myAgenciesHojra: {
        EN: 'Center',
        AR: 'المركز',
    },
    status: {
        EN: 'Status',
        AR: 'الحالة',
    },
    operation: {
        EN: 'Operation',
        AR: 'العملية',
    },
    edit: {
        EN: 'Edit',
        AR: 'تعديل',
    },
    view: {
        EN: 'View',
        AR: 'عرض',
    },
    centerValidationCenterNameRequired: {
        EN: 'Center name is required',
        AR: 'اسم المركز إلزامي',
    },
    centerValidationServiceTypeRequired: {
        EN: 'Service type is required',
        AR: 'يجب اختيار نوع الخدمة',
    },
    centerValidationDescriptionRequired: {
        EN: 'Description is required',
        AR: 'الوصف إلزامي',
    },
    centerValidationTextTooShort: {
        EN: 'Text is too short',
        AR: 'النص قصير جدًا',
    },
    centerValidationAboutUsRequired: {
        EN: 'About us is required',
        AR: 'معلومات عنّا إلزامية',
    },
} as const

export type Language = keyof typeof TEXT_CONSTANT.loading

