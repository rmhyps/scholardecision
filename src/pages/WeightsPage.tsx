import { LockKeyhole, RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { WeightDonut } from '../components/charts/EvaluationCharts'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CriterionBadge, EvaluationHeading, EvaluatorRoleBanner, EvaluationPanel, fieldStyle } from '../components/ui/EvaluationUi'
import { criterionLabels, formatWeight } from '../lib/gdssFormat'
import { useGDSS } from '../state/GDSSContext'
import type { CriterionId, CriterionVector, Evaluator } from '../types'

export type WeightDraft = Partial<Record<CriterionId, string>>

interface WeightsPageProps {
  evaluator: Evaluator
  draft: WeightDraft
  updateDraft: (update: (previous: WeightDraft) => WeightDraft) => void
}

function percentageText(weight: number) {
  return String(Math.round(weight * 10000) / 100)
}

function toHundredths(value: string) {
  const number = Number(value)
  const hundredths = Math.round(number * 100)
  if (!value.trim() || !Number.isFinite(number) || number < 0 || number > 100 || Math.abs(number * 100 - hundredths) > 1e-7) {
    return null
  }
  return hundredths
}

export function WeightsPage({ evaluator, draft, updateDraft }: WeightsPageProps) {
  const { dataset, sessions, setWeights } = useGDSS()
  const session = sessions[evaluator.id]
  const locked = session.status === 'terkunci'
  const [message, setMessage] = useState('')
  const fields = dataset.criteria.map((criterion) => {
    const text = draft[criterion.id] ?? percentageText(session.weights[criterion.id])
    return { criterion, text, hundredths: toHundredths(text) }
  })
  const total = fields.reduce((sum, { hundredths }) => sum + (hundredths ?? 0), 0)
  const hasInvalidInput = fields.some(({ hundredths }) => hundredths === null)
  const valid = !hasInvalidInput && total === 10000
  const weights = Object.fromEntries(fields.map(({ criterion, hundredths }) => [criterion.id, (hundredths ?? 0) / 10000])) as CriterionVector

  function editWeight(id: CriterionId, value: string) {
    setMessage('')
    updateDraft((previous) => {
      const next = { ...previous, [id]: value }
      if (value === percentageText(session.weights[id])) delete next[id]
      return next
    })
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid || locked) return
    setWeights(evaluator.id, weights)
    updateDraft(() => ({}))
    setMessage('Bobot penilai telah disimpan.')
  }

  function reset() {
    if (locked) return
    setWeights(evaluator.id, dataset.weights[evaluator.id])
    updateDraft(() => ({}))
    setMessage('Bobot bawaan telah dipulihkan.')
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
        <EvaluationHeading title="Pengaturan Bobot Kriteria" description="Atur proporsi kelima kriteria. Perubahan diterapkan ketika Anda menyimpan bobot.">
          <Badge tone="info">Penilai: {evaluator.name}</Badge>
        </EvaluationHeading>
        <EvaluationPanel title="Total Bobot" action={<span role="status"><Badge tone={valid ? 'active' : 'warning'}>{valid ? 'Valid (100%)' : 'Belum valid'}</Badge></span>}>
          <div className="flex items-baseline justify-between gap-2">
            <strong className="text-2xl tabular-nums">{formatWeight(total / 10000)}</strong>
            <span className="text-xs text-slate-600">Target 100%</span>
          </div>
          <progress aria-label="Total bobot dibanding target 100 persen" value={Math.min(total, 10000)} max={10000} className="mt-2 h-2 w-full accent-teal-700" />
        </EvaluationPanel>
      </div>
      <EvaluatorRoleBanner evaluator={evaluator} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)] xl:items-start">
        <EvaluationPanel title="Distribusi Bobot" description="Rentang 0% sampai 100% per kriteria.">
          <form noValidate onSubmit={save} className="space-y-3">
            {locked && <p className="flex items-center gap-2 rounded-lg bg-teal-50 p-3 text-sm text-teal-900"><LockKeyhole size={16} aria-hidden="true" /> Bobot terkunci bersama sesi penilaian.</p>}
            {fields.map(({ criterion, text, hundredths }) => (
              <div key={criterion.id} className="rounded-lg bg-blue-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge tone="info">{criterion.id}</Badge>
                    <strong className="text-sm">{criterion.name}</strong>
                    <CriterionBadge direction={criterion.direction} />
                  </div>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="number"
                      aria-label={`Persentase ${criterionLabels[criterion.id]}`}
                      aria-invalid={hundredths === null}
                      aria-describedby={hundredths === null ? `weight-error-${criterion.id}` : undefined}
                      min="0"
                      max="100"
                      step="0.01"
                      value={text}
                      disabled={locked}
                      className={`${fieldStyle} w-24 text-right tabular-nums aria-[invalid=true]:border-orange-700`}
                      onChange={(event) => editWeight(criterion.id, event.target.value)}
                    />
                    <span aria-hidden="true">%</span>
                  </label>
                </div>
                <input
                  type="range"
                  aria-label={`Slider bobot ${criterionLabels[criterion.id]}`}
                  min="0"
                  max="100"
                  step="0.01"
                  value={(hundredths ?? 0) / 100}
                  disabled={locked}
                  className="mt-2 h-11 w-full cursor-pointer accent-teal-700 disabled:cursor-not-allowed"
                  onChange={(event) => editWeight(criterion.id, event.target.value)}
                />
                {hundredths === null && <p id={`weight-error-${criterion.id}`} className="text-xs text-orange-900">Masukkan 0 sampai 100 dengan maksimal dua desimal.</p>}
              </div>
            ))}
            {!valid && <p className="text-sm font-medium text-orange-900">{hasInvalidInput ? 'Periksa nilai pada kolom bobot.' : 'Total bobot harus tepat 100% sebelum disimpan.'}</p>}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={reset} disabled={locked}><RotateCcw size={16} aria-hidden="true" /> Reset Default</Button>
              <Button type="submit" disabled={!valid || locked}><Save size={16} aria-hidden="true" /> Simpan Bobot</Button>
            </div>
            {message && <p role="status" className="text-sm font-medium text-teal-900">{message}</p>}
          </form>
        </EvaluationPanel>
        <div className="space-y-4">
          <EvaluationPanel title="Proporsi Bobot Saat Ini">
            <WeightDonut criteria={dataset.criteria} weights={weights} />
          </EvaluationPanel>
          <aside className="rounded-xl bg-navy-950 p-4 text-sm text-white">
            <h2 className="font-semibold">Catatan Metodologi</h2>
            <p className="mt-2 leading-relaxed text-slate-200">TOPSIS mengalikan nilai ternormalisasi dengan bobot milik penilai aktif.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}
