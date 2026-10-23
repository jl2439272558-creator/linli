import { brand } from '@/lib/brand'

export type ReceiptItem = { name: string; unit: string; price: number; quantity: number }

export type ReceiptData = {
  orderId: string
  createdAt: string
  cashier: string
  storeName: string
  items: ReceiptItem[]
  amount: number
  discount: number
  paid: number
  payMethod: string
  memberName?: string | null
  status?: string
  refunded?: number
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const money = (n: number) => `¥ ${n.toFixed(2)}`

/**
 * 打印销售小票：新开窗口渲染小票版式后调起浏览器打印（可选择实体打印机或另存 PDF）。
 * 打印窗口关闭或被拦截时给出提示。
 */
export function printReceipt(data: ReceiptData): boolean {
  const win = window.open('', '_blank', 'width=380,height=640')
  if (!win) {
    return false
  }
  const rows = data.items
    .map(
      (i) => `
      <tr>
        <td class="name">${esc(i.name)}</td>
        <td class="num">${money(i.price)} x ${i.quantity}</td>
        <td class="num">${money(i.price * i.quantity)}</td>
      </tr>`,
    )
    .join('')

  win.document.write(`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${esc(data.orderId)} 小票</title>
<style>
  @page { margin: 6mm; }
  * { box-sizing: border-box; }
  body {
    width: 72mm; margin: 0 auto; padding: 4mm 2mm;
    font: 12px/1.6 "Microsoft YaHei", "PingFang SC", sans-serif;
    color: #000; background: #fff;
  }
  h1 { margin: 0; font-size: 16px; text-align: center; letter-spacing: 2px; }
  .sub { text-align: center; font-size: 11px; color: #444; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .meta { font-size: 11px; }
  .meta div { display: flex; justify-content: space-between; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; font-size: 11px; }
  td.name { word-break: break-all; padding-right: 4px; }
  td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .total { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; }
  .foot { text-align: center; font-size: 11px; margin-top: 8px; }
  @media print { body { width: auto; } }
</style>
</head>
<body>
  <h1>${esc(brand.name)}</h1>
  <div class="sub">${esc(data.storeName)} · 销售小票</div>
  <div class="line"></div>
  <div class="meta">
    <div><span>单号</span><span>${esc(data.orderId)}</span></div>
    <div><span>时间</span><span>${esc(data.createdAt)}</span></div>
    <div><span>收银员</span><span>${esc(data.cashier)}</span></div>
    ${data.memberName ? `<div><span>会员</span><span>${esc(data.memberName)}</span></div>` : ''}
    ${data.status ? `<div><span>状态</span><span>${esc(data.status)}</span></div>` : ''}
  </div>
  <div class="line"></div>
  <table><tbody>${rows}</tbody></table>
  <div class="line"></div>
  <div class="meta">
    <div><span>应收</span><span>${money(data.amount)}</span></div>
    ${data.discount > 0 ? `<div><span>优惠</span><span>-${money(data.discount)}</span></div>` : ''}
    ${data.refunded ? `<div><span>已退款</span><span>${money(data.refunded)}</span></div>` : ''}
  </div>
  <div class="line"></div>
  <div class="total"><span>实收</span><span>${money(data.paid)}</span></div>
  <div class="meta" style="margin-top:6px"><div><span>支付方式</span><span>${esc(data.payMethod)}</span></div></div>
  <div class="line"></div>
  <div class="foot">谢谢惠顾，欢迎再次光临</div>
</body>
</html>`)
  win.document.close()
  win.focus()
  // 等待资源渲染后调起打印；打印完自动关闭窗口
  setTimeout(() => {
    win.print()
    win.close()
  }, 250)
  return true
}
