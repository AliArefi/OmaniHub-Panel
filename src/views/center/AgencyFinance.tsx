import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useParams } from 'react-router'
import { Button, Card, Dialog, Input, Spinner } from '@/components/ui'
import useTranslation from '@/utils/hooks/useTranslation'
import ReservationInvoicePanel from '@/views/bookings/components/ReservationInvoicePanel'
import InfoTip from './finance/InfoTip'
import InvoiceViewer from './finance/InvoiceViewer'
import { localizeDigits, numberLocale } from './finance/digits'
import {
    addFinanceExpense,
    getFinanceOverview,
    getFinanceShares,
    saveFinanceShare,
    type FinanceInvoice,
    type FinanceShare,
} from '@/services/AgencyFinanceService'
import { TbArrowDownRight, TbArrowUpRight, TbEye, TbFileInvoice, TbPlus, TbReceipt, TbUsers } from 'react-icons/tb'
import dayjs from 'dayjs'

type View = 'overview' | 'invoices' | 'members' | 'shares' | 'expenses'

const initialMonth = dayjs().format('YYYY-MM')
const amount = (value: string | number | null | undefined) => Number(value ?? 0)

export default function AgencyFinance() {
    const { t, i18n } = useTranslation()
    const { agencySlug = '' } = useParams()
    const [month, setMonth] = useState(initialMonth)
    const [view, setView] = useState<View>('overview')
    const [currency, setCurrency] = useState('OMR')
    const [issueReservationId, setIssueReservationId] = useState<number | null>(null)
    const [viewInvoice, setViewInvoice] = useState<FinanceInvoice | null>(null)
    const [message, setMessage] = useState('')
    const [expense, setExpense] = useState({ expense_date: dayjs().format('YYYY-MM-DD'), category: '', description: '', amount: '' })
    const [savingExpense, setSavingExpense] = useState(false)
    const [savingShare, setSavingShare] = useState<string | null>(null)
    const [shareEdits, setShareEdits] = useState<Record<string, string>>({})

    const { data, error, isLoading, mutate } = useSWR(
        agencySlug && month ? ['agency-finance', agencySlug, month] : null,
        () => getFinanceOverview(agencySlug, month),
    )
    const { data: shareData, mutate: mutateShares } = useSWR(
        agencySlug && view === 'shares' ? ['agency-finance-shares', agencySlug] : null,
        () => getFinanceShares(agencySlug),
    )
    const report = data?.data
    const currencies = useMemo(() => Array.from(new Set([
        'OMR',
        ...(report?.totals.map((row) => row.currency) ?? []),
        ...(report?.expense_totals.map((row) => row.currency) ?? []),
    ])), [report])
    const totals = report?.totals.find((row) => row.currency === currency)
    const expenses = report?.expense_totals.find((row) => row.currency === currency)
    const net = amount(totals?.agency_share) - amount(expenses?.total)
    const money = (value: string | number | null | undefined) =>
        `${new Intl.NumberFormat(numberLocale(i18n.language), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount(value))} ${currency}`
    const digits = (value: string | number | null | undefined) => localizeDigits(value, i18n.language)
    const tabs: View[] = ['overview', 'invoices', 'members', 'shares', 'expenses']

    const saveExpense = async () => {
        setMessage('')
        const parsed = Number(expense.amount)
        if (!expense.category.trim() || !expense.description.trim() || !Number.isFinite(parsed) || parsed <= 0) {
            setMessage(t('agencyFinance.invalidExpense'))
            return
        }
        setSavingExpense(true)
        try {
            await addFinanceExpense(agencySlug, { ...expense, amount: parsed, category: expense.category.trim(), description: expense.description.trim(), currency })
            setExpense({ ...expense, category: '', description: '', amount: '' })
            await mutate()
            setMessage(t('agencyFinance.expenseSaved'))
        } catch { setMessage(t('agencyFinance.saveError')) }
        finally { setSavingExpense(false) }
    }

    const saveShare = async (row: FinanceShare) => {
        const key = `${row.service_id}:${row.member_id}`
        const percent = Number(shareEdits[key] ?? row.member_percent ?? 0)
        if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
            setMessage(t('agencyFinance.invalidPercent'))
            return
        }
        setSavingShare(key)
        setMessage('')
        try {
            await saveFinanceShare(agencySlug, { service_id: row.service_id, member_id: row.member_id, member_percent: percent })
            await mutateShares()
            setMessage(t('agencyFinance.shareSaved'))
        } catch { setMessage(t('agencyFinance.saveError')) }
        finally { setSavingShare(null) }
    }

    return <main className="space-y-6 pb-10" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <header className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10 md:p-9 dark:bg-slate-950">
            <div aria-hidden="true" className="pointer-events-none absolute -end-20 -top-28 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 end-10 h-1 w-48 bg-teal-400" />
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold tracking-wide text-teal-200"><TbReceipt size={16} /> {t('agencyFinance.eyebrow')}</div>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t('agencyFinance.title')}</h1>
                    <p className="mt-2 max-w-xl text-sm text-slate-300">{t('agencyFinance.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <label className="text-xs font-medium text-slate-300"><span className="inline-flex items-center gap-1.5">{t('agencyFinance.month')}<InfoTip helpKey="month" className="!text-slate-400 hover:!text-teal-300" /></span>
                        <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="mt-1 bg-white text-slate-900" />
                    </label>
                    <label className="text-xs font-medium text-slate-300"><span className="inline-flex items-center gap-1.5">{t('agencyFinance.currency')}<InfoTip helpKey="currency" className="!text-slate-400 hover:!text-teal-300" /></span>
                        <select className="mt-1 block h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                </div>
            </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-800" aria-label={t('agencyFinance.sections')}>
            {tabs.map((tab) => <button key={tab} type="button" onClick={() => { setView(tab); setMessage('') }} aria-current={view === tab ? 'page' : undefined}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 ${view === tab ? 'bg-slate-900 text-white shadow-sm dark:bg-teal-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                {t(`agencyFinance.tabs.${tab}`)}
            </button>)}
        </nav>

        {message && <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100">{message}</div>}
        {error && <Card><p role="alert" className="text-red-600">{t('agencyFinance.loadError')}</p></Card>}
        {isLoading && <div className="flex justify-center py-12"><Spinner /></div>}

        {report && view === 'overview' && <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label={t('agencyFinance.revenue')} help="revenue" value={money(totals?.revenue)} hint={t('agencyFinance.issuedHint')} icon={<TbArrowUpRight size={22} />} tone="teal" />
                <Metric label={t('agencyFinance.collected')} help="collected" value={money(totals?.collected)} hint={t('agencyFinance.collectedHint')} icon={<TbReceipt size={22} />} tone="blue" />
                <Metric label={t('agencyFinance.expenses')} help="expenses" value={money(expenses?.total)} hint={t('agencyFinance.expenseHint')} icon={<TbArrowDownRight size={22} />} tone="rose" />
                <Metric label={t('agencyFinance.net')} help="net" value={money(net)} hint={t('agencyFinance.netHint')} icon={<TbChartBarIcon />} tone="slate" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
                <Card className="rounded-2xl"><h2 className="flex items-center gap-2 text-lg font-bold">{t('agencyFinance.flow')}<InfoTip helpKey="flow" /></h2><p className="mt-1 text-sm text-gray-500">{t('agencyFinance.flowHint')}</p>
                    <div className="mt-6 space-y-5">
                        <FlowRow label={t('agencyFinance.services')} help="services" value={money(amount(totals?.subtotal) - amount(totals?.discounts))} percent={100} color="bg-teal-500" />
                        <FlowRow label={t('agencyFinance.memberPayouts')} help="memberPayouts" value={money(totals?.member_payouts)} percent={amount(totals?.subtotal) ? amount(totals?.member_payouts) / amount(totals?.subtotal) * 100 : 0} color="bg-sky-500" />
                        <FlowRow label={t('agencyFinance.operatingExpenses')} help="operatingExpenses" value={money(expenses?.total)} percent={amount(totals?.subtotal) ? amount(expenses?.total) / amount(totals?.subtotal) * 100 : 0} color="bg-rose-400" />
                    </div>
                </Card>
                <Card className="rounded-2xl"><h2 className="flex items-center gap-2 text-lg font-bold">{t('agencyFinance.atGlance')}<InfoTip helpKey="atGlance" /></h2>
                    <div className="mt-5 divide-y divide-gray-100 dark:divide-gray-700">
                        <SummaryLine label={t('agencyFinance.invoicesIssued')} help="invoicesIssued" value={digits(totals?.invoices ?? 0)} />
                        <SummaryLine label={t('agencyFinance.discounts')} help="discounts" value={money(totals?.discounts)} />
                        <SummaryLine label={t('agencyFinance.taxes')} help="taxes" value={money(totals?.taxes)} />
                        <SummaryLine label={t('agencyFinance.agencyShare')} help="agencyShare" value={money(totals?.agency_share)} />
                        <SummaryLine label={t('agencyFinance.uncollected')} help="uncollected" value={money(amount(totals?.revenue) - amount(totals?.collected))} />
                    </div>
                </Card>
            </div>
        </>}

        {report && view === 'invoices' && <div className="space-y-5">
            <Card className="rounded-2xl"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-bold">{t('agencyFinance.readyToInvoice')}<InfoTip helpKey="readyToInvoice" /></h2><p className="text-sm text-gray-500">{t('agencyFinance.readyHint')}</p></div><TbFileInvoice className="text-teal-500" size={25} /></div>
                {report.awaiting_invoice.length === 0 ? <Empty text={t('agencyFinance.noPending')} /> : <div className="divide-y divide-gray-100 dark:divide-gray-700">{report.awaiting_invoice.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{row.service?.title} · {row.customer_name}</p><p className="text-xs text-gray-500">#{digits(row.id)} · {digits(row.date)} · {row.member?.name ?? '—'}</p></div><Button size="sm" variant="solid" onClick={() => setIssueReservationId(row.id)}>{t('agencyFinance.issue')}</Button></div>)}</div>}
            </Card>
            <Card className="rounded-2xl"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold">{t('agencyFinance.issuedInvoices')}<InfoTip helpKey="issuedInvoices" /></h2>
                {report.invoices.filter((row) => row.currency === currency).length === 0 ? <Empty text={t('agencyFinance.noInvoices')} /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="border-b text-gray-500"><tr><th className="py-3 text-start">{t('agencyFinance.invoice')}</th><th className="text-start">{t('agencyFinance.customer')}</th><th className="text-start">{t('agencyFinance.member')}</th><th className="text-start"><span className="inline-flex items-center gap-1.5">{t('agencyFinance.discount')}<InfoTip helpKey="invoiceDiscount" /></span></th><th className="text-start"><span className="inline-flex items-center gap-1.5">{t('agencyFinance.total')}<InfoTip helpKey="invoiceTotal" /></span></th><th className="text-start"><span className="inline-flex items-center gap-1.5">{t('agencyFinance.payment')}<InfoTip helpKey="payment" /></span></th><th /></tr></thead><tbody>{report.invoices.filter((row) => row.currency === currency).map((row) => <tr key={row.id} className="border-b border-gray-100 dark:border-gray-700"><td className="py-3 font-semibold">{row.number}<span className="block text-xs font-normal text-gray-500">{digits(row.issued_at.slice(0, 10))}</span></td><td>{row.customer_name}</td><td>{row.member?.name ?? '—'}</td><td>{money(row.discount)}</td><td className="font-semibold">{money(row.total)}</td><td><span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.payment_status === 'paid' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{t(`agencyFinance.${row.payment_status}`)}</span></td><td className="text-end"><Button size="xs" variant="plain" icon={<TbEye />} onClick={() => setViewInvoice(row)}>{t('agencyFinance.viewInvoice')}</Button></td></tr>)}</tbody></table></div>}
            </Card>
        </div>}

        {report && view === 'members' && <Card className="rounded-2xl"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-sky-50 p-2 text-sky-600 dark:bg-sky-900/30"><TbUsers size={24} /></span><div><h2 className="flex items-center gap-2 text-lg font-bold">{t('agencyFinance.memberReport')}<InfoTip helpKey="memberReport" /></h2><p className="text-sm text-gray-500">{t('agencyFinance.memberHint')}</p></div></div>
            {report.members.filter((row) => row.currency === currency).length === 0 ? <Empty text={t('agencyFinance.noMembers')} /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{report.members.filter((row) => row.currency === currency).map((row) => <div key={`${row.member_id ?? 'none'}:${row.currency}`} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-700 dark:bg-gray-800/50"><div className="mb-5 flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-bold text-slate-700 shadow-sm dark:bg-gray-700 dark:text-white">{(row.member_name ?? '—').slice(0, 1)}</div><span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">{digits(row.jobs)} {t('agencyFinance.jobs')}</span></div><h3 className="font-bold">{row.member_name ?? t('agencyFinance.unassigned')}</h3><div className="mt-3 space-y-2 text-sm"><SummaryLine label={t('agencyFinance.services')} help="services" value={money(row.net_services)} /><SummaryLine label={t('agencyFinance.discounts')} help="discounts" value={money(row.discounts)} /><SummaryLine label={t('agencyFinance.memberPayouts')} help="memberPayouts" value={money(row.member_payout)} /><SummaryLine label={t('agencyFinance.agencyShare')} help="agencyShare" value={money(row.agency_share)} /></div></div>)}</div>}
        </Card>}

        {view === 'shares' && <Card className="rounded-2xl"><h2 className="flex items-center gap-2 text-lg font-bold">{t('agencyFinance.shareRules')}<InfoTip helpKey="shareRules" /></h2><p className="mb-5 mt-1 text-sm text-gray-500">{t('agencyFinance.shareHint')}</p>
            {!shareData ? <Spinner /> : shareData.data.length === 0 ? <Empty text={t('agencyFinance.noShares')} /> : <div className="grid gap-3 lg:grid-cols-2">{shareData.data.map((row) => { const key = `${row.service_id}:${row.member_id}`; const value = shareEdits[key] ?? String(row.member_percent ?? 0); const agencyPercent = 100 - Number(value); return <div key={key} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700"><div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="font-bold">{row.service_name}</h3><p className="text-sm text-gray-500">{row.member_name}</p></div><span className="text-xs text-gray-400">#{digits(row.service_id)} · #{digits(row.member_id)}</span></div><div className="flex items-end gap-3"><label className="min-w-0 flex-1 text-xs font-semibold text-gray-500"><span className="inline-flex items-center gap-1.5">{t('agencyFinance.memberPercent')}<InfoTip helpKey="memberPercent" /></span><Input type="number" min="0" max="100" step="0.01" value={value} onChange={(event) => setShareEdits((previous) => ({ ...previous, [key]: event.target.value }))} className="mt-1" /></label><span className="inline-flex items-center gap-1.5 pb-3 text-sm text-gray-500">{t('agencyFinance.agencyPercent')}: {Number.isFinite(agencyPercent) ? digits(agencyPercent.toFixed(2)) : '—'}{i18n.language === 'ar' ? '٪' : '%'}<InfoTip helpKey="agencyPercent" /></span><Button size="sm" variant="solid" loading={savingShare === key} onClick={() => saveShare(row)}>{t('agencyFinance.save')}</Button></div><div className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"><div className="bg-teal-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }} /></div></div> })}</div>}
        </Card>}

        {report && view === 'expenses' && <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><Card className="rounded-2xl"><div className="mb-4 flex items-center gap-2"><TbPlus className="text-teal-500" size={22} /><h2 className="text-lg font-bold">{t('agencyFinance.addExpense')}</h2><InfoTip helpKey="addExpense" /></div><div className="space-y-4">
            <label className="block text-sm">{t('agencyFinance.date')}<Input type="date" value={expense.expense_date} onChange={(event) => setExpense({ ...expense, expense_date: event.target.value })} className="mt-1" /></label>
            <label className="block text-sm"><span className="inline-flex items-center gap-1.5">{t('agencyFinance.category')}<InfoTip helpKey="category" /></span><Input value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} className="mt-1" /></label>
            <label className="block text-sm">{t('agencyFinance.description')}<Input value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} className="mt-1" /></label>
            <label className="block text-sm">{t('agencyFinance.amount')} ({currency})<Input type="number" min="0.01" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} className="mt-1" /></label>
            <Button variant="solid" loading={savingExpense} onClick={saveExpense}>{t('agencyFinance.saveExpense')}</Button>
        </div></Card><Card className="rounded-2xl"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold">{t('agencyFinance.expenseLedger')}<InfoTip helpKey="expenseLedger" /></h2>{report.expenses.filter((row) => row.currency === currency).length === 0 ? <Empty text={t('agencyFinance.noExpenses')} /> : <div className="divide-y divide-gray-100 dark:divide-gray-700">{report.expenses.filter((row) => row.currency === currency).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{row.description}</p><p className="text-xs text-gray-500">{row.category} · {digits(row.expense_date)}</p></div><span className="font-bold text-rose-600 dark:text-rose-400">−{money(row.amount)}</span></div>)}</div>}</Card></div>}

        <Dialog isOpen={issueReservationId !== null} onClose={() => setIssueReservationId(null)} width={780}>
            {issueReservationId !== null && <div className="max-h-[80vh] overflow-y-auto p-2"><h2 className="text-lg font-bold">{t('agencyFinance.issue')} #{digits(issueReservationId)}</h2><ReservationInvoicePanel agencySlug={agencySlug} reservationId={issueReservationId} onIssued={() => mutate()} /><div className="mt-5 text-end"><Button onClick={() => setIssueReservationId(null)}>{t('agencyFinance.close')}</Button></div></div>}
        </Dialog>

        <Dialog isOpen={viewInvoice !== null} width={960} onClose={() => setViewInvoice(null)}>
            {viewInvoice && <InvoiceViewer agencySlug={agencySlug} reservationId={viewInvoice.reservation_id} summary={viewInvoice} />}
        </Dialog>
    </main>
}

function TbChartBarIcon() { return <TbArrowUpRight size={22} /> }
function Metric({ label, help, value, hint, icon, tone }: { label: string; help?: string; value: string; hint: string; icon: React.ReactNode; tone: 'teal' | 'blue' | 'rose' | 'slate' }) {
    const colors = { teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300', blue: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300', slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' }
    return <Card className="rounded-2xl"><div className="flex items-start justify-between gap-2"><p className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">{label}{help && <InfoTip helpKey={help} />}</p><span className={`rounded-xl p-2 ${colors[tone]}`}>{icon}</span></div><p className="mt-4 text-2xl font-bold tabular-nums tracking-tight">{value}</p><p className="mt-1 text-xs text-gray-500">{hint}</p></Card>
}
function FlowRow({ label, help, value, percent, color }: { label: string; help?: string; value: string; percent: number; color: string }) { return <div><div className="mb-2 flex justify-between text-sm"><span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">{label}{help && <InfoTip helpKey={help} />}</span><strong className="tabular-nums">{value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div></div> }
function SummaryLine({ label, help, value }: { label: string; help?: string; value: string }) { return <div className="flex justify-between gap-4 py-3 text-sm"><span className="flex items-center gap-1.5 text-gray-500">{label}{help && <InfoTip helpKey={help} />}</span><strong className="tabular-nums">{value}</strong></div> }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-700">{text}</div> }

