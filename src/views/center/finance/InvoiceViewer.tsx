import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Button, Spinner } from '@/components/ui'
import useTranslation from '@/utils/hooks/useTranslation'
import { getFinanceInvoice, type FinanceInvoice } from '@/services/AgencyFinanceService'
import InvoiceDocument, { type InvoiceDocumentData } from './InvoiceDocument'
import { invoiceStyles, printInvoice } from './invoicePrint'
import { TbDownload, TbFileInvoice } from 'react-icons/tb'

type Lang = 'en' | 'ar'

/** On-screen bilingual invoice with print / "Save as PDF" export. */
export default function InvoiceViewer({ agencySlug, reservationId, summary }: {
    agencySlug: string
    reservationId: number
    summary?: Pick<FinanceInvoice, 'issued_at' | 'member' | 'subtotal'> | null
}) {
    const { i18n } = useTranslation()
    const [lang, setLang] = useState<Lang>(i18n.language === 'ar' ? 'ar' : 'en')
    const [printing, setPrinting] = useState(false)
    const [printError, setPrintError] = useState(false)
    const documentRef = useRef<HTMLElement>(null)
    const { data, error, isLoading } = useSWR(['agency-finance-invoice', agencySlug, reservationId], () => getFinanceInvoice(agencySlug, reservationId))

    useEffect(() => { setLang(i18n.language === 'ar' ? 'ar' : 'en') }, [i18n.language])

    const detail = data?.data
    const invoice: InvoiceDocumentData | null = detail ? {
        ...detail,
        reservation_id: detail.reservation_id ?? reservationId,
        issued_at: detail.issued_at ?? summary?.issued_at ?? detail.created_at,
        subtotal: detail.subtotal ?? summary?.subtotal,
        member_name: detail.member?.name ?? summary?.member?.name,
        items: detail.items ?? [],
    } : null

    const exportPdf = async () => {
        if (!documentRef.current || !invoice) return
        setPrinting(true)
        setPrintError(false)
        try { await printInvoice(documentRef.current, `${invoice.number} - ${invoice.customer_name}`) }
        catch { setPrintError(true) }
        finally { setPrinting(false) }
    }

    const bi = (en: string, ar: string) => lang === 'ar' ? `${ar} · ${en}` : `${en} · ${ar}`

    return <div className="flex max-h-[85vh] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4 pe-10 dark:border-gray-700">
            <div className="flex items-center gap-3">
                <span className="rounded-xl bg-teal-50 p-2 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300"><TbFileInvoice size={22} /></span>
                <div>
                    <h2 className="text-lg font-bold">{bi('Invoice preview', 'معاينة الفاتورة')}</h2>
                    <p className="text-xs text-gray-500">{invoice?.number ?? `#${reservationId}`}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label={bi('Primary language', 'اللغة الأساسية')} className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                    {(['en', 'ar'] as const).map((code) => <button key={code} type="button" aria-pressed={lang === code}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${lang === code ? 'bg-white text-slate-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        onClick={() => setLang(code)}>
                        {code === 'en' ? 'EN | ع' : 'ع | EN'}
                    </button>)}
                </div>
                <Button size="sm" variant="solid" icon={<TbDownload />} loading={printing} disabled={!invoice} onClick={exportPdf}>{bi('PDF / Print', 'PDF / طباعة')}</Button>
            </div>
        </div>
        {invoice && <p className="pt-2 text-[11px] text-gray-400">{bi('Choose “Save as PDF” as the destination in the print window.', 'اختر «حفظ كملف PDF» كوجهة في نافذة الطباعة.')}</p>}
        {printError && <p role="alert" className="pt-2 text-sm text-red-600">{bi('Could not open the print window.', 'تعذر فتح نافذة الطباعة.')}</p>}

        <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-2xl bg-slate-100 p-3 sm:p-6 dark:bg-gray-900">
            {isLoading && <div className="flex justify-center py-20"><Spinner size={36} /></div>}
            {error && <p role="alert" className="py-20 text-center text-red-600">{bi('Invoice is unavailable.', 'الفاتورة غير متاحة.')}</p>}
            {invoice && <>
                <style>{invoiceStyles()}</style>
                <div className="mx-auto max-w-[794px] overflow-hidden rounded-md shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5">
                    <InvoiceDocument ref={documentRef} invoice={invoice} lang={lang} />
                </div>
            </>}
        </div>
    </div>
}
