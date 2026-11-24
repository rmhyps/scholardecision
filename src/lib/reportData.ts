import { candidateDemoProfile } from '../data/candidateDemoProfiles.ts'
import { toCsv } from './csv.ts'
import type { TopsisByEvaluator } from './selectionWorkflow'
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

export function reportCsv(rows: ReportRows, number: string, approved: boolean, topsis: TopsisByEvaluator) {
  const headings = [
    'Peringkat', 'Kode', 'Nama', 'NIM', 'Program Studi', 'IPK', 'Poin Borda', 'Status Kuota',
    'TOPSIS Kemahasiswaan', 'TOPSIS Dosen Wali', 'TOPSIS Pengelola Beasiswa',
    'Nomor Berita Acara', 'Status Dokumen',
  ]
  const preferences = (result: TopsisByEvaluator[keyof TopsisByEvaluator]) =>
    new Map(result?.rankings.map(({ alternativeId, preference }) => [alternativeId, preference]))
  const academic = preferences(topsis['dosen-wali'])
  const financial = preferences(topsis['pengelola-beasiswa'])
  const studentAffairs = preferences(topsis.kemahasiswaan)
  const records = rows.map(({ rank, code, name, nim, program, ipk, points, status }) => [
    rank, code, name, nim, program, ipk, points, reportStatusLabels[status],
    studentAffairs.get(code) ?? '', academic.get(code) ?? '', financial.get(code) ?? '',
    number, approved ? 'Disahkan - Simulasi' : 'Draf - Simulasi',
  ])
  return toCsv([headings, ...records])
}
