export const VIEW_CENTER_TAB_STEP = {
    INFORMATION: 1,
    EXTRA_INFORMATION: 2,
    GALLERY: 3,
    SERVICES: 4,
    ASSIGN_SERVICES: 5,
    SUMMARY: 6,
} as const

export type CenterWizardStep =
    (typeof VIEW_CENTER_TAB_STEP)[keyof typeof VIEW_CENTER_TAB_STEP]

