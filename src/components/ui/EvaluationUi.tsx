import { useId } from 'react'
import type { ReactNode } from 'react'
import type { Criterion, Evaluator, EvaluatorId } from '../../types'
import { cn } from '../../lib/cn'
import { Badge } from './Badge'

export const fieldStyle = 'min-h-11 w-full rounded-lg border border-slate-500 bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100'

export function EvaluationHeading({ title, description, children }: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 id="page-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function EvaluationPanel({ title, description, action, children, className }: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={cn('min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={titleId} className="font-semibold text-navy-950">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

const roleFocus: Record<EvaluatorId, string> = {
  kemahasiswaan: 'Portofolio, verifikasi berkas, dan pengesahan hasil seleksi.',
  'dosen-wali': 'Evaluasi akademik dengan fokus pada IPK dan prestasi.',
  'pengelola-beasiswa': 'Evaluasi finansial dengan fokus pada penghasilan orang tua dan tanggungan.',
}

export function EvaluatorRoleBanner({ evaluator }: { evaluator: Evaluator }) {
  return (
    <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
      <strong className="block text-navy-950">{evaluator.name}</strong>
      {roleFocus[evaluator.id]}
    </p>
  )
}

export function CriterionBadge({ direction }: { direction: Criterion['direction'] }) {
  return direction === 'cost'
    ? <Badge tone="warning">Cost</Badge>
    : <Badge tone="active">Benefit</Badge>
}
