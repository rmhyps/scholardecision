import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface MetricCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: 'default' | 'navy'
  detail?: string
}

export function MetricCard({ label, value, icon: Icon, tone = 'default', detail }: MetricCardProps) {
  const dark = tone === 'navy'
  return (
    <div className={cn('relative min-w-0 rounded-xl border p-5', dark ? 'border-navy-950 bg-navy-950' : 'border-slate-200 bg-white')}>
      <dt className={cn('pr-12 text-sm font-medium', dark ? 'text-slate-200' : 'text-slate-600')}>{label}</dt>
      <dd className={cn('mt-2 text-3xl font-semibold tabular-nums tracking-tight', dark ? 'text-white' : 'text-slate-900')}>{value}</dd>
      {detail && <dd className={cn('mt-1 text-xs', dark ? 'text-teal-200' : 'text-slate-600')}>{detail}</dd>}
      <div aria-hidden="true" className={cn('absolute right-5 top-5 grid size-9 place-items-center rounded-lg', dark ? 'bg-navy-800 text-teal-200' : 'bg-teal-50 text-teal-800')}>
        <Icon size={18} />
      </div>
    </div>
  )
}
