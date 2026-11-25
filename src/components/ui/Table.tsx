import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/cn'

interface TableProps extends ComponentPropsWithoutRef<'table'> {
  caption: string
  regionClassName?: string
  stickyFirstColumn?: boolean
}

export function Table({ caption, children, className, regionClassName, stickyFirstColumn, ...props }: TableProps) {
  return (
    <div role="region" aria-label={caption} tabIndex={0} className={cn('max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white', stickyFirstColumn && 'isolate scroll-pl-32 sm:scroll-pl-40', regionClassName)}>
      <table
        className={cn(
          'w-full text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_thead_th]:bg-blue-50 [&_th]:px-4 [&_th]:py-3 [&_tr]:border-b [&_tr]:border-slate-200 [&_tbody_tr:last-child]:border-b-0',
          stickyFirstColumn && '[&_tr>th:first-child]:sticky [&_tr>th:first-child]:left-0 [&_tr>th:first-child]:z-10 [&_tr>th:first-child]:bg-white [&_tr>th:first-child]:shadow-[2px_0_4px_rgba(0,0,0,0.06)]',
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
