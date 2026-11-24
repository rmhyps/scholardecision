import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

export function WorkflowStepper({ labels, current, complete = false, dark = false }: {
  labels: readonly string[]
  current: number
  complete?: boolean
  dark?: boolean
}) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Tahapan seleksi">
      {labels.map((label, index) => {
        const done = complete || index < current
        const active = index === current
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border px-3 py-3 text-sm font-semibold',
              active && !done ? 'border-teal-700 bg-teal-700 text-white'
                : dark ? 'border-slate-500 bg-navy-900 text-slate-100'
                : done ? 'border-teal-200 bg-teal-50 text-teal-900'
                : 'border-blue-100 bg-blue-50 text-slate-700',
            )}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-current text-xs">
              {done ? <Check size={15} aria-hidden="true" /> : index + 1}
            </span>
            <span><span className="sr-only">Tahap {index + 1}: </span>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
