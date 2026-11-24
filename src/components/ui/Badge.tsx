import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

const tones = {
  active: 'bg-teal-100 text-teal-900',
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-blue-100 text-navy-950',
  warning: 'bg-orange-100 text-orange-950',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold', tones[tone])}>
      {children}
    </span>
  )
}
