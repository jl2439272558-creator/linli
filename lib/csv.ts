/** 解析 CSV 文本（支持引号包裹、字段内逗号/换行、转义双引号与 CRLF），返回矩阵 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((x) => x.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  row.push(field)
  if (row.some((x) => x.trim() !== '')) rows.push(row)
  return rows
}

/** CSV 有效数据行数（去掉表头与空行） */
export function csvDataRows(text: string): number {
  const rows = parseCsv(text)
  return Math.max(0, rows.length - 1)
}
