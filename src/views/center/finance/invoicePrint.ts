const fontFace = (weight: number, file: string) => `@font-face{font-family:"Kook";src:url("${window.location.origin}/fonts/kook/${file}.woff2") format("woff2");font-weight:${weight};font-display:block}`

/** Self-contained styles so the on-screen preview and the printed PDF look identical. */
export const invoiceStyles = () => `
${fontFace(400, 'Kook-Regular')}${fontFace(500, 'Kook-Medium')}${fontFace(700, 'Kook-Bold')}${fontFace(800, 'Kook-ExtraBold')}
.ohinv{--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--soft:#f8fafc;--teal:#0d9488;--teal-soft:#ccfbf1;
  box-sizing:border-box;width:100%;max-width:794px;min-height:1080px;margin:0 auto;background:#fff;color:var(--ink);
  font-family:"Kook",system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;font-size:12.5px;line-height:1.55;
  display:flex;flex-direction:column;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ohinv *{box-sizing:border-box}
html[lang] .ohinv,html[lang] .ohinv *{font-family:"Kook",system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif!important}
.ohinv-bar{height:8px;background:linear-gradient(90deg,#0f172a 0%,#0f766e 55%,#2dd4bf 100%)}
.ohinv-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:36px 44px 26px}
.ohinv-brand{display:flex;align-items:center;gap:14px}
.ohinv-mark{width:54px;height:54px;border-radius:16px;background:var(--ink);color:#5eead4;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;box-shadow:inset 0 -4px 0 #0d9488}
.ohinv-agency{font-size:19px;font-weight:800;letter-spacing:-.01em}
.ohinv-muted{color:var(--muted);font-size:11.5px}
.ohinv-title{text-align:end}
.ohinv-title-l1{font-size:34px;font-weight:800;line-height:1.05;letter-spacing:.02em;text-transform:uppercase}
.ohinv-title-l2{font-size:18px;font-weight:500;color:var(--teal);margin-top:2px}
.ohinv-status{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:4px 11px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
.ohinv-status i{width:7px;height:7px;border-radius:50%;background:currentColor}
.ohinv-status-paid{background:#ccfbf1;color:#0f766e}
.ohinv-status-unpaid{background:#fef3c7;color:#b45309}
.ohinv-meta{display:grid;grid-template-columns:repeat(4,1fr);margin:0 44px;border:1px solid var(--line);border-radius:14px;background:var(--soft);overflow:hidden}
.ohinv-meta>div{padding:12px 16px;display:flex;flex-direction:column;gap:4px}
.ohinv-meta>div+div{border-inline-start:1px solid var(--line)}
.ohinv-meta strong{font-size:13px;font-weight:700}
.ohinv-bi{display:flex;flex-direction:column;align-items:flex-start;line-height:1.25}
.ohinv-l1{font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.ohinv-l2{font-size:10px;color:#94a3b8;font-weight:500}
.ohinv-l1[lang=ar]{letter-spacing:0;text-transform:none;font-size:11.5px}
.ohinv-l2[lang=ar]{font-size:11px}
.ohinv-parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:22px 44px 6px}
.ohinv-party{padding:16px 18px;border-radius:14px;border:1px solid var(--line);position:relative}
.ohinv-party:first-child{border-inline-start:4px solid var(--teal)}
.ohinv-caption{margin-bottom:8px}
.ohinv-party-name{font-size:16px;font-weight:700;margin-bottom:2px}
.ohinv-items{width:calc(100% - 88px);margin:22px 44px 0;border-collapse:separate;border-spacing:0}
.ohinv-items thead th{background:var(--ink);padding:11px 12px;text-align:start;vertical-align:bottom;font-weight:700}
.ohinv-items thead th:first-child{border-start-start-radius:12px;border-end-start-radius:12px}
.ohinv-items thead th:last-child{border-start-end-radius:12px;border-end-end-radius:12px}
.ohinv-items thead .ohinv-l1{color:#fff}
.ohinv-items thead .ohinv-l2{color:#5eead4}
.ohinv-items thead th.ohinv-c-idx{color:#5eead4}
.ohinv-items tbody td{padding:13px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.ohinv-items tbody tr:nth-child(even) td{background:#fbfdfe}
.ohinv-items tr{break-inside:avoid}
.ohinv-c-idx{width:42px;color:#94a3b8;font-weight:700}
.ohinv-c-num{text-align:end!important;white-space:nowrap;font-variant-numeric:tabular-nums}
.ohinv-c-num .ohinv-bi{align-items:flex-end}
.ohinv-strong{font-weight:700}
.ohinv-desc-l1{font-weight:700;font-size:13px}
.ohinv-desc-l2{color:var(--muted);font-size:12px;margin-top:2px}
.ohinv-summary{display:grid;grid-template-columns:1fr 300px;gap:28px;padding:22px 44px 28px;break-inside:avoid}
.ohinv-notes{display:flex;flex-direction:column;gap:14px}
.ohinv-note .ohinv-status{margin-top:0}
.ohinv-link{display:block;color:var(--teal);font-size:11px;word-break:break-all;text-align:left}
.ohinv[dir=rtl] .ohinv-link{text-align:right}
.ohinv-totals{display:flex;flex-direction:column}
.ohinv-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px dashed var(--line);font-variant-numeric:tabular-nums;font-weight:600}
.ohinv-grand{margin-top:12px;padding:16px 18px;border-radius:14px;background:var(--ink);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:inset 0 -4px 0 #14b8a6}
.ohinv-grand .ohinv-l1{color:#fff;font-size:12px}
.ohinv-grand .ohinv-l2{color:#5eead4}
.ohinv-grand>span:last-child{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}
.ohinv-grand small{font-size:11px;font-weight:600;color:#99f6e4;margin-inline-end:2px}
.ohinv-foot{margin-top:auto;padding:28px 44px 30px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;border-top:1px solid var(--line);margin-inline:0;background:linear-gradient(180deg,#fff 0%,var(--soft) 100%)}
.ohinv-thanks{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:15px;font-weight:700;color:var(--teal);margin-bottom:6px}
.ohinv-foot p{margin:0}
.ohinv-via{display:flex;flex-direction:column;align-items:flex-end;gap:4px;color:#94a3b8;font-size:10px;white-space:nowrap}
.ohinv-via img{height:22px;width:auto}
@media screen and (max-width:640px){
  .ohinv{min-height:0;font-size:12px}
  .ohinv-head{flex-direction:column;padding:26px 20px 18px}.ohinv-title{text-align:start}
  .ohinv-meta{grid-template-columns:1fr 1fr;margin:0 20px}.ohinv-meta>div:nth-child(3){border-inline-start:0}
  .ohinv-meta>div:nth-child(n+3){border-top:1px solid var(--line)}
  .ohinv-parties,.ohinv-summary{grid-template-columns:1fr;padding-inline:20px}
  .ohinv-items{width:calc(100% - 40px);margin-inline:20px}.ohinv-items .ohinv-c-idx{display:none}
  .ohinv-foot{flex-direction:column;align-items:flex-start;padding-inline:20px}.ohinv-via{align-items:flex-start}
}
@page{size:A4;margin:0}
@media print{
  html,body{margin:0;padding:0;background:#fff}
  .ohinv{width:210mm;max-width:none;min-height:296mm}
}
`

/**
 * Prints the rendered invoice from an isolated iframe so the browser's
 * "Save as PDF" produces an A4 file with correct Arabic shaping.
 */
export function printInvoice(node: HTMLElement, title: string) {
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
    document.body.appendChild(frame)
    const doc = frame.contentDocument
    const win = frame.contentWindow
    if (!doc || !win) {
        frame.remove()
        return Promise.reject(new Error('Print frame unavailable'))
    }
    const safeTitle = title.replace(/[\\/:*?"<>|]+/g, '-')
    doc.open()
    doc.write(`<!doctype html><html lang="${node.lang}" dir="${node.dir}"><head><meta charset="utf-8"><title>${safeTitle}</title><style>${invoiceStyles()}</style></head><body>${node.outerHTML}</body></html>`)
    doc.close()

    const images = Array.from(doc.images).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.onload = image.onerror = () => resolve() }))
    const previousTitle = document.title
    const fonts = [400, 500, 700, 800].map((weight) => doc.fonts.load(`${weight} 16px "Kook"`, 'Invoice فاتورة ٠١٢٣٤٥٦٧٨٩').catch(() => []))
    return Promise.all([...fonts, ...images]).then(() => doc.fonts.ready).then(() => new Promise<void>((resolve) => {
        const cleanup = () => {
            document.title = previousTitle
            frame.remove()
            resolve()
        }
        // Chrome names the saved PDF after the top-level title.
        document.title = safeTitle
        win.addEventListener('afterprint', () => window.setTimeout(cleanup, 100), { once: true })
        win.focus()
        win.print()
        // Fallback for browsers that never fire afterprint.
        window.setTimeout(() => { if (frame.isConnected) cleanup() }, 60_000)
    }))
}
