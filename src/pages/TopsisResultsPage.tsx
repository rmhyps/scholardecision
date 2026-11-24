import { LockKeyhole } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { RankingBars } from '../components/charts/EvaluationCharts'
import { Badge } from '../components/ui/Badge'
import { EvaluationHeading, EvaluatorRoleBanner, EvaluationPanel } from '../components/ui/EvaluationUi'
import { Table } from '../components/ui/Table'
import { cn } from '../lib/cn'
import { criterionLabels, formatPrecision, formatScore } from '../lib/gdssFormat'
import { useGDSS } from '../state/GDSSContext'
import type { Candidate, CriterionDefinition, Evaluator, TOPSISResult } from '../types'

const tabLabels = ['Matriks Ternormalisasi (R)', 'Matriks Terbobot (Y)', 'Solusi Ideal (A+ dan A-)', 'Jarak Solusi (D+ dan D-)'] as const

function priorityLabel(rank: number, highest: boolean) {
  if (highest) return <Badge tone="active">Prioritas Utama</Badge>
  if (rank <= 3) return <Badge tone="info">Direkomendasikan</Badge>
  return <Badge>Cadangan</Badge>
}

function TopsisDetails({ result, criteria, alternatives }: {
  result: TOPSISResult
  criteria: readonly CriterionDefinition[]
  alternatives: readonly Candidate[]
}) {
  const [tab, setTab] = useState(0)
  const tabId = useId()
  const buttons = useRef<Array<HTMLButtonElement | null>>([])

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % tabLabels.length; break
      case 'ArrowLeft': next = (index + tabLabels.length - 1) % tabLabels.length; break
      case 'Home': next = 0; break
      case 'End': next = tabLabels.length - 1; break
      default: return
    }
    event.preventDefault()
    setTab(next)
    buttons.current[next]?.focus()
  }

  const matrixRows = tab === 2
    ? [{ id: 'A+', values: result.idealPositive }, { id: 'A-', values: result.idealNegative }]
    : alternatives.map(({ id }) => ({ id, values: tab === 0 ? result.normalized[id] : result.weighted[id] }))

  return (
    <EvaluationPanel title="Detail Proses Perhitungan TOPSIS" description="Tinjau nilai setiap tahap yang membentuk peringkat individual.">
      <div role="tablist" aria-label="Tahap perhitungan TOPSIS" className="mb-4 flex flex-wrap gap-2">
        {tabLabels.map((label, index) => (
          <button
            key={label}
            id={`${tabId}-tab-${index}`}
            ref={(node) => { buttons.current[index] = node }}
            type="button"
            role="tab"
            aria-selected={tab === index}
            aria-controls={`${tabId}-panel`}
            tabIndex={tab === index ? 0 : -1}
            onClick={() => setTab(index)}
            onKeyDown={(event) => navigateTabs(event, index)}
            className={cn('min-h-11 rounded-lg px-3 py-2 text-left text-sm font-semibold', tab === index ? 'bg-navy-950 text-white focus-visible:outline-teal-600' : 'bg-blue-50 text-navy-950 hover:bg-blue-100')}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${tabId}-panel`} aria-labelledby={`${tabId}-tab-${tab}`}>
        {tab === 3 ? (
          <Table caption={tabLabels[tab]} className="min-w-[29rem] tabular-nums">
            <thead><tr><th scope="col">Kode</th><th scope="col">D+</th><th scope="col">D-</th><th scope="col">Vi</th></tr></thead>
            <tbody>
              {result.rankings.map(({ alternativeId, distancePositive, distanceNegative, preference }) => (
                <tr key={alternativeId} className="even:bg-slate-50">
                  <th scope="row">{alternativeId}</th>
                  <td>{formatPrecision(distancePositive)}</td>
                  <td>{formatPrecision(distanceNegative)}</td>
                  <td className="font-semibold">{formatPrecision(preference)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table caption={tabLabels[tab]} className="min-w-[37rem] tabular-nums">
            <thead>
              <tr>
                <th scope="col">{tab === 2 ? 'Solusi' : 'Alternatif'}</th>
                {criteria.map(({ id }) => <th key={id} scope="col">{id} {criterionLabels[id]}</th>)}
              </tr>
            </thead>
            <tbody>
              {tab === 0 && (
                <tr className="bg-teal-50">
                  <th scope="row">Norm pembagi</th>
                  {criteria.map(({ id }) => <td key={id}>{formatPrecision(result.norms[id])}</td>)}
                </tr>
              )}
              {matrixRows.map(({ id, values }) => (
                <tr key={id} className="even:bg-slate-50">
                  <th scope="row">{id}</th>
                  {criteria.map((criterion) => <td key={criterion.id}>{formatPrecision(values[criterion.id])}</td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </EvaluationPanel>
  )
}

export function TopsisResultsPage({ evaluator }: { evaluator: Evaluator }) {
  const { dataset: { alternatives, criteria }, sessions, topsis } = useGDSS()
  const result = topsis[evaluator.id]
  const locked = sessions[evaluator.id].status === 'terkunci'
  const names = new Map(alternatives.map(({ id, name }) => [id, name]))
  const highest = result?.rankings[0]?.preference

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Hasil Perhitungan TOPSIS" description="Peringkat individual berdasarkan kedekatan relatif terhadap solusi ideal.">
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">Penilai: {evaluator.name}</Badge>
          <Badge tone={locked ? 'active' : 'warning'}>
            {locked && <LockKeyhole size={13} aria-hidden="true" />}
            {locked ? 'Penilaian Terkunci' : 'Hasil Draf'}
          </Badge>
        </div>
      </EvaluationHeading>
      <EvaluatorRoleBanner evaluator={evaluator} />

      {!result ? (
        <p role="status" className="rounded-xl bg-orange-50 p-4 text-sm text-orange-900">{alternatives.length ? 'Hasil tersedia setelah bobot penilai berjumlah 100%.' : 'Belum ada kandidat untuk diperingkat.'}</p>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(17rem,1fr)] xl:items-start">
            <EvaluationPanel title="Tabel Peringkat TOPSIS Individual" description="Skor tertinggi menjadi Prioritas Utama. Kandidat lain hingga peringkat tiga direkomendasikan." action={<Badge tone="info">{result.rankings.length} kandidat</Badge>}>
              <Table caption="Peringkat TOPSIS penilai aktif" regionClassName="max-h-[24rem] overflow-auto" className="min-w-[31rem] tabular-nums [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10">
                <thead>
                  <tr>
                    {['Peringkat', 'Kode', 'Nama Mahasiswa', 'Nilai Vi', 'Status'].map((label) => <th key={label} scope="col">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.rankings.map(({ alternativeId, rank, preference }) => (
                    <tr key={alternativeId} className={preference === highest ? 'bg-teal-50' : 'even:bg-slate-50'}>
                      <td>{formatScore(rank)}</td>
                      <th scope="row">{alternativeId}</th>
                      <td className="min-w-28 font-medium">{names.get(alternativeId)}</td>
                      <td className="font-semibold">{formatPrecision(preference)}</td>
                      <td>{priorityLabel(rank, preference === highest)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </EvaluationPanel>
            <EvaluationPanel title="Perbandingan Nilai Preferensi (Vi)" description="Skala 0 sampai 1.">
              <RankingBars
                bars={result.rankings.map(({ alternativeId, preference }) => ({ id: alternativeId, value: preference, tone: preference === highest ? 'highlight' : 'reserve' }))}
                variant="topsis"
                maximum={1}
              />
            </EvaluationPanel>
          </div>
          <TopsisDetails result={result} criteria={criteria} alternatives={alternatives} />
        </>
      )}
    </div>
  )
}
