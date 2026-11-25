import { Award, Medal, UsersRound } from 'lucide-react'
import { RankingBars } from '../components/charts/EvaluationCharts'
import { Badge } from '../components/ui/Badge'
import { EvaluationHeading, EvaluationPanel, fieldStyle } from '../components/ui/EvaluationUi'
import { MetricCard } from '../components/ui/MetricCard'
import { Table } from '../components/ui/Table'
import { evaluators } from '../data/evaluators'
import { formatScore } from '../lib/gdssFormat'
import { coordinator } from '../lib/selectionWorkflow'
import { useGDSS } from '../state/GDSSContext'
import { useSelection } from '../state/SelectionContext'
import type { BordaStatus, Evaluator } from '../types'

const statusStyles = {
  lolos: { label: 'Masuk Kuota', tone: 'active', row: 'bg-teal-50', bar: 'highlight' },
  cadangan: { label: 'Cadangan', tone: 'neutral', row: 'even:bg-slate-50', bar: 'reserve' },
  'perlu-penyelesaian-seri': { label: 'Seri Batas Kuota', tone: 'warning', row: 'bg-orange-50', bar: 'pending' },
} as const

function QuotaBadge({ status }: { status: BordaStatus }) {
  const style = statusStyles[status]
  return <Badge tone={style.tone}>{style.label}</Badge>
}

export function ConsensusPage({ evaluator }: { evaluator: Evaluator }) {
  const { dataset: { alternatives }, topsis, borda, quota, quotaLocked, allLocked } = useGDSS()
  const { busy, changeQuota } = useSelection()
  const names = new Map(alternatives.map(({ id, name }) => [id, name]))
  const ranksByEvaluator = new Map(evaluators.map(({ id }) => [
    id,
    new Map(topsis[id]?.rankings.map(({ alternativeId, rank }) => [alternativeId, rank])),
  ]))
  const highest = borda?.rankings[0]?.totalPoints
  const maximum = (alternatives.length - 1) * evaluators.length

  return (
    <div className="space-y-5">
      <EvaluationHeading title="Hasil Konsensus Borda" description="Bandingkan penilaian ketiga evaluator dan lihat rekomendasi berdasarkan kuota.">
        <label className="grid gap-1 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium">
          <span className="flex items-center gap-2"><Award size={18} className="text-teal-800" aria-hidden="true" /> Kuota Penerima</span>
          <select className={fieldStyle} value={quota} disabled={evaluator.id !== coordinator || quotaLocked || busy || !alternatives.length} onChange={(event) => changeQuota(evaluator.id, Number(event.target.value))}>
            {!alternatives.length && <option value={0}>Belum ada kandidat</option>}
            {alternatives.map(({ id }, index) => <option key={id} value={index + 1}>{index + 1} mahasiswa</option>)}
          </select>
        </label>
      </EvaluationHeading>
      <dl className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total Kandidat" value={alternatives.length} icon={UsersRound} detail="Alternatif dalam periode simulasi" />
        <MetricCard label="Skor Borda Tertinggi" value={highest === undefined ? '-' : formatScore(highest)} icon={Medal} detail="Poin gabungan" tone="navy" />
        <MetricCard label="Jumlah Penilai (DM)" value={evaluators.length} icon={Award} detail={allLocked ? 'Semua sesi terkunci' : 'Ada sesi yang masih draf'} />
      </dl>

      {!borda ? (
        <p role="status" className="rounded-xl bg-orange-50 p-4 text-sm text-orange-900">Konsensus tersedia setelah ketiga penilai memiliki bobot yang valid.</p>
      ) : (
        <>
          {borda.pendingTie.length > 0 && (
            <p role="status" className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
              {borda.pendingTie.join(', ')} seri pada batas kuota. Kandidat ini menunggu penyelesaian seri.
            </p>
          )}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)] xl:items-start">
            <EvaluationPanel
              title="Tabel Perbandingan Peringkat & Poin Borda"
              description={`Poin per penilai = ${alternatives.length} - peringkat individual. Angka dalam kurung menunjukkan poin.`}
              action={<Badge tone="active">Kuota {quota}</Badge>}
            >
              <Table caption="Peringkat dan poin konsensus Borda" regionClassName="max-h-none md:max-h-[24rem] overflow-auto" className="min-w-[39rem] tabular-nums [&_td]:px-2 [&_th]:px-2 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead_th]:text-xs">
                <thead>
                  <tr>
                    <th scope="col">Kode</th>
                    <th scope="col">Nama Mahasiswa</th>
                    {evaluators.map(({ id, name }) => <th key={id} scope="col" className="text-center">{name}</th>)}
                    <th scope="col" className="text-center">Total Poin Borda</th>
                    <th scope="col" className="text-center">Peringkat Akhir</th>
                    <th scope="col">Status Kuota</th>
                  </tr>
                </thead>
                <tbody>
                  {borda.rankings.map(({ alternativeId, pointsByEvaluator, totalPoints, rank, status }) => (
                    <tr key={alternativeId} className={statusStyles[status].row}>
                      <th scope="row">{alternativeId}</th>
                      <td className="min-w-28 font-medium">{names.get(alternativeId)}</td>
                      {evaluators.map(({ id }) => {
                        const individualRank = ranksByEvaluator.get(id)?.get(alternativeId)
                        return (
                          <td key={id} className="whitespace-nowrap text-center">
                            {individualRank === undefined ? '-' : formatScore(individualRank)}{' '}
                            <span className="text-slate-700">({formatScore(pointsByEvaluator[id])})</span>
                          </td>
                        )
                      })}
                      <td className="text-center font-semibold">{formatScore(totalPoints)}</td>
                      <td className="text-center font-semibold">{formatScore(rank)}</td>
                      <td><QuotaBadge status={status} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="mt-3 text-xs text-slate-600">Geser tabel untuk melihat semua kandidat dan kolom.</p>
            </EvaluationPanel>
            <EvaluationPanel title="Perbandingan Total Poin Borda" description={`Skor maksimum ${maximum} poin dari tiga penilai.`}>
              <RankingBars
                bars={borda.rankings.map(({ alternativeId, totalPoints, status }) => ({ id: alternativeId, value: totalPoints, tone: statusStyles[status].bar }))}
                variant="borda"
                maximum={maximum}
              />
            </EvaluationPanel>
          </div>
        </>
      )}
    </div>
  )
}
