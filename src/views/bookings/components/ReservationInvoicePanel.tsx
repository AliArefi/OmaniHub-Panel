import { useEffect, useState } from 'react'
import { Button, Input } from '@/components/ui'
import AxiosBase from '@/services/axios/AxiosBase'
import ApiService from '@/services/ApiService'

type Item = { description_en: string; description_ar: string; quantity: number; unit_price: string | number; total?: string }
type Draft = {
    customer_name: string
    customer_mobile: string
    agency_name: string
    currency: string
    discount: string | number
    tax: string | number
    payment_status: 'paid' | 'unpaid'
    items: Item[]
}
type Invoice = Draft & { number: string; total: string; guest_url?: string }

export default function ReservationInvoicePanel({ agencySlug, reservationId, onIssued }: {
    agencySlug: string
    reservationId: number
    onIssued: () => void
}) {
    const base = `/my-agencies/${encodeURIComponent(agencySlug)}/reservations/${reservationId}/invoice`
    const [draft, setDraft] = useState<Draft | null>(null)
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let active = true
        ApiService.fetchDataWithAxios<{ data: Invoice }>({ url: base })
            .then((response) => { if (active) setInvoice(response.data) })
            .catch(() => ApiService.fetchDataWithAxios<{ data: Draft }>({ url: `${base}/preview` })
                .then((response) => { if (active) setDraft(response.data) })
                .catch(() => { if (active) setError('Invoice is unavailable / الفاتورة غير متاحة') }))
        return () => { active = false }
    }, [base])

    const update = (field: keyof Draft, value: Draft[keyof Draft]) => setDraft((previous) => previous && ({ ...previous, [field]: value }))
    const updateItem = (index: number, field: keyof Item, value: string | number) => {
        if (!draft) return
        update('items', draft.items.map((item, position) => position === index ? { ...item, [field]: value } : item))
    }
    const subtotal = draft?.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0) ?? 0
    const total = subtotal - Number(draft?.discount ?? 0) + Number(draft?.tax ?? 0)

    const issue = async () => {
        if (!draft || draft.items.length === 0 || !Number.isFinite(total) || total < 0) {
            setError('Check invoice amounts / تحقق من المبالغ')
            return
        }
        setSaving(true)
        setError('')
        try {
            const response = await ApiService.fetchDataWithAxios<{ data: Invoice }>({ url: base, method: 'post', data: draft })
            setInvoice(response.data)
            onIssued()
        } catch {
            setError('Could not issue invoice / تعذر إصدار الفاتورة')
        } finally {
            setSaving(false)
        }
    }

    const openPdf = async () => {
        try {
            const response = await AxiosBase.get(`${base}/pdf`, { responseType: 'blob' })
            const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
            window.open(url, '_blank', 'noopener,noreferrer')
            window.setTimeout(() => URL.revokeObjectURL(url), 60000)
        } catch { setError('Could not open PDF / تعذر فتح الملف') }
    }

    return <section className="mt-5 space-y-3 border-t pt-4">
        <h4 className="text-base font-semibold">Invoice / الفاتورة</h4>
        {error && <p className="text-red-600">{error}</p>}
        {invoice ? <div className="space-y-2">
            <p>{invoice.number} · {invoice.total} {invoice.currency} · {invoice.payment_status}</p>
            <Button onClick={openPdf}>PDF / تحميل</Button>
            {invoice.guest_url && <div><label className="text-sm">Guest link / رابط العميل</label><Input readOnly value={invoice.guest_url} onFocus={(event) => event.target.select()} /></div>}
        </div> : draft && <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                {(['customer_name', 'customer_mobile', 'agency_name', 'currency'] as const).map((field) =>
                    <label key={field} className="text-sm">{field.replace('_', ' ')}<Input value={draft[field]} onChange={(event) => update(field, event.target.value)} /></label>)}
            </div>
            {draft.items.map((item, index) => <div key={index} className="grid grid-cols-2 gap-2 rounded border p-2">
                <label className="text-sm">Service (English)<Input value={item.description_en} onChange={(event) => updateItem(index, 'description_en', event.target.value)} /></label>
                <label className="text-sm" dir="rtl">الخدمة بالعربية<Input value={item.description_ar} onChange={(event) => updateItem(index, 'description_ar', event.target.value)} /></label>
                <label className="text-sm">Quantity / الكمية<Input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', Number(event.target.value))} /></label>
                <label className="text-sm">Unit price / سعر الوحدة<Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} /></label>
                <Button size="xs" onClick={() => update('items', draft.items.filter((_, position) => position !== index))}>Remove / حذف</Button>
            </div>)}
            <Button size="xs" onClick={() => update('items', [...draft.items, { description_en: '', description_ar: '', quantity: 1, unit_price: '0.00' }])}>Add item / إضافة بند</Button>
            <div className="grid grid-cols-2 gap-2">
                <label className="text-sm">Discount / الخصم<Input type="number" min="0" step="0.01" value={draft.discount} onChange={(event) => update('discount', event.target.value)} /></label>
                <label className="text-sm">Tax / الضريبة<Input type="number" min="0" step="0.01" value={draft.tax} onChange={(event) => update('tax', event.target.value)} /></label>
            </div>
            <p>Subtotal / المجموع: {subtotal.toFixed(2)} · Total / الإجمالي: {total.toFixed(2)} {draft.currency}</p>
            <label className="text-sm">Payment / الدفع <select className="rounded border p-2" value={draft.payment_status} onChange={(event) => update('payment_status', event.target.value as Draft['payment_status'])}><option value="unpaid">Unpaid / غير مدفوع</option><option value="paid">Paid / مدفوع</option></select></label>
            <div><Button variant="solid" loading={saving} onClick={issue}>Issue invoice / إصدار الفاتورة</Button></div>
        </div>}
    </section>
}
