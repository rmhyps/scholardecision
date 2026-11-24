import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

interface ModalProps {
  children: ReactNode
  className?: string
  drawer?: boolean
  id?: string
  onClose: () => void
  open: boolean
  title: string
}

export function Modal({ children, className, drawer = false, id, onClose, open, title }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const element = dialog.current
    if (!element || element.open === open) return
    if (open) element.showModal()
    else element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      id={id}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className={cn(
        'bg-white text-slate-900 backdrop:bg-navy-950/60',
        drawer
          ? 'fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[min(19rem,calc(100vw-1.5rem))] max-w-none bg-navy-950 text-white'
          : 'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg rounded-xl shadow-xl',
        className,
      )}
    >
      {open && (
        <motion.div
          className={cn(drawer ? 'flex min-h-full flex-col' : 'p-5 sm:p-6')}
          initial={reduceMotion ? false : { opacity: 0, x: drawer ? -12 : 0, y: drawer ? 0 : 6 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          <div className={cn('flex items-center justify-between gap-3', drawer ? 'px-4 pt-2' : 'mb-3')}>
            <h2 id={titleId} className={cn('font-semibold', drawer ? 'text-sm text-slate-200' : 'text-lg')}>
              {title}
            </h2>
            <Button
              variant="ghost"
              aria-label="Tutup"
              onClick={onClose}
              className={cn('size-11 p-0', drawer && 'text-slate-200 hover:bg-navy-800 hover:text-white')}
            >
              <X size={20} aria-hidden="true" />
            </Button>
          </div>
          {children}
        </motion.div>
      )}
    </dialog>
  )
}
