export function formatMoney(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

export function formatNumber(value: number) {
  return value.toLocaleString('zh-CN')
}
