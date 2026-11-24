function csvCell(value: string | number) {
  const text = String(value)
  const safe = typeof value === 'string' && /^(?:[\t\r\n]|\s*[=+@-])/.test(text) ? "'" + text : text
  return '"' + safe.replaceAll('"', '""') + '"'
}

export function toCsv(rows: readonly (readonly (string | number)[])[]) {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export function downloadFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function downloadCsv(csv: string, name: string) {
  downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), name)
}
