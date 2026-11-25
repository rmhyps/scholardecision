import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { criterionLabels, formatPrecision, formatScore, formatWeight } from '../../lib/gdssFormat'
import type { CriterionDefinition, CriterionVector } from '../../types'
import type { ChartBar } from './EvaluationCharts'

const criterionColors = ['#102847', '#b45309', '#08745e', '#465f86', '#0e7490']
const barColors = { highlight: '#08745e', reserve: '#55749c', pending: '#b45309' }

export function WeightDonutView({ criteria, weights }: { criteria: readonly CriterionDefinition[]; weights: CriterionVector }) {
  const slices = criteria.map(({ id }, index) => ({
    id, name: criterionLabels[id], weight: weights[id], fill: criterionColors[index],
  }))
  const total = slices.reduce((sum, item) => sum + item.weight, 0)

  return (
    <div className="min-w-0">
      {total > 0 ? (
        <div className="relative h-48 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 220, height: 192 }}>
            <PieChart accessibilityLayer>
              <Pie data={slices} dataKey="weight" nameKey="name" innerRadius="64%" outerRadius="87%" isAnimationActive={false} />
              <Tooltip formatter={(value) => formatWeight(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <strong className="text-xl text-navy-950">{formatWeight(total)}</strong>
          </div>
        </div>
      ) : <p className="grid h-48 place-items-center text-sm text-slate-600">Belum ada bobot untuk digrafikkan.</p>}
      <ul className="mt-2 space-y-2 text-sm">
        {slices.map(({ id, name, weight, fill }) => (
          <li key={id} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: fill }} />
            <span className="min-w-0 flex-1">{id} {name}</span>
            <strong className="tabular-nums">{formatWeight(weight)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RankingBarsView({ bars, variant, maximum }: {
  bars: readonly ChartBar[]
  variant: 'topsis' | 'borda'
  maximum: number
}) {
  const isTopsis = variant === 'topsis'
  const items = bars.map((bar) => ({ ...bar }))
  const chartHeight = isTopsis ? 352 : Math.max(256, items.length * 44 + 34)
  const legend = [
    { tone: 'highlight' as const, title: isTopsis ? 'Prioritas Utama' : 'Masuk Kuota' },
    { tone: 'reserve' as const, title: isTopsis ? 'Kandidat lainnya' : 'Cadangan' },
    ...(bars.some(({ tone }) => tone === 'pending') ? [{ tone: 'pending' as const, title: 'Seri batas kuota' }] : []),
  ]

  return (
    <div className="min-w-0">
      <ResponsiveContainer width="100%" height={chartHeight} minWidth={0} initialDimension={{ width: 300, height: chartHeight }}>
        <BarChart data={items} layout="vertical" margin={{ top: 4, right: isTopsis ? 8 : 12, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" domain={[0, maximum]} allowDecimals={isTopsis} tick={{ fill: '#475569', fontSize: 11 }} tickCount={5} />
          <YAxis type="category" dataKey="id" width={38} interval={0} tick={{ fill: '#334155', fontSize: isTopsis ? 10 : 11 }} />
          <Tooltip formatter={(value) => isTopsis
            ? [formatPrecision(Number(value)), 'Nilai Vi']
            : [formatScore(Number(value)), 'Poin Borda']} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
            {items.map(({ id, tone }) => <Cell key={id} fill={barColors[tone]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs text-slate-700">
        {legend.map(({ title, tone }) => (
          <li key={title} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: barColors[tone] }} />
            {title}
          </li>
        ))}
      </ul>
    </div>
  )
}
