export {}

declare global {
    interface Window {
        google?: {
            accounts?: {
                id?: {
                    initialize: (options: {
                        client_id: string
                        callback: (resp: { credential?: string }) => void
                        auto_select?: boolean
                        cancel_on_tap_outside?: boolean
                        context?: string
                    }) => void
                    renderButton: (
                        parent: HTMLElement,
                        options: {
                            theme?: 'outline' | 'filled_blue' | 'filled_black'
                            size?: 'large' | 'medium' | 'small'
                            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
                            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
                            width?: number
                            logo_alignment?: 'left' | 'center'
                        },
                    ) => void
                    prompt: (
                        callback?: (notification: {
                            isNotDisplayed: () => boolean
                            isSkippedMoment: () => boolean
                            isDismissedMoment: () => boolean
                            getNotDisplayedReason: () => string
                            getSkippedReason: () => string
                            getDismissedReason: () => string
                        }) => void,
                    ) => void
                }
            }
        }
    }
}

