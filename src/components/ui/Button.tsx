import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'border border-slate-500 bg-white text-slate-800 hover:bg-slate-100',
  ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: keyof typeof variants
}

export function Button({ className, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
