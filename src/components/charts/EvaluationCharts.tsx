import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import type { CriterionDefinition, CriterionVector } from '../../types'

const WeightDonutView = lazy(() => import('./RechartsViews').then((module) => ({ default: module.WeightDonutView })))
const RankingBarsView = lazy(() => import('./RechartsViews').then((module) => ({ default: module.RankingBarsView })))

function ChartLoading({ children, height }: { children: ReactNode; height: number }) {
  return (
    <Suspense fallback={<p role="status" className="grid place-items-center text-sm text-slate-600" style={{ minHeight: height }}>Memuat grafik...</p>}>
      {children}
    </Suspense>
  )
}

export type ChartBar = {
  id: string
  value: number
  tone: 'highlight' | 'reserve' | 'pending'
}

export function WeightDonut({ criteria, weights }: { criteria: readonly CriterionDefinition[]; weights: CriterionVector }) {
  return <ChartLoading height={210}><WeightDonutView criteria={criteria} weights={weights} /></ChartLoading>
}

export function RankingBars({ bars, variant, maximum }: {
  bars: readonly ChartBar[]
  variant: 'topsis' | 'borda'
  maximum: number
}) {
  return <ChartLoading height={320}><RankingBarsView bars={bars} variant={variant} maximum={maximum} /></ChartLoading>
}
