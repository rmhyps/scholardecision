import { CalendarDays, CheckCircle2, ClipboardCheck, Plus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EvaluationHeading, EvaluationPanel, fieldStyle } from '../components/ui/EvaluationUi'
import { MetricCard } from '../components/ui/MetricCard'
import { Table } from '../components/ui/Table'
import { WorkflowStepper } from '../components/ui/WorkflowStepper'
import { activePeriod, evaluators } from '../data/evaluators'
import { activePeriodCode, approvalSteps, periodExamples } from '../lib/selectionWorkflow'
import type { PeriodDraft } from '../lib/selectionWorkflow'
import { useGDSS } from '../state/GDSSContext'
import { useSelection } from '../state/SelectionContext'
import type { Evaluator } from '../types'

const periodSteps = ['Pendaftaran', 'Penilaian TOPSIS', 'Konsensus Borda', 'Pengesahan SK']
const emptyDraft = { code: '', name: '', startsOn: '', endsOn: '', quota: 2 }
const cycleTitle = 'Beasiswa Prestasi Akademik ' + activePeriod
const dateFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', dateStyle: 'medium' })

function dateLabel(value: string) {
  return dateFormat.format(new Date(value + 'T00:00:00Z'))
}

export function PeriodsPage({ evaluator }: { evaluator: Evaluator }) {
  const { quota, dataset, sessions } = useGDSS()
  const { phase, drafts, addDraft } = useSelection()
  const [draft, setDraft] = useState<PeriodDraft>(emptyDraft)
  const [reviewing, setReviewing] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const finished = evaluators.filter(({ id }) => sessions[id].status === 'terkunci').length
  const active = { code: activePeriodCode, name: cycleTitle, startsOn: '2025-10-01', endsOn: '2025-11-15', quota, status: 'Aktif' }
  const rows = [active, ...periodExamples, ...drafts.map((row) => ({ ...row, status: 'Draf' }))]

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!reviewing) {
      if (draft.startsOn > draft.endsOn) {
        setError('Tanggal selesai perlu sama dengan atau sesudah tanggal mulai.')
        return
      }
      setReviewing(true)
      return
    }
    try {
      addDraft(evaluator.id, draft)
      setNotice('Draf periode ' + draft.code.trim().toUpperCase() + ' telah disimpan.')
      setDraft(emptyDraft)
      setReviewing(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Draf gagal disimpan.')
      setReviewing(false)
    }
  }

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Manajemen Periode Seleksi Beasiswa" description="Pantau siklus penilaian aktif dan siapkan draf periode berikutnya." />
      <section className="space-y-4 rounded-xl bg-navy-950 p-5 text-white sm:p-6" aria-label="Periode berjalan aktif">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone="active">Periode Berjalan Aktif · {activePeriodCode}</Badge>
            <h2 className="mt-2 text-xl font-semibold">{cycleTitle}</h2>
            <p className="mt-2 text-sm text-slate-200">{dateLabel(active.startsOn)} - {dateLabel(active.endsOn)} · Kuota {quota} mahasiswa</p>
          </div>
          <div className="rounded-lg bg-navy-800 p-3 text-sm">
            <p className="text-slate-200">Status Evaluasi GDSS</p>
            <p className="mt-1 font-semibold text-teal-200">{approvalSteps[phase]}</p>
          </div>
        </div>
        <WorkflowStepper labels={periodSteps} current={Math.min(phase + 1, 3)} complete={phase === 3} dark />
      </section>
      <dl className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total Periode Tercatat" value={rows.length} icon={CalendarDays} />
        <MetricCard label="Penilai Selesai" value={finished + ' / 3'} icon={ClipboardCheck} />
        <MetricCard label="Kriteria Penilaian Aktif" value={dataset.criteria.length} icon={CheckCircle2} />
      </dl>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(17rem,1fr)] xl:items-start">
        <EvaluationPanel title="Daftar Siklus Periode" description="Siklus terdahulu dan mendatang merupakan contoh simulasi.">
          <Table caption="Daftar periode seleksi" className="min-w-[34rem]">
            <thead><tr>{['Kode', 'Nama Periode', 'Kuota', 'Rentang Waktu', 'Status'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.code} className={row.status === 'Aktif' ? 'bg-teal-50' : 'even:bg-slate-50'}>
                  <th scope="row" className="whitespace-nowrap">{row.code}</th>
                  <td className="min-w-32">{row.name}</td><td>{row.quota}</td>
                  <td className="min-w-28">{dateLabel(row.startsOn)} - {dateLabel(row.endsOn)}</td>
                  <td><Badge tone={row.status === 'Aktif' ? 'active' : row.status === 'Draf' ? 'warning' : 'info'}>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </EvaluationPanel>

        <EvaluationPanel title="Konfigurasi Cepat" description={reviewing ? 'Tinjau rincian draf.' : 'Buat draf siklus untuk periode berikutnya.'} action={<Badge tone="info">Langkah {reviewing ? 2 : 1} / 2</Badge>}>
          <form className="space-y-3" onSubmit={submit}>
            {reviewing ? (
              <dl className="space-y-1 rounded-lg bg-blue-50 p-3 text-sm">
                <dt className="font-semibold">{draft.code.toUpperCase()}</dt><dd>{draft.name}</dd>
                <dd>{dateLabel(draft.startsOn)} - {dateLabel(draft.endsOn)}</dd><dd>Kuota {draft.quota} mahasiswa</dd>
              </dl>
            ) : (
              <>
                <label className="grid gap-1 text-sm font-medium">Kode Periode<input className={fieldStyle} value={draft.code} placeholder="PRD-2026-2" required pattern="[A-Za-z0-9\-]{3,24}" onChange={(event) => setDraft({ ...draft, code: event.target.value })} /></label>
                <label className="grid gap-1 text-sm font-medium">Nama Periode<input className={fieldStyle} value={draft.name} required maxLength={110} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                <label className="grid gap-1 text-sm font-medium">Kuota Penerima<input className={fieldStyle} type="number" min={1} max={dataset.alternatives.length} required value={Number.isNaN(draft.quota) ? '' : draft.quota} onChange={(event) => setDraft({ ...draft, quota: event.target.valueAsNumber })} /></label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <label className="grid min-w-0 gap-1 text-sm font-medium">Tanggal Mulai<input className={fieldStyle} type="date" required value={draft.startsOn} onChange={(event) => setDraft({ ...draft, startsOn: event.target.value })} /></label>
                  <label className="grid min-w-0 gap-1 text-sm font-medium">Tanggal Selesai<input className={fieldStyle} type="date" required min={draft.startsOn || undefined} value={draft.endsOn} onChange={(event) => setDraft({ ...draft, endsOn: event.target.value })} /></label>
                </div>
              </>
            )}
            {error && <p role="alert" className="text-sm text-orange-900">{error}</p>}
            {notice && <p role="status" className="text-sm text-teal-900">{notice}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              {reviewing && <Button variant="secondary" onClick={() => setReviewing(false)}>Ubah Draf</Button>}
              <Button type="submit"><Plus size={17} aria-hidden="true" />{reviewing ? 'Simpan Draf Periode' : 'Tinjau Draf'}</Button>
            </div>
          </form>
        </EvaluationPanel>
      </div>
    </div>
  )
}
