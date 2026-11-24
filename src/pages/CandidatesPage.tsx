import { ClipboardCheck, Eye, RotateCcw, Search, TrendingUp, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EvaluationHeading, fieldStyle } from '../components/ui/EvaluationUi'
import { MetricCard } from '../components/ui/MetricCard'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { candidateDemoProfile } from '../data/candidateDemoProfiles'
import { criterionLabels, formatIDR, formatIPK, formatScore } from '../lib/gdssFormat'
import { useGDSS } from '../state/GDSSContext'
import type { Candidate, CriterionId } from '../types'

function formatProfileScore(criterion: CriterionId, value: number) {
  if (criterion === 'C1') return formatIPK(value)
  if (criterion === 'C2') return formatIDR(value)
  return formatScore(value)
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return <Badge tone={verified ? 'active' : 'warning'}>{verified ? 'Terverifikasi' : 'Menunggu'}</Badge>
}

export function CandidatesPage() {
  const { dataset: { alternatives, criteria }, sessions } = useGDSS()
  const [search, setSearch] = useState('')
  const [semester, setSemester] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<Candidate | null>(null)
  const rows = alternatives.map((candidate) => ({ candidate, ...candidateDemoProfile(candidate) }))
  const semesters = [...new Set(rows.map(({ candidate }) => candidate.referenceScores.C5))].sort((a, b) => a - b)
  const query = search.trim().toLocaleLowerCase('id-ID')
  const filtered = rows.filter(({ candidate, verified }) => (
    (!query || `${candidate.id} ${candidate.name}`.toLocaleLowerCase('id-ID').includes(query))
    && (!semester || candidate.referenceScores.C5 === Number(semester))
    && (!status || verified === (status === 'verified'))
  ))
  const averageIPK = alternatives.reduce((sum, candidate) => sum + candidate.referenceScores.C1, 0) / alternatives.length
  const readyCount = alternatives.filter(({ id }) => Object.values(sessions).every(({ scores }) =>
    criteria.every((criterion) => Number.isFinite(scores[id]?.[criterion.id])),
  )).length
  const verifiedCount = rows.filter(({ verified }) => verified).length
  const selectedProfile = selected && candidateDemoProfile(selected)

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Data Calon Mahasiswa" description="Telusuri profil kandidat dan pantau kesiapan matriks penilaian." />
      <dl className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total Kandidat" value={alternatives.length} icon={UsersRound} detail={`${verifiedCount} terverifikasi dalam simulasi`} />
        <MetricCard label="Rata-rata IPK" value={formatIPK(averageIPK)} icon={TrendingUp} detail="Skala 4,00" />
        <MetricCard label="Kesiapan Matriks" value={`${readyCount} / ${alternatives.length}`} icon={ClipboardCheck} tone="navy" detail="Nilai lengkap untuk ketiga penilai" />
      </dl>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] xl:items-end">
          <label className="grid gap-1 text-sm font-medium">
            Cari kandidat
            <span className="relative">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input type="search" className={`${fieldStyle} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama atau kode kandidat" />
            </span>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Semester
            <select className={fieldStyle} value={semester} onChange={(event) => setSemester(event.target.value)}>
              <option value="">Semua semester</option>
              {semesters.map((value) => <option key={value} value={value}>Semester {value}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Status verifikasi
            <select className={fieldStyle} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Semua status</option>
              <option value="verified">Terverifikasi</option>
              <option value="pending">Menunggu</option>
            </select>
          </label>
          <Button variant="secondary" onClick={() => { setSearch(''); setSemester(''); setStatus('') }} className="self-end">
            <RotateCcw size={16} aria-hidden="true" /> Reset Filter
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">NIM, program studi, dan status verifikasi pada halaman ini adalah data simulasi.</p>
      </div>

      <Table caption="Daftar calon mahasiswa" className="min-w-[61rem] tabular-nums">
        <thead>
          <tr>
            {['Kode', 'Nama Mahasiswa', 'NIM', 'Program Studi', 'IPK', 'Penghasilan', 'Tanggungan', 'Prestasi', 'Semester', 'Aksi'].map((label) =>
              <th key={label} scope="col" className="whitespace-nowrap">{label}</th>,
            )}
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ candidate, nim, program, verified }) => (
            <tr key={candidate.id} className="even:bg-slate-50">
              <th scope="row" className="whitespace-nowrap text-navy-950">{candidate.id}</th>
              <td className="min-w-40">
                <span className="mb-1.5 block font-medium">{candidate.name}</span>
                <VerificationBadge verified={verified} />
              </td>
              <td className="whitespace-nowrap">{nim}</td>
              <td>{program}</td>
              {criteria.map(({ id }) => <td key={id} className="whitespace-nowrap text-right">{formatProfileScore(id, candidate.referenceScores[id])}</td>)}
              <td>
                <Button variant="ghost" aria-label={`Detail ${candidate.name}`} aria-haspopup="dialog" onClick={() => setSelected(candidate)}>
                  <Eye size={17} aria-hidden="true" /> Detail
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p role="status" className="text-sm text-slate-700">
        {filtered.length ? `Menampilkan ${filtered.length} dari ${rows.length} kandidat.` : 'Tidak ada kandidat yang cocok dengan pencarian dan filter.'}
      </p>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.name ?? 'Detail kandidat'}>
        {selected && selectedProfile && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-600">Kode</dt><dd className="font-semibold">{selected.id}</dd></div>
            <div><dt className="text-slate-600">NIM simulasi</dt><dd className="font-semibold">{selectedProfile.nim}</dd></div>
            <div><dt className="text-slate-600">Program studi simulasi</dt><dd className="font-semibold">{selectedProfile.program}</dd></div>
            <div><dt className="text-slate-600">Verifikasi simulasi</dt><dd className="mt-1"><VerificationBadge verified={selectedProfile.verified} /></dd></div>
            {criteria.map(({ id }) => (
              <div key={id}>
                <dt className="text-slate-600">{criterionLabels[id]}</dt>
                <dd className="font-semibold">{formatProfileScore(id, selected.referenceScores[id])}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  )
}
