import { ClipboardCheck, LockKeyhole, Save } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EvaluationHeading, EvaluatorRoleBanner, fieldStyle } from '../components/ui/EvaluationUi'
import { MetricCard } from '../components/ui/MetricCard'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { cn } from '../lib/cn'
import { criterionLabels, formatScore } from '../lib/gdssFormat'
import { useGDSS } from '../state/GDSSContext'
import { useSelection } from '../state/SelectionContext'
import type { CriterionDefinition, CriterionId, Evaluator } from '../types'

export type AssessmentDraft = {
  values: Record<string, Partial<Record<CriterionId, string>>>
  savedAt: Date | null
}

interface AssessmentFormPageProps {
  evaluator: Evaluator
  draft: AssessmentDraft
  updateDraft: (update: (previous: AssessmentDraft) => AssessmentDraft) => void
  hasUnsavedWeights: boolean
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

function scoreValid(text: string, { id, min, max }: CriterionDefinition) {
  const value = Number(text)
  if (!text.trim() || !Number.isFinite(value) || value < min || value > max) return false
  if (id !== 'C1') return Number.isInteger(value)
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-7
}

export function AssessmentFormPage({ evaluator, draft, updateDraft, hasUnsavedWeights }: AssessmentFormPageProps) {
  const { dataset: { alternatives, criteria }, sessions, weightValidation, setScore, lockEvaluation } = useGDSS()
  const { track } = useSelection()
  const session = sessions[evaluator.id]
  const locked = session.status === 'terkunci'
  const weightsValid = weightValidation[evaluator.id].valid
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState('')
  const matrix = alternatives.map((candidate) => {
    const cells = criteria.map((criterion) => {
      const value = draft.values[candidate.id]?.[criterion.id] ?? String(session.scores[candidate.id][criterion.id])
      return { criterion, value, valid: scoreValid(value, criterion) }
    })
    return { candidate, cells }
  })
  const complete = matrix.filter(({ cells }) => cells.every(({ valid }) => valid)).length
  const allComplete = alternatives.length > 0 && complete === alternatives.length
  const canLock = !locked && allComplete && weightsValid && !hasUnsavedWeights
  const hasEdits = alternatives.some(({ id }) => Object.keys(draft.values[id] ?? {}).length > 0)

  function editScore(candidateId: string, criterionId: CriterionId, value: string) {
    setMessage('')
    updateDraft((previous) => {
      const row = { ...previous.values[candidateId], [criterionId]: value }
      if (value === String(session.scores[candidateId][criterionId])) delete row[criterionId]
      return { ...previous, values: { ...previous.values, [candidateId]: row } }
    })
  }

  function save(lock: boolean) {
    if (locked || !allComplete || (lock && !canLock)) return
    for (const { candidate, cells } of matrix) {
      for (const { criterion, value } of cells) {
        const score = Number(value)
        if (score !== session.scores[candidate.id][criterion.id]) {
          setScore(evaluator.id, candidate.id, criterion.id, score)
        }
      }
    }
    if (lock) lockEvaluation(evaluator.id)
    else void track({ actor: evaluator.id, category: 'penilaian', action: 'Menyimpan draf penilaian',
      detail: 'Matriks ' + alternatives.length + ' kandidat disimpan pada sesi ini.', status: 'Draf' })
    updateDraft(() => ({ values: {}, savedAt: new Date() }))
    setConfirming(false)
    setMessage(lock ? 'Penilaian berhasil dikunci.' : 'Draf penilaian telah disimpan pada sesi ini.')
  }

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Form Penilaian Kandidat" description="Periksa dan isi matriks nilai untuk penilai aktif.">
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">Penilai: {evaluator.name}</Badge>
          <Badge tone={locked ? 'active' : 'warning'}>
            {locked && <LockKeyhole size={13} aria-hidden="true" />}
            {locked ? 'Terkunci' : 'Draf'}
          </Badge>
        </div>
      </EvaluationHeading>
      <EvaluatorRoleBanner evaluator={evaluator} />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
        <section className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-950 text-white"><LockKeyhole size={17} aria-hidden="true" /></span>
          <div>
            <h2 className="font-semibold text-navy-950">Integritas Penilaian</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {locked ? 'Sesi terkunci. Nilai dapat ditinjau dalam mode baca saja.' : 'Simpan draf untuk menerapkan nilai. Periksa semua kolom sebelum mengirim dan mengunci sesi.'}
            </p>
          </div>
        </section>
        <dl>
          <MetricCard label="Kelengkapan Matriks" value={`${complete} / ${alternatives.length}`} icon={ClipboardCheck} detail={allComplete ? 'Seluruh nilai sesuai rentang' : 'Periksa nilai yang ditandai'} />
        </dl>
      </div>

      <Table caption={`Matriks penilaian ${evaluator.name}`} className="min-w-[49rem]" stickyFirstColumn>
        <thead>
          <tr>
            <th scope="col">Kandidat</th>
            {criteria.map(({ id, unit, min, max }) => (
              <th key={id} scope="col">
                <span className="whitespace-nowrap">{id} {criterionLabels[id]}</span>
                <span className="mt-1 block text-xs font-normal text-slate-700">{unit} ({formatScore(min)} - {formatScore(max)})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map(({ candidate, cells }) => (
            <tr key={candidate.id} className="even:bg-slate-50">
              <th scope="row" className="w-32 text-navy-950 sm:w-40">
                <span className="mr-2"><Badge tone="info">{candidate.id}</Badge></span>
                <span className="break-words [overflow-wrap:anywhere]">{candidate.name}</span>
              </th>
              {cells.map(({ criterion, value, valid }) => {
                const errorId = `score-error-${candidate.id}-${criterion.id}`
                return (
                  <td key={criterion.id} className="w-32 align-top">
                    <input
                      type="number"
                      min={criterion.min}
                      max={criterion.max}
                      step={criterion.id === 'C1' ? '0.01' : '1'}
                      value={value}
                      readOnly={locked}
                      aria-label={`${candidate.id} ${criterionLabels[criterion.id]}`}
                      aria-invalid={!valid}
                      aria-describedby={valid ? undefined : errorId}
                      onChange={(event) => editScore(candidate.id, criterion.id, event.target.value)}
                      className={cn(fieldStyle, 'min-w-24 tabular-nums aria-[invalid=true]:border-orange-700 read-only:border-transparent read-only:bg-transparent')}
                    />
                    {!valid && <p id={errorId} className="mt-1 text-xs text-orange-900">{criterion.id === 'C1' ? 'Gunakan maksimal dua desimal' : 'Masukkan bilangan bulat'} dalam rentang {formatScore(criterion.min)} - {formatScore(criterion.max)}.</p>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        {!allComplete && <p role="alert" className="text-sm text-orange-900">Periksa nilai yang kosong atau tidak sesuai rentang.</p>}
        {!locked && (hasUnsavedWeights || !weightsValid) && <p className="text-sm text-orange-900">Simpan bobot yang valid sebelum mengunci penilaian.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {hasEdits ? 'Ada perubahan nilai yang belum disimpan.' : draft.savedAt ? `Terakhir disimpan: ${dateFormat.format(draft.savedAt)}` : 'Belum disimpan pada sesi ini.'}
          </p>
          {!locked && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => save(false)} disabled={!allComplete}><Save size={16} aria-hidden="true" /> Simpan Draf</Button>
              <Button onClick={() => setConfirming(true)} disabled={!canLock} aria-haspopup="dialog"><LockKeyhole size={16} aria-hidden="true" /> Kirim &amp; Kunci Penilaian</Button>
            </div>
          )}
        </div>
        {message && <p role="status" className="text-sm font-medium text-teal-900">{message}</p>}
      </div>

      <Modal open={confirming && !locked} onClose={() => setConfirming(false)} title="Konfirmasi Kunci Penilaian">
        <p className="text-sm leading-relaxed text-slate-700">Nilai dan bobot {evaluator.name} akan terkunci untuk sesi ini. Periksa kembali sebelum melanjutkan.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirming(false)}>Batal</Button>
          <Button onClick={() => save(true)} disabled={!canLock}><LockKeyhole size={16} aria-hidden="true" /> Kunci Penilaian</Button>
        </div>
      </Modal>
    </div>
  )
}
