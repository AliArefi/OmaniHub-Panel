import { useState } from 'react'
import {
    autoUpdate,
    flip,
    FloatingPortal,
    offset,
    safePolygon,
    shift,
    useClick,
    useDismiss,
    useFloating,
    useFocus,
    useHover,
    useInteractions,
    useRole,
} from '@floating-ui/react'
import useTranslation from '@/utils/hooks/useTranslation'

/**
 * Small "!" badge that opens an explanation in the current UI language.
 * Opens on hover/focus and toggles on tap.
 */
export default function InfoTip({ helpKey, className = '' }: { helpKey: string; className?: string }) {
    const { i18n } = useTranslation()
    const [open, setOpen] = useState(false)
    const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: 'top',
        whileElementsMounted: autoUpdate,
        middleware: [offset(8), flip({ fallbackAxisSideDirection: 'start' }), shift({ padding: 12 })],
    })
    const { getReferenceProps, getFloatingProps } = useInteractions([
        useHover(context, { delay: { open: 120, close: 80 }, handleClose: safePolygon() }),
        useFocus(context),
        useClick(context),
        useDismiss(context),
        useRole(context, { role: 'tooltip' }),
    ])

    const lang = i18n.language === 'ar' ? 'ar' : 'en'
    const text = i18n.getFixedT(lang)(`agencyFinance.help.${helpKey}`)

    return <>
        {/* A span (not a button) so it can sit inside a <label> without stealing it. */}
        <span
            ref={refs.setReference}
            role="button"
            tabIndex={0}
            aria-label={text}
            {...getReferenceProps({
                onClick: (event) => { event.preventDefault(); event.stopPropagation() },
            })}
            className={`inline-flex h-3.5 w-3.5 shrink-0 cursor-help select-none items-center justify-center rounded-full border border-current align-middle text-[8px] font-bold leading-none text-gray-400 transition-colors hover:text-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-gray-500 dark:hover:text-teal-300 ${open ? '!text-teal-600 dark:!text-teal-300' : ''} ${className}`}
        ><span aria-hidden="true">!</span></span>
        <FloatingPortal>
            {open && <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                lang={lang}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="z-[1000] w-max max-w-[min(260px,calc(100vw-24px))] rounded-lg border border-gray-200 bg-white px-3 py-2 text-start text-xs font-normal normal-case leading-relaxed tracking-normal text-gray-600 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >{text}</div>}
        </FloatingPortal>
    </>
}
