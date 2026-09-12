import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import Button from '@/components/ui/Button'

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const NEXT_PROMPT_KEY = 'omanihub_pwa_install_prompt_after'
const CTA_DISMISS_MS = 3 * 24 * 60 * 60 * 1000
const NATIVE_REJECT_MS = 7 * 24 * 60 * 60 * 1000

function isStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    )
}

function canPromptNow() {
    const value = Number(localStorage.getItem(NEXT_PROMPT_KEY) ?? 0)
    return !Number.isFinite(value) || value <= Date.now()
}

export default function InstallAppPrompt() {
    const [installPrompt, setInstallPrompt] =
        useState<InstallPromptEvent | null>(null)
    const [visible, setVisible] = useState(false)
    const [showIosHelp, setShowIosHelp] = useState(false)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

    useEffect(() => {
        if (isStandalone()) return

        const showWhenEligible = () => {
            if (!canPromptNow()) return
            window.setTimeout(() => setVisible(true), 2500)
        }
        const onBeforeInstall = (event: Event) => {
            event.preventDefault()
            setInstallPrompt(event as InstallPromptEvent)
            showWhenEligible()
        }
        const onInstalled = () => {
            localStorage.removeItem(NEXT_PROMPT_KEY)
            setVisible(false)
            setInstallPrompt(null)
        }

        window.addEventListener('beforeinstallprompt', onBeforeInstall)
        window.addEventListener('appinstalled', onInstalled)
        if (isIos) showWhenEligible()

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall)
            window.removeEventListener('appinstalled', onInstalled)
        }
    }, [isIos])

    const postpone = (delay: number) => {
        localStorage.setItem(NEXT_PROMPT_KEY, String(Date.now() + delay))
        setVisible(false)
        setShowIosHelp(false)
    }

    const install = async () => {
        if (isIos) {
            setShowIosHelp(true)
            return
        }
        if (!installPrompt) return

        await installPrompt.prompt()
        const choice = await installPrompt.userChoice
        setInstallPrompt(null)
        if (choice.outcome === 'accepted') {
            localStorage.removeItem(NEXT_PROMPT_KEY)
            setVisible(false)
        } else {
            postpone(NATIVE_REJECT_MS)
        }
    }

    if (!visible || (!installPrompt && !isIos) || isStandalone()) return null

    return (
        <aside
            aria-live="polite"
            className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:bottom-5"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Download aria-hidden size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                        تثبيت تطبيق عماني هاب
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        افتح اللوحة بسرعة من الشاشة الرئيسية.
                    </p>
                    {showIosHelp ? (
                        <p className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <Share aria-hidden className="shrink-0" size={18} />
                            اضغط زر المشاركة، ثم اختر إضافة إلى الشاشة الرئيسية.
                        </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="solid"
                            icon={
                                isIos ? (
                                    <Share size={17} />
                                ) : (
                                    <Download size={17} />
                                )
                            }
                            onClick={() => void install()}
                        >
                            {isIos ? 'طريقة التثبيت' : 'تثبيت'}
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            onClick={() => postpone(CTA_DISMISS_MS)}
                        >
                            لاحقاً
                        </Button>
                    </div>
                </div>
                <button
                    aria-label="إغلاق"
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    type="button"
                    onClick={() => postpone(CTA_DISMISS_MS)}
                >
                    <X aria-hidden size={18} />
                </button>
            </div>
        </aside>
    )
}
