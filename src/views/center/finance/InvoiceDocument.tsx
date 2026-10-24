import { forwardRef } from 'react'
import { localizeDigits } from './digits'

export type InvoiceDocumentItem = {
    description_en: string
    description_ar: string
    quantity: number | string
    unit_price: number | string
    total?: number | string
}

export type InvoiceDocumentData = {
    number: string
    reservation_id?: number
    issued_at?: string | null
    customer_name: string
    customer_mobile?: string | null
    agency_name?: string | null
    member_name?: string | null
    currency: string
    subtotal?: number | string | null
    discount?: number | string | null
    tax?: number | string | null
    total: number | string
    payment_status: 'paid' | 'unpaid'
    items: InvoiceDocumentItem[]
    guest_url?: string | null
}

type Lang = 'en' | 'ar'
type Pair = { en: string; ar: string }

const L = {
    invoice: { en: 'Invoice', ar: 'فاتورة' },
    number: { en: 'Invoice no.', ar: 'رقم الفاتورة' },
    issued: { en: 'Issue date', ar: 'تاريخ الإصدار' },
    reservation: { en: 'Reservation', ar: 'رقم الحجز' },
    currency: { en: 'Currency', ar: 'العملة' },
    billedTo: { en: 'Billed to', ar: 'فاتورة إلى' },
    issuedBy: { en: 'Issued by', ar: 'صادرة من' },
    mobile: { en: 'Mobile', ar: 'الجوال' },
    provider: { en: 'Service provider', ar: 'مقدم الخدمة' },
    item: { en: 'Description', ar: 'الوصف' },
    qty: { en: 'Qty', ar: 'الكمية' },
    unit: { en: 'Unit price', ar: 'سعر الوحدة' },
    amount: { en: 'Amount', ar: 'المبلغ' },
    subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
    discount: { en: 'Discount', ar: 'الخصم' },
    tax: { en: 'Tax', ar: 'الضريبة' },
    totalDue: { en: 'Total', ar: 'الإجمالي' },
    paid: { en: 'Paid', ar: 'مدفوعة' },
    unpaid: { en: 'Unpaid', ar: 'غير مدفوعة' },
    paymentStatus: { en: 'Payment status', ar: 'حالة الدفع' },
    onlineCopy: { en: 'Online copy', ar: 'النسخة الإلكترونية' },
    thanks: { en: 'Thank you for your trust.', ar: 'شكراً لثقتكم بنا.' },
    generated: { en: 'This invoice was generated electronically and is valid without a signature.', ar: 'صدرت هذه الفاتورة إلكترونياً وهي صالحة دون توقيع.' },
    via: { en: 'Issued via', ar: 'صادرة عبر' },
} satisfies Record<string, Pair>

const num = (value: number | string | null | undefined) => {
    const parsed = Number(value ?? 0)
    return Number.isFinite(parsed) ? parsed : 0
}

const currencyDigits = (currency: string) => {
    try {
        return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
    } catch {
        return 2
    }
}

const formatDate = (value: string | null | undefined, lang: Lang) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value.slice(0, 10)
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-OM-u-nu-arab' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

/** Both languages, the active UI language first. */
function Bi({ pair, primary, className = '' }: { pair: Pair; primary: Lang; className?: string }) {
    const secondary: Lang = primary === 'ar' ? 'en' : 'ar'
    return <span className={`ohinv-bi ${className}`}>
        <span className="ohinv-l1" lang={primary} dir={primary === 'ar' ? 'rtl' : 'ltr'}>{pair[primary]}</span>
        <span className="ohinv-l2" lang={secondary} dir={secondary === 'ar' ? 'rtl' : 'ltr'}>{pair[secondary]}</span>
    </span>
}

const InvoiceDocument = forwardRef<HTMLElement, { invoice: InvoiceDocumentData; lang: Lang }>(({ invoice, lang }, ref) => {
    const digits = currencyDigits(invoice.currency)
    const money = (value: number | string | null | undefined) =>
        new Intl.NumberFormat(lang === 'ar' ? 'ar-OM-u-nu-arab' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(num(value))
    const loc = (value: string | number) => localizeDigits(value, lang)
    const lineTotal = (item: InvoiceDocumentItem) => item.total ?? num(item.quantity) * num(item.unit_price)
    const subtotal = invoice.subtotal ?? invoice.items.reduce((sum, item) => sum + num(lineTotal(item)), 0)
    const agency = invoice.agency_name?.trim() || 'OmaniHub'
    const status = invoice.payment_status === 'paid' ? L.paid : L.unpaid

    return <article ref={ref} className="ohinv" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
        <div className="ohinv-bar" aria-hidden="true" />
        <header className="ohinv-head">
            <div className="ohinv-brand">
                <div className="ohinv-mark" aria-hidden="true">{agency.slice(0, 1).toUpperCase()}</div>
                <div>
                    <div className="ohinv-agency">{agency}</div>
                    {invoice.member_name && <div className="ohinv-muted">{L.provider[lang]}: {invoice.member_name}</div>}
                </div>
            </div>
            <div className="ohinv-title">
                <div className="ohinv-title-l1" lang={lang}>{L.invoice[lang]}</div>
                <div className="ohinv-title-l2" lang={lang === 'ar' ? 'en' : 'ar'}>{L.invoice[lang === 'ar' ? 'en' : 'ar']}</div>
                <span className={`ohinv-status ohinv-status-${invoice.payment_status}`}><i aria-hidden="true" />{status.en} · {status.ar}</span>
            </div>
        </header>

        <section className="ohinv-meta">
            <div><Bi pair={L.number} primary={lang} /><strong><bdi dir="ltr">{invoice.number}</bdi></strong></div>
            <div><Bi pair={L.issued} primary={lang} /><strong>{formatDate(invoice.issued_at, lang)}</strong></div>
            <div><Bi pair={L.reservation} primary={lang} /><strong><bdi dir="ltr">{invoice.reservation_id ? `#${loc(invoice.reservation_id)}` : '—'}</bdi></strong></div>
            <div><Bi pair={L.currency} primary={lang} /><strong><bdi dir="ltr">{invoice.currency}</bdi></strong></div>
        </section>

        <section className="ohinv-parties">
            <div className="ohinv-party">
                <Bi pair={L.billedTo} primary={lang} className="ohinv-caption" />
                <div className="ohinv-party-name">{invoice.customer_name || '—'}</div>
                {invoice.customer_mobile && <div className="ohinv-muted">{L.mobile[lang]} · <span dir="ltr">{invoice.customer_mobile}</span></div>}
            </div>
            <div className="ohinv-party">
                <Bi pair={L.issuedBy} primary={lang} className="ohinv-caption" />
                <div className="ohinv-party-name">{agency}</div>
                {invoice.member_name && <div className="ohinv-muted">{L.provider[lang]} · {invoice.member_name}</div>}
            </div>
        </section>

        <table className="ohinv-items">
            <thead>
                <tr>
                    <th className="ohinv-c-idx">#</th>
                    <th><Bi pair={L.item} primary={lang} /></th>
                    <th className="ohinv-c-num"><Bi pair={L.qty} primary={lang} /></th>
                    <th className="ohinv-c-num"><Bi pair={L.unit} primary={lang} /></th>
                    <th className="ohinv-c-num"><Bi pair={L.amount} primary={lang} /></th>
                </tr>
            </thead>
            <tbody>
                {invoice.items.map((item, index) => {
                    const lines = lang === 'ar'
                        ? [{ text: item.description_ar, lng: 'ar' }, { text: item.description_en, lng: 'en' }]
                        : [{ text: item.description_en, lng: 'en' }, { text: item.description_ar, lng: 'ar' }]
                    const [first, second] = lines.filter((line) => line.text?.trim())
                    return <tr key={index}>
                        <td className="ohinv-c-idx">{loc(String(index + 1).padStart(2, '0'))}</td>
                        <td>
                            {first && <div className="ohinv-desc-l1"><bdi lang={first.lng} dir={first.lng === 'ar' ? 'rtl' : 'ltr'}>{first.text}</bdi></div>}
                            {second && <div className="ohinv-desc-l2"><bdi lang={second.lng} dir={second.lng === 'ar' ? 'rtl' : 'ltr'}>{second.text}</bdi></div>}
                            {!first && '—'}
                        </td>
                        <td className="ohinv-c-num">{loc(num(item.quantity))}</td>
                        <td className="ohinv-c-num">{money(item.unit_price)}</td>
                        <td className="ohinv-c-num ohinv-strong">{money(lineTotal(item))}</td>
                    </tr>
                })}
            </tbody>
        </table>

        <section className="ohinv-summary">
            <div className="ohinv-notes">
                <div className="ohinv-note">
                    <Bi pair={L.paymentStatus} primary={lang} className="ohinv-caption" />
                    <span className={`ohinv-status ohinv-status-${invoice.payment_status}`}><i aria-hidden="true" />{status[lang]} · {status[lang === 'ar' ? 'en' : 'ar']}</span>
                </div>
                {invoice.guest_url && <div className="ohinv-note">
                    <Bi pair={L.onlineCopy} primary={lang} className="ohinv-caption" />
                    <span className="ohinv-link" dir="ltr">{invoice.guest_url}</span>
                </div>}
            </div>
            <div className="ohinv-totals">
                <div className="ohinv-row"><Bi pair={L.subtotal} primary={lang} /><span dir="ltr">{money(subtotal)}</span></div>
                <div className="ohinv-row"><Bi pair={L.discount} primary={lang} /><span dir="ltr">{num(invoice.discount) > 0 ? `− ${money(invoice.discount)}` : money(0)}</span></div>
                <div className="ohinv-row"><Bi pair={L.tax} primary={lang} /><span dir="ltr">{money(invoice.tax)}</span></div>
                <div className="ohinv-grand">
                    <Bi pair={L.totalDue} primary={lang} />
                    <span dir="ltr"><small>{invoice.currency}</small> {money(invoice.total)}</span>
                </div>
            </div>
        </section>

        <footer className="ohinv-foot">
            <div>
                <div className="ohinv-thanks"><span lang="en" dir="ltr">{L.thanks.en}</span><span lang="ar" dir="rtl">{L.thanks.ar}</span></div>
                <p className="ohinv-muted">{L.generated[lang]}</p>
                <p className="ohinv-muted"><bdi lang={lang === 'ar' ? 'en' : 'ar'} dir={lang === 'ar' ? 'ltr' : 'rtl'}>{L.generated[lang === 'ar' ? 'en' : 'ar']}</bdi></p>
            </div>
            <div className="ohinv-via"><span>{L.via[lang]}</span><img src={`${window.location.origin}/img/logo/logo-light-full.png`} alt="OmaniHub" /></div>
        </footer>
    </article>
})

InvoiceDocument.displayName = 'InvoiceDocument'

export default InvoiceDocument
