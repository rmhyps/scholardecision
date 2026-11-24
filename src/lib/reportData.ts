import { candidateDemoProfile } from '../data/candidateDemoProfiles'
import type { BordaResult, BordaStatus, Candidate } from '../types'

export const institution = [
  'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI',
  'UNIVERSITAS NUSANTARA CENDEKIA',
  'Biro Kemahasiswaan',
] as const

export const reportTitle = 'BERITA ACARA HASIL KONSENSUS BORDA SELEKSI BEASISWA'
export const reportNotice = 'SIMULASI AKADEMIK - UNTUK DEMONSTRASI'
export const reportStatusLabels: Record<BordaStatus, string> = {
  lolos: 'Direkomendasikan',
  cadangan: 'Cadangan',
  'perlu-penyelesaian-seri': 'Menunggu penyelesaian seri',
}

const concordanceNumber = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

export function concordanceLabel(value: number | null) {
  return value === null ? 'Tidak terdefinisi' : concordanceNumber.format(value)
}

export function toReportRows(alternatives: readonly Candidate[], borda: BordaResult | null) {
  const candidates = new Map(alternatives.map((candidate) => [candidate.id, candidate]))
  return (borda?.rankings ?? []).flatMap((ranking) => {
    const candidate = candidates.get(ranking.alternativeId)
    if (!candidate) return []
    const profile = candidateDemoProfile(candidate)
    return [{
      code: candidate.id,
      rank: ranking.rank,
      name: candidate.name,
      nim: profile.nim,
      program: profile.program,
      ipk: candidate.referenceScores.C1,
      points: ranking.totalPoints,
      status: ranking.status,
    }]
  })
}

export type ReportRows = ReturnType<typeof toReportRows>

function csvCell(value: string | number) {
  const text = String(value)
  const safe = typeof value === 'string' && /^[=+@\t\r-]/.test(text) ? "'" + text : text
  return '"' + safe.replaceAll('"', '""') + '"'
}

export function reportCsv(rows: ReportRows, number: string, approved: boolean) {
  const headings = ['Peringkat', 'Kode', 'Nama', 'NIM Simulasi', 'Program Studi Simulasi', 'IPK', 'Poin Borda', 'Status Rekomendasi', 'Nomor Berita Acara', 'Status Dokumen']
  const records = rows.map(({ rank, code, name, nim, program, ipk, points, status }) => [
    rank, code, name, nim, program, ipk, points, reportStatusLabels[status], number, approved ? 'Disahkan - Simulasi' : 'Draf - Simulasi',
  ])
  return '\uFEFF' + [headings, ...records].map((row) => row.map(csvCell).join(',')).join('\r\n')
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
