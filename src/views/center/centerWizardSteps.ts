export const CENTER_WIZARD_STEP = {
    INFORMATION: 1,
    EXTRA_INFORMATION: 2,
    GALLERY: 3,
    SERVICES: 4,
    ASSIGN_SERVICES: 5,
    SUMMARY: 6,
} as const

export type CenterWizardStep =
    (typeof CENTER_WIZARD_STEP)[keyof typeof CENTER_WIZARD_STEP]

