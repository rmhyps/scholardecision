import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/cn'

interface TableProps extends ComponentPropsWithoutRef<'table'> {
  caption: string
  regionClassName?: string
}

export function Table({ caption, children, className, regionClassName, ...props }: TableProps) {
  return (
    <div role="region" aria-label={caption} tabIndex={0} className={cn('max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white', regionClassName)}>
      <table
        className={cn(
          'w-full text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_thead_th]:bg-blue-50 [&_th]:px-4 [&_th]:py-3 [&_tr]:border-b [&_tr]:border-slate-200 [&_tbody_tr:last-child]:border-b-0',
          className,
        )}
        {...props}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}
